/**
 * POST /api/cron/sync-afip
 *
 * Sincroniza facturas en estado PENDIENTE_CAE con AFIP.
 * Llamar desde un cron externo (Vercel Cron, GitHub Actions, etc.) cada 5 minutos.
 *
 * Autenticación: header Authorization: Bearer <CRON_SECRET>
 *
 * Ejemplo cron (vercel.json):
 *   { "crons": [{ "path": "/api/cron/sync-afip", "schedule": "cada 5 minutos" }] }
 */

import { NextRequest, NextResponse } from "next/server"
import { verifyCronAuth } from "@/lib/scheduling/cron-auth"
import { syncFacturasPendientes } from "@/lib/afip/sync-pendientes"

export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    const result = await syncFacturasPendientes()
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (err) {
    console.error("[cron/sync-afip]", err)
    return NextResponse.json({ error: "Error en sync" }, { status: 500 })
  }
}

// Vercel Cron Jobs usan GET
export async function GET(request: NextRequest) {
  return POST(request)
}
