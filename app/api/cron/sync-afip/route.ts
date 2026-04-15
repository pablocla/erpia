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
import { syncFacturasPendientes } from "@/lib/afip/sync-pendientes"

export async function POST(request: NextRequest) {
  // Validar secret para evitar llamadas externas no autorizadas
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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
