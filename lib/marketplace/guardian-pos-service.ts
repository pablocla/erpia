/**
 * Guardián de Caja POS — análisis de riesgo diario (anulaciones, NC, egresos).
 */
import { prisma } from "@/lib/prisma"
import { listarVentasPosHoy } from "@/lib/pos/anular-venta-pos"

export type RiesgoNivel = "bajo" | "medio" | "alto"

export interface GuardianPosResumen {
  fecha: string
  nivel: RiesgoNivel
  score: number
  anulacionesHoy: number
  devolucionesHoy: number
  egresosCajaHoy: number
  ventasHoy: number
  alertas: string[]
}

export async function analizarRiesgoPosHoy(empresaId: number): Promise<GuardianPosResumen> {
  const inicioDia = new Date()
  inicioDia.setHours(0, 0, 0, 0)

  const [ventas, anulaciones, devoluciones, egresos] = await Promise.all([
    listarVentasPosHoy(empresaId),
    prisma.factura.count({
      where: { empresaId, estado: "anulada", updatedAt: { gte: inicioDia } },
    }),
    prisma.notaCredito.count({
      where: {
        empresaId,
        createdAt: { gte: inicioDia },
        motivo: { contains: "Devolución", mode: "insensitive" },
      },
    }),
    prisma.movimientoCaja.count({
      where: {
        tipo: "egreso",
        createdAt: { gte: inicioDia },
        caja: { empresaId },
        OR: [
          { concepto: { contains: "Anulación", mode: "insensitive" } },
          { concepto: { contains: "Devolución", mode: "insensitive" } },
        ],
      },
    }),
  ])

  const anulables = ventas.filter((v) => v.anulable).length
  const alertas: string[] = []
  let score = 0

  if (anulaciones > 0) {
    score += anulaciones * 25
    alertas.push(`${anulaciones} venta(s) anulada(s) hoy`)
  }
  if (devoluciones > 0) {
    score += devoluciones * 15
    alertas.push(`${devoluciones} devolución(es) parcial(es) hoy`)
  }
  if (egresos >= 3) {
    score += 20
    alertas.push(`${egresos} egresos de caja por anulación/devolución`)
  }
  if (ventas.length > 0 && anulaciones / ventas.length > 0.15) {
    score += 30
    alertas.push("Tasa de anulación > 15% del día")
  }
  if (anulables > 5) {
    score += 10
    alertas.push(`${anulables} ventas aún anulables en cola`)
  }

  const nivel: RiesgoNivel = score >= 50 ? "alto" : score >= 25 ? "medio" : "bajo"

  return {
    fecha: inicioDia.toISOString().slice(0, 10),
    nivel,
    score,
    anulacionesHoy: anulaciones,
    devolucionesHoy: devoluciones,
    egresosCajaHoy: egresos,
    ventasHoy: ventas.length,
    alertas,
  }
}