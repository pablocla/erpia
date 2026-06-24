/**
 * Pizarra de Precios AGRO
 *
 * GET  /api/agro/pizarra         → pizarra actual (último precio por grano)
 * GET  /api/agro/pizarra?granoId=1&dias=30 → historial para gráfico
 * POST /api/agro/pizarra         → actualizar precio manualmente o desde cron
 *
 * Integración Alpha Vantage (futuros Chicago CME):
 * Cron externo (o llamado manual) llama POST con los datos ya parseados.
 * Para el frontend hay un helper que fetchea Alpha Vantage del lado del cliente.
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { agroService } from "@/lib/agro/agro-service"

/** GET: pizarra actual o historial */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const granoId = searchParams.get("granoId") ? Number(searchParams.get("granoId")) : null
  const dias = Number(searchParams.get("dias") ?? 30)

  if (granoId) {
    // Historial para gráfico
    const historial = await agroService.historialPrecios(auth.auth.empresaId, granoId, dias)
    return NextResponse.json(historial)
  }

  // Pizarra actual (widget dashboard)
  const pizarra = await agroService.pizarraActual(auth.auth.empresaId)
  return NextResponse.json(pizarra)
}

/** POST: guardar precio (manual o desde cron Alpha Vantage) */
export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const { granoId, posicion, precio, moneda, fuente } = body

  if (!granoId || !posicion || precio == null || !moneda || !fuente) {
    return NextResponse.json({ error: "granoId, posicion, precio, moneda y fuente son requeridos" }, { status: 400 })
  }

  const record = await agroService.guardarPrecio(auth.auth.empresaId, {
    granoId: Number(granoId),
    posicion,
    precio: Number(precio),
    moneda,
    fuente,
    variacion: body.variacion ? Number(body.variacion) : undefined,
    fechaData: body.fechaData ? new Date(body.fechaData) : new Date(),
  })
  return NextResponse.json(record, { status: 201 })
}

