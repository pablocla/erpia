import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getDetallePrestamo } from "@/lib/prestamos/prestamos-service"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  try {
    const { id } = await context.params
    const detalle = await getDetallePrestamo(ctx.auth.empresaId, Number(id))
    if (!detalle) {
      return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })
    }
    return NextResponse.json(detalle)
  } catch (error) {
    console.error("Error al obtener detalle de préstamo:", error)
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
