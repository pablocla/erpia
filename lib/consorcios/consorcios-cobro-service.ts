/**
 * Cobro de expensa: recibo + CxC + marca expensa pagada + baja saldo UF/cliente.
 */

import { prisma } from "@/lib/prisma"
import { cobrosService } from "@/lib/cobros/cobros-service"

export type CobrarExpensaResult =
  | { ok: true; reciboId: number; reciboNumero?: string; expensaId: number }
  | { ok: false; error: string }

export async function cobrarExpensa(
  empresaId: number,
  expensaId: number,
  opts?: {
    monto?: number
    medioPago?: "efectivo" | "transferencia" | "tarjeta" | "cheque"
    observaciones?: string
  },
): Promise<CobrarExpensaResult> {
  const expensa = await prisma.consorcioExpensa.findFirst({
    where: {
      id: expensaId,
      unidad: { consorcio: { empresaId } },
    },
    include: {
      unidad: {
        include: {
          residente: { select: { id: true, nombre: true } },
          consorcio: { select: { nombre: true } },
        },
      },
    },
  })

  if (!expensa) return { ok: false, error: "Expensa no encontrada" }
  if (expensa.estado === "pagada") return { ok: false, error: "La expensa ya está pagada" }

  const residenteId = expensa.unidad.residenteId
  if (!residenteId) return { ok: false, error: "La unidad no tiene residente asignado" }

  const montoExpensa = Number(expensa.montoTotal)
  const monto = opts?.monto != null ? Math.round(Number(opts.monto) * 100) / 100 : montoExpensa
  if (monto <= 0) return { ok: false, error: "Monto inválido" }
  if (monto > montoExpensa + 0.01) {
    return { ok: false, error: `El cobro supera la expensa ($${montoExpensa})` }
  }

  // Preferir CC de la factura de la expensa; si no, CC abiertas del cliente con mismo concepto
  let cuentaCobrarId: number | null = null
  if (expensa.facturaId) {
    const cc = await prisma.cuentaCobrar.findFirst({
      where: {
        facturaId: expensa.facturaId,
        clienteId: residenteId,
        saldo: { gt: 0 },
        estado: { in: ["pendiente", "parcial", "vencida"] },
      },
      orderBy: { fechaVencimiento: "asc" },
    })
    cuentaCobrarId = cc?.id ?? null
  }

  if (!cuentaCobrarId) {
    const cc = await prisma.cuentaCobrar.findFirst({
      where: {
        clienteId: residenteId,
        saldo: { gt: 0 },
        estado: { in: ["pendiente", "parcial", "vencida"] },
        observaciones: { contains: expensa.periodo },
      },
      orderBy: { fechaVencimiento: "asc" },
    })
    cuentaCobrarId = cc?.id ?? null
  }

  if (!cuentaCobrarId) {
    // Crear CC residual para poder emitir recibo
    const cc = await prisma.cuentaCobrar.create({
      data: {
        facturaId: expensa.facturaId,
        clienteId: residenteId,
        numeroCuota: 1,
        montoOriginal: monto,
        montoPagado: 0,
        saldo: monto,
        fechaEmision: new Date(),
        fechaVencimiento: expensa.fechaVencimiento ?? new Date(),
        estado: "pendiente",
        observaciones: `Cobro expensa ${expensa.periodo} UF ${expensa.unidad.numero}`,
      },
    })
    cuentaCobrarId = cc.id
  }

  const recibo = await cobrosService.registrarCobro({
    empresaId,
    clienteId: residenteId,
    items: [{ cuentaCobrarId, monto }],
    medioPago: opts?.medioPago ?? "transferencia",
    observaciones:
      opts?.observaciones ??
      `Expensa ${expensa.periodo} — ${expensa.unidad.consorcio.nombre} UF ${expensa.unidad.numero}`,
    calcularRetencionesAuto: false,
  })

  const pagadaTotal = monto >= montoExpensa - 0.01
  await prisma.$transaction(async (tx) => {
    await tx.consorcioExpensa.update({
      where: { id: expensaId },
      data: { estado: pagadaTotal ? "pagada" : "parcial" },
    })
    if (pagadaTotal) {
      await tx.unidadFuncional.update({
        where: { id: expensa.unidadId },
        data: { saldo: { decrement: montoExpensa } },
      })
    }
  })

  return {
    ok: true,
    reciboId: recibo.reciboId,
    reciboNumero: recibo.reciboNumero,
    expensaId,
  }
}
