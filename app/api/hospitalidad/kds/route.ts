import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"

/**
 * GET /api/hospitalidad/kds — Kitchen Display: pending orders
 * PATCH /api/hospitalidad/kds — Mark line as ready
 */

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { hospitalidadService } = await import("@/lib/hospitalidad/hospitalidad-service")
  const comandas = await hospitalidadService.obtenerComandasCocina(ctx.auth.empresaId)

  return NextResponse.json({ success: true, comandas })
}

export async function PATCH(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { lineaId } = await request.json()
  if (!lineaId || typeof lineaId !== "number") {
    return NextResponse.json({ error: "lineaId requerido" }, { status: 400 })
  }

  const { hospitalidadService } = await import("@/lib/hospitalidad/hospitalidad-service")
  const linea = await hospitalidadService.marcarLineaLista(lineaId)

  return NextResponse.json({ success: true, linea })
}
