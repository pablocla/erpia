/**
 * Transferencia atómica entre dos cajas abiertas de la misma empresa
 * (egreso en origen + ingreso en destino en una sola $transaction).
 */
import { prisma } from "@/lib/prisma"
import { whereEmpresa } from "@/lib/auth/empresa-guard"

export const MEDIOS_TRANSFERENCIA = [
  "efectivo",
  "tarjeta_debito",
  "tarjeta_credito",
  "transferencia",
  "cheque",
  "qr",
] as const
export type MedioTransferencia = (typeof MEDIOS_TRANSFERENCIA)[number]

export interface TransferenciaInput {
  empresaId: number
  origenCajaId: number
  destinoCajaId: number
  monto: number
  medioPago?: MedioTransferencia
  concepto?: string
}

export class TransferenciaError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 404 | 409,
  ) {
    super(message)
    this.name = "TransferenciaError"
  }
}

export async function transferirEntreCajas(input: TransferenciaInput) {
  const { empresaId, origenCajaId, destinoCajaId } = input
  const monto = Number(input.monto)
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new TransferenciaError("El monto debe ser mayor a 0", 400)
  }
  if (origenCajaId === destinoCajaId) {
    throw new TransferenciaError("La caja origen y destino deben ser distintas", 400)
  }
  const medioPago: MedioTransferencia = input.medioPago ?? "efectivo"
  const referencia = `TRF-${origenCajaId}-${destinoCajaId}-${Date.now()}`

  return prisma.$transaction(async (tx) => {
    const cajas = await tx.caja.findMany({
      where: whereEmpresa(empresaId, { id: { in: [origenCajaId, destinoCajaId] } }),
      select: { id: true, estado: true, cajaTipo: { select: { nombre: true } } },
    })
    const origen = cajas.find((c) => c.id === origenCajaId)
    const destino = cajas.find((c) => c.id === destinoCajaId)
    if (!origen || !destino) {
      throw new TransferenciaError("Caja no encontrada en esta empresa", 404)
    }
    if (origen.estado !== "abierta" || destino.estado !== "abierta") {
      throw new TransferenciaError("Ambas cajas deben estar abiertas", 409)
    }

    const nombreOrigen = origen.cajaTipo?.nombre ?? `Caja #${origen.id}`
    const nombreDestino = destino.cajaTipo?.nombre ?? `Caja #${destino.id}`
    const concepto = input.concepto?.trim()

    const egreso = await tx.movimientoCaja.create({
      data: {
        cajaId: origen.id,
        tipo: "egreso",
        concepto: concepto || `Transferencia a ${nombreDestino}`,
        monto,
        medioPago,
        referencia,
      },
    })
    const ingreso = await tx.movimientoCaja.create({
      data: {
        cajaId: destino.id,
        tipo: "ingreso",
        concepto: concepto || `Transferencia desde ${nombreOrigen}`,
        monto,
        medioPago,
        referencia,
      },
    })
    return { referencia, egreso, ingreso }
  })
}
