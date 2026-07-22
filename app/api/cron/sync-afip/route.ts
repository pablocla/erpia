/**
 * GET/POST /api/cron/sync-afip
 *
 * Reintenta CAE para facturas en `pendiente_cae` (syncFacturasPendientes).
 * Auth producción: Authorization: Bearer $CRON_SECRET
 *
 * Programar en Vercel Cron u orquestador externo (GitHub Actions cada 5 min).
 */

import { type NextRequest, NextResponse } from "next/server"
import { requireCronAuth } from "@/lib/auth/cron-guard"
import { syncFacturasPendientes } from "@/lib/afip/sync-pendientes"
import { recordPlatformEvent } from "@/lib/ops/platform-events"

export const maxDuration = 120
export const dynamic = "force-dynamic"

async function handle(request: NextRequest) {
  const denied = requireCronAuth(request)
  if (denied) {
    void recordPlatformEvent({
      severity: "sev2",
      source: "cron",
      code: "CRON_UNAUTHORIZED",
      message: "Intento no autorizado a /api/cron/sync-afip",
    })
    return denied
  }

  try {
    const resultado = await syncFacturasPendientes()
    console.log("[cron/sync-afip]", {
      procesadas: resultado.procesadas,
      sincronizadas: resultado.sincronizadas,
      errores: resultado.errores,
      omitidas: resultado.omitidas,
    })
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      ...resultado,
    })
  } catch (error) {
    console.error("[cron/sync-afip]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error en sync AFIP" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
