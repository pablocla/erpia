/**
 * Aplica seña de OficioTrabajo cuando MP aprueba OFICIO_SENA_{trabajoId}.
 * Idempotente: senaPagada ya true → skip (no doble cobro en flag/caja).
 * Registra movimiento de caja si hay caja abierta (best-effort).
 */
import { prisma } from "@/lib/prisma"

const REF_PREFIX = "OFICIO_SENA_"

export function parseOficioSenaRef(externalRef: string): { trabajoId: string } | null {
  if (!externalRef.startsWith(REF_PREFIX)) return null
  const trabajoId = externalRef.slice(REF_PREFIX.length).trim()
  if (!trabajoId) return null
  return { trabajoId }
}

export function isOficioSenaRef(externalRef: string): boolean {
  return parseOficioSenaRef(externalRef) != null
}

export type AplicarSenaOficioResult =
  | {
      ok: true
      skipped?: boolean
      reason?: string
      trabajoId: string
      movimientoId?: number
      senaPagada: true
    }
  | { ok: false; error: string }

export async function aplicarSenaOficioDesdeMp(input: {
  empresaId: number
  transaccionId: number
  externalRef: string
  monto: number
  mpPaymentId: string
}): Promise<AplicarSenaOficioResult> {
  const parsed = parseOficioSenaRef(input.externalRef)
  if (!parsed) return { ok: false, error: "external_reference no es OFICIO_SENA_*" }

  const txRow = await prisma.mercadoPagoTransaccion.findUnique({
    where: { id: input.transaccionId },
    select: { id: true, conciliado: true, empresaId: true, estado: true },
  })
  if (!txRow || txRow.empresaId !== input.empresaId) {
    return { ok: false, error: "Transacción no encontrada" }
  }
  if (txRow.estado !== "approved") {
    return { ok: false, error: "Pago no aprobado" }
  }

  const trabajo = await prisma.oficioTrabajo.findFirst({
    where: { id: parsed.trabajoId, empresaId: input.empresaId },
    select: {
      id: true,
      titulo: true,
      senaPagada: true,
      mpPaymentIdSena: true,
      estado: true,
    },
  })
  if (!trabajo) return { ok: false, error: "Trabajo de oficio no encontrado" }

  if (trabajo.senaPagada) {
    if (!txRow.conciliado) {
      await prisma.mercadoPagoTransaccion.update({
        where: { id: input.transaccionId },
        data: { conciliado: true },
      })
    }
    return {
      ok: true,
      skipped: true,
      reason: "already_paid",
      trabajoId: trabajo.id,
      senaPagada: true,
    }
  }

  const monto = Math.round(Number(input.monto) * 100) / 100
  if (monto <= 0) return { ok: false, error: "Monto inválido" }

  let movimientoId: number | undefined

  await prisma.$transaction(async (tx) => {
    await tx.oficioTrabajo.update({
      where: { id: trabajo.id },
      data: {
        senaPagada: true,
        mpPaymentIdSena: input.mpPaymentId,
        estado: trabajo.estado === "PRESUPUESTADO" ? "CONFIRMADO" : trabajo.estado,
        medioPagoFinal: "mercadopago",
      },
    })

    await tx.mercadoPagoTransaccion.update({
      where: { id: input.transaccionId },
      data: { conciliado: true },
    })

    const caja = await tx.caja.findFirst({
      where: { empresaId: input.empresaId, estado: "abierta" },
      select: { id: true },
    })
    if (caja) {
      const mov = await tx.movimientoCaja.create({
        data: {
          cajaId: caja.id,
          tipo: "ingreso",
          concepto: `Seña oficio MP — ${trabajo.titulo.slice(0, 60)}`,
          monto,
          medioPago: "tarjeta_credito",
          referencia: `OFICIO_SENA_${trabajo.id}|MP:${input.mpPaymentId}`,
        },
      })
      movimientoId = mov.id
    }
  })

  return {
    ok: true,
    trabajoId: trabajo.id,
    movimientoId,
    senaPagada: true,
  }
}

/**
 * Confirma seña desde back_url MP (payment_id en query) sin inventar cobro.
 * Fail-closed si MP no configurado o pago no approved / ref no coincide.
 */
export async function confirmarSenaOficioPorPaymentId(input: {
  tokenPublico: string
  mpPaymentId: string
}): Promise<AplicarSenaOficioResult> {
  const trabajo = await prisma.oficioTrabajo.findUnique({
    where: { tokenPublico: input.tokenPublico },
    select: {
      id: true,
      empresaId: true,
      senaPagada: true,
      mpPaymentIdSena: true,
    },
  })
  if (!trabajo) return { ok: false, error: "Trabajo no encontrado" }

  if (trabajo.senaPagada) {
    return {
      ok: true,
      skipped: true,
      reason: "already_paid",
      trabajoId: trabajo.id,
      senaPagada: true,
    }
  }

  const { obtenerConfigMP, procesarWebhookMP } = await import(
    "@/lib/mercadopago/mercadopago-service"
  )
  const config = await obtenerConfigMP(trabajo.empresaId)
  if (!config?.activo || !config.accessToken) {
    return {
      ok: false,
      error: "Mercado Pago no está configurado para esta empresa. No se puede confirmar la seña.",
    }
  }

  const transaccion = await procesarWebhookMP(trabajo.empresaId, input.mpPaymentId)

  const refreshed = await prisma.oficioTrabajo.findUnique({
    where: { id: trabajo.id },
    select: { senaPagada: true },
  })

  if (!refreshed?.senaPagada) {
    if (transaccion.estado !== "approved") {
      return { ok: false, error: `Pago MP en estado "${transaccion.estado}", no se marca seña` }
    }
    return {
      ok: false,
      error: "Pago aprobado pero no se pudo conciliar la seña (revisar external_reference)",
    }
  }

  return {
    ok: true,
    trabajoId: trabajo.id,
    senaPagada: true,
  }
}
