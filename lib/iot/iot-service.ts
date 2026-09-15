/**
 * IoT Service — Device management, readings, alerts
 */

import { prisma } from "@/lib/prisma"

export class IoTService {
  async listarDispositivos(empresaId: number, filters: { tipo?: string; estado?: string } = {}) {
    const where: Record<string, unknown> = { empresaId }
    if (filters.tipo) where.tipo = filters.tipo
    if (filters.estado) where.estado = filters.estado

    return prisma.dispositivoIoT.findMany({
      where,
      include: {
        _count: { select: { lecturas: true, alertas: true } },
      },
      orderBy: { nombre: "asc" },
    })
  }

  async listarLecturas(
    empresaId: number,
    filters: { dispositivoId?: number; limit?: number } = {},
  ) {
    const where: Record<string, unknown> = {
      dispositivo: { empresaId },
    }
    if (filters.dispositivoId) where.dispositivoId = filters.dispositivoId

    return prisma.lecturaIoT.findMany({
      where,
      include: {
        dispositivo: { select: { id: true, nombre: true, codigo: true, tipo: true } },
      },
      orderBy: { timestamp: "desc" },
      take: Math.min(filters.limit ?? 50, 200),
    })
  }

  async registrarLectura(dispositivoId: number, data: {
    tipo: string
    valor: number
    unidad?: string
    metadata?: Record<string, unknown>
  }) {
    const lectura = await prisma.lecturaIoT.create({
      data: {
        dispositivoId,
        valor: data.valor,
        unidad: data.unidad ?? "u",
      },
    })

    // Update device last connection
    await prisma.dispositivoIoT.update({
      where: { id: dispositivoId },
      data: { ultimaConexion: new Date() },
    })

    // Check thresholds (if configured)
    const dispositivo = await prisma.dispositivoIoT.findUnique({
      where: { id: dispositivoId },
      select: { nombre: true, empresaId: true, umbralAlertaMax: true, umbralAlertaMin: true, umbralCriticoMax: true, umbralCriticoMin: true },
    })
    if (dispositivo) {
      const { umbralAlertaMax, umbralAlertaMin, umbralCriticoMax, umbralCriticoMin } = dispositivo
      const isCritical = (umbralCriticoMax != null && data.valor > umbralCriticoMax) || (umbralCriticoMin != null && data.valor < umbralCriticoMin)
      const isWarning = (umbralAlertaMax != null && data.valor > umbralAlertaMax) || (umbralAlertaMin != null && data.valor < umbralAlertaMin)

      if (isCritical || isWarning) {
        await prisma.alertaIoT.create({
          data: {
            dispositivoId,
            tipo: "umbral",
            mensaje: `${dispositivo.nombre}: ${data.tipo} = ${data.valor} (fuera de rango)`,
            nivel: isCritical ? "critical" : "warning",
            valorLeido: data.valor,
            umbralMin: umbralAlertaMin,
            umbralMax: umbralAlertaMax,
          },
        })
      }
    }

    return lectura
  }

  /** Verify device belongs to empresa before insert/update. */
  async obtenerDispositivoDeEmpresa(dispositivoId: number, empresaId: number) {
    return prisma.dispositivoIoT.findFirst({
      where: { id: dispositivoId, empresaId },
    })
  }

  async listarAlertas(empresaId: number, filters: { resuelta?: boolean; nivel?: string } = {}) {
    const where: Record<string, unknown> = { dispositivo: { empresaId } }
    if (filters.resuelta !== undefined) where.resuelta = filters.resuelta
    if (filters.nivel) where.nivel = filters.nivel

    return prisma.alertaIoT.findMany({
      where,
      include: {
        dispositivo: { select: { id: true, nombre: true, codigo: true, tipo: true, ubicacion: true } },
      },
      orderBy: [{ nivel: "desc" }, { createdAt: "desc" }],
      take: 100,
    })
  }

  /**
   * Resolve alert only if it belongs to a device of the caller's empresa.
   * Returns null when alerta is missing or cross-tenant.
   */
  async resolverAlerta(alertaId: number, empresaId: number) {
    const alerta = await prisma.alertaIoT.findFirst({
      where: { id: alertaId, dispositivo: { empresaId } },
      select: { id: true },
    })
    if (!alerta) return null

    return prisma.alertaIoT.update({
      where: { id: alertaId },
      data: { resuelta: true, resolvedAt: new Date() },
    })
  }
}

export const iotService = new IoTService()