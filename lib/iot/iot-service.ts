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

  async listarAlertas(empresaId: number, filters: { resuelta?: boolean } = {}) {
    const where: Record<string, unknown> = { dispositivo: { empresaId } }
    if (filters.resuelta !== undefined) where.resuelta = filters.resuelta

    return prisma.alertaIoT.findMany({
      where,
      include: {
        dispositivo: { select: { id: true, nombre: true, tipo: true, ubicacion: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
  }

  async resolverAlerta(alertaId: number) {
    return prisma.alertaIoT.update({
      where: { id: alertaId },
      data: { resuelta: true },
    })
  }
}

export const iotService = new IoTService()
