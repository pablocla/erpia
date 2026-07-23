/**
 * Aplica un pago MP aprobado de un deudor → recibo + CC + libreta fiado.
 * Idempotente por mpPaymentId / transacción ya conciliada.
 */

import { prisma } from "@/lib/prisma"
import { parseDeudorPagoRef } from "@/lib/mercadopago/deudor-pago-ref"
import { cobrarFiadoLibreta } from "@/lib/fiado/fiado-service"
import { cobrosService } from "@/lib/cobros/cobros-service"

export type AplicarPagoDeudorResult =
  | { ok: true; skipped?: boolean; reciboId?: number; reciboNumero?: string; reason?: string }
  | { ok: false; error: string }

export async function aplicarPagoDeudorDesdeMp(input: {
  empresaId: number
  transaccionId: number
  externalRef: string
  monto: number
  mpPaymentId: string
}): Promise<AplicarPagoDeudorResult> {
  const txRow = await prisma.mercadoPagoTransaccion.findUnique({
    where: { id: input.transaccionId },
    select: { id: true, conciliado: true, empresaId: true, estado: true },
  })
  if (!txRow || txRow.empresaId !== input.empresaId) {
    return { ok: false, error: "Transacción no encontrada" }
  }
  if (txRow.conciliado) {
    return { ok: true, skipped: true, reason: "already_conciliado" }
  }
  if (txRow.estado !== "approved") {
    return { ok: true, skipped: true, reason: "not_approved" }
  }

  const ref = parseDeudorPagoRef(input.externalRef)
  const monto = Math.round(Number(input.monto) * 100) / 100
  if (monto <= 0) return { ok: false, error: "Monto inválido" }

  const obs = `Pago MP ${input.mpPaymentId} ref=${input.externalRef}`

  try {
    if (ref.kind === "fiado") {
      const cliente = await prisma.cliente.findFirst({
        where: { id: ref.clienteId, empresaId: input.empresaId },
        select: { id: true },
      })
      if (!cliente) return { ok: false, error: "Cliente no encontrado" }

      // Preferir cobro de libreta (recibo + CC + saldo)
      const result = await cobrarFiadoLibreta({
        empresaId: input.empresaId,
        clienteId: ref.clienteId,
        monto,
        medioPago: "tarjeta",
        observaciones: obs,
      })

      if (!result.ok) {
        // Fallback: si no hay deuda libreta pero hay CC por id
        if (ref.cuentaCobrarId) {
          return aplicarSobreCc(input.empresaId, ref.cuentaCobrarId, monto, obs, input.transaccionId)
        }
        return { ok: false, error: result.error }
      }

      await prisma.mercadoPagoTransaccion.update({
        where: { id: input.transaccionId },
        data: {
          conciliado: true,
          cuentaCobrarId: result.cuentasAplicadas[0] ?? ref.cuentaCobrarId ?? null,
          facturaId: ref.facturaId > 0 ? ref.facturaId : null,
        },
      })

      // ED-30: recibo digital por WhatsApp (best-effort)
      void enviarReciboWaDeudor({
        empresaId: input.empresaId,
        clienteId: ref.clienteId,
        monto,
      })

      return {
        ok: true,
        reciboId: result.reciboId,
        reciboNumero: result.reciboNumero,
      }
    }

    if (ref.kind === "cxc") {
      return aplicarSobreCc(input.empresaId, ref.cuentaCobrarId, monto, obs, input.transaccionId)
    }

    if (ref.kind === "fac") {
      const ccs = await prisma.cuentaCobrar.findMany({
        where: {
          facturaId: ref.facturaId,
          cliente: { empresaId: input.empresaId },
          saldo: { gt: 0 },
          estado: { in: ["pendiente", "parcial", "vencida"] },
        },
        orderBy: { fechaVencimiento: "asc" },
      })
      if (ccs.length === 0) {
        await prisma.mercadoPagoTransaccion.update({
          where: { id: input.transaccionId },
          data: { facturaId: ref.facturaId, conciliado: true },
        })
        return { ok: true, skipped: true, reason: "no_open_cc" }
      }

      let restante = monto
      const items: { cuentaCobrarId: number; monto: number }[] = []
      for (const cc of ccs) {
        if (restante <= 0) break
        const aplica = Math.min(Number(cc.saldo), restante)
        items.push({ cuentaCobrarId: cc.id, monto: Math.round(aplica * 100) / 100 })
        restante = Math.round((restante - aplica) * 100) / 100
      }

      const cobro = await cobrosService.registrarCobro({
        empresaId: input.empresaId,
        clienteId: ccs[0].clienteId,
        items,
        medioPago: "tarjeta",
        observaciones: obs,
      })

      await prisma.mercadoPagoTransaccion.update({
        where: { id: input.transaccionId },
        data: {
          conciliado: true,
          facturaId: ref.facturaId,
          cuentaCobrarId: items[0]?.cuentaCobrarId,
        },
      })

      return {
        ok: true,
        reciboId: cobro.reciboId,
        reciboNumero: cobro.reciboNumero,
      }
    }

    return { ok: true, skipped: true, reason: "unknown_ref" }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error aplicando pago deudor",
    }
  }
}

async function enviarReciboWaDeudor(input: {
  empresaId: number
  clienteId: number
  monto: number
}) {
  try {
    const [cliente, empresa] = await Promise.all([
      prisma.cliente.findFirst({
        where: { id: input.clienteId, empresaId: input.empresaId },
        select: {
          nombre: true,
          telefono: true,
          telefonoAlternativo: true,
          saldoCuentaCorriente: true,
        },
      }),
      prisma.empresa.findUnique({
        where: { id: input.empresaId },
        select: { nombre: true },
      }),
    ])
    if (!cliente) return
    const { encolarReciboPagoFiado } = await import("@/lib/fiado/fiado-whatsapp")
    const saldo = Number(cliente.saldoCuentaCorriente)
    await encolarReciboPagoFiado({
      empresaId: input.empresaId,
      clienteNombre: cliente.nombre,
      telefono: cliente.telefono || cliente.telefonoAlternativo,
      monto: input.monto,
      saldoRestante: saldo < 0 ? Math.abs(saldo) : 0,
      almacenNombre: empresa?.nombre,
    })
  } catch (err) {
    console.warn("[MP] recibo WA deudor:", err)
  }
}

async function aplicarSobreCc(
  empresaId: number,
  cuentaCobrarId: number,
  monto: number,
  obs: string,
  transaccionId: number,
): Promise<AplicarPagoDeudorResult> {
  const cc = await prisma.cuentaCobrar.findFirst({
    where: { id: cuentaCobrarId, cliente: { empresaId } },
    select: { id: true, clienteId: true, saldo: true },
  })
  if (!cc) return { ok: false, error: "Cuenta a cobrar no encontrada" }

  const aplica = Math.min(monto, Number(cc.saldo))
  if (aplica <= 0) {
    await prisma.mercadoPagoTransaccion.update({
      where: { id: transaccionId },
      data: { conciliado: true, cuentaCobrarId },
    })
    return { ok: true, skipped: true, reason: "cc_already_paid" }
  }

  // Intentar vía libreta (sincroniza ambos libros)
  const viaFiado = await cobrarFiadoLibreta({
    empresaId,
    clienteId: cc.clienteId,
    monto: aplica,
    medioPago: "tarjeta",
    observaciones: obs,
  })

  if (viaFiado.ok) {
    await prisma.mercadoPagoTransaccion.update({
      where: { id: transaccionId },
      data: { conciliado: true, cuentaCobrarId },
    })
    void enviarReciboWaDeudor({
      empresaId,
      clienteId: cc.clienteId,
      monto: aplica,
    })
    return {
      ok: true,
      reciboId: viaFiado.reciboId,
      reciboNumero: viaFiado.reciboNumero,
    }
  }

  const cobro = await cobrosService.registrarCobro({
    empresaId,
    clienteId: cc.clienteId,
    items: [{ cuentaCobrarId: cc.id, monto: aplica }],
    medioPago: "tarjeta",
    observaciones: obs,
  })

  await prisma.mercadoPagoTransaccion.update({
    where: { id: transaccionId },
    data: { conciliado: true, cuentaCobrarId },
  })

  void enviarReciboWaDeudor({
    empresaId,
    clienteId: cc.clienteId,
    monto: aplica,
  })

  return {
    ok: true,
    reciboId: cobro.reciboId,
    reciboNumero: cobro.reciboNumero,
  }
}
