/**
 * Sincronización de facturas PENDIENTE_CAE con AFIP.
 *
 * Uso:
 *   - Cron: cada 5 minutos vía /api/cron/sync-afip (requiere CRON_SECRET)
 *   - Manual: llamar syncFacturasPendientes(empresaId)
 *
 * Qué hace:
 *   1. Busca facturas en estado "pendiente_cae" con menos de 24hs de antigüedad
 *   2. Re-intenta solicitar el CAE a AFIP
 *   3. Si obtiene el CAE: actualiza la factura y genera el QR
 *   4. Si sigue fallando: deja el estado para el siguiente intento
 *   5. Si pasaron 24hs sin CAE: marca como "error_cae" para revisión manual
 */

import { prisma } from "@/lib/prisma"
import { solicitarCaeFactura } from "./solicitar-cae-factura"

const HORAS_LIMITE_REINTENTO = 24
const HORAS_AFIP_MANTENIMIENTO_INICIO = 0   // 00:00 ART
const HORAS_AFIP_MANTENIMIENTO_FIN    = 1   // 01:00 ART (margen extra)

function enVentanaMantenimientoAFIP(): boolean {
  const horaUTC = new Date().getUTCHours()
  // Argentina es UTC-3, así que 00:00 ART = 03:00 UTC
  const horaART = (horaUTC + 21) % 24  // UTC - 3 = UTC + 21
  return horaART >= HORAS_AFIP_MANTENIMIENTO_INICIO && horaART < HORAS_AFIP_MANTENIMIENTO_FIN
}

export interface SyncResult {
  procesadas: number
  sincronizadas: number
  errores: number
  omitidas: number  // en ventana de mantenimiento
  detalles: { facturaId: number; resultado: "ok" | "error" | "omitida"; mensaje?: string }[]
}

export async function syncFacturasPendientes(empresaId?: number): Promise<SyncResult> {
  const result: SyncResult = { procesadas: 0, sincronizadas: 0, errores: 0, omitidas: 0, detalles: [] }

  if (enVentanaMantenimientoAFIP()) {
    return { ...result, omitidas: 1, detalles: [{ facturaId: 0, resultado: "omitida", mensaje: "Ventana de mantenimiento AFIP (00:00-01:00 ART)" }] }
  }

  const limiteAntigüedad = new Date(Date.now() - HORAS_LIMITE_REINTENTO * 3600_000)

  const pendientes = await prisma.factura.findMany({
    where: {
      estado: "pendiente_cae",
      createdAt: { gte: limiteAntigüedad },
      ...(empresaId ? { empresaId } : {}),
    },
    include: {
      empresa: {
        select: {
          id: true,
          cuit: true,
          certificadoCRT: true,
          certificadoKEY: true,
          entorno: true,
        },
      },
      cliente: {
        select: { cuit: true, dni: true },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 50,  // máximo por corrida
  })

  // Marcar como error_cae las que superaron el límite
  const vencidas = await prisma.factura.findMany({
    where: {
      estado: "pendiente_cae",
      createdAt: { lt: limiteAntigüedad },
      ...(empresaId ? { empresaId } : {}),
    },
    select: { id: true, empresaId: true },
  })
  if (vencidas.length > 0) {
    await prisma.factura.updateMany({
      where: { id: { in: vencidas.map((f) => f.id) } },
      data: { estado: "error_cae" },
    })
    const { emitAutomationEvent } = await import("@/lib/automation/emit-event")
    for (const f of vencidas) {
      void emitAutomationEvent(
        f.empresaId,
        "CAE_RECHAZADO",
        { facturaId: f.id, motivo: "timeout_24h" },
        `fac-timeout-${f.id}`
      )
    }
  }

  result.procesadas = pendientes.length

  for (const factura of pendientes) {
    const afip = await solicitarCaeFactura(factura.id)
    if (afip.ok) {
      result.sincronizadas++
      result.detalles.push({ facturaId: factura.id, resultado: "ok" })
    } else {
      result.errores++
      result.detalles.push({
        facturaId: factura.id,
        resultado: "error",
        mensaje: afip.error ?? "Error desconocido",
      })
    }
  }

  return result
}
