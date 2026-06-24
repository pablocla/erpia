import { type NextRequest, NextResponse } from "next/server"
import { AsientoService } from "@/lib/contabilidad/asiento-service"
import { getAuthContext } from "@/lib/auth/empresa-guard"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const searchParams = request.nextUrl.searchParams
    const cuenta = searchParams.get("cuenta")
    const fechaDesde = searchParams.get("fechaDesde") ?? searchParams.get("desde")
    const fechaHasta = searchParams.get("fechaHasta") ?? searchParams.get("hasta")

    if (!cuenta || !fechaDesde || !fechaHasta) {
      return NextResponse.json(
        { error: "cuenta, fechaDesde y fechaHasta son requeridos" },
        { status: 400 },
      )
    }

    const asientoService = new AsientoService()
    const movimientos = await asientoService.obtenerLibroMayor(
      cuenta,
      new Date(fechaDesde),
      new Date(fechaHasta),
      ctx.auth.empresaId,
    )

    return NextResponse.json({
      success: true,
      cuenta,
      movimientos,
    })
  } catch (error) {
    console.error("Error al obtener libro mayor:", error)
    return NextResponse.json({ error: "Error al obtener libro mayor" }, { status: 500 })
  }
}