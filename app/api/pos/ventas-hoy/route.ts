import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { listarVentasPosHoy } from "@/lib/pos/anular-venta-pos"

/**
 * GET /api/pos/ventas-hoy — historial de ventas POS del día.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const ventas = await listarVentasPosHoy(ctx.auth.empresaId)

    return NextResponse.json({
      total: ventas.length,
      ventas,
      ultima: ventas[0] ?? null,
    })
  } catch (error) {
    console.error("Error en GET /api/pos/ventas-hoy:", error)
    return NextResponse.json({ error: "Error al listar ventas" }, { status: 500 })
  }
}