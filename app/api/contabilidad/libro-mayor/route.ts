import { type NextRequest, NextResponse } from "next/server"
import { AsientoService } from "@/lib/contabilidad/asiento-service"
import { verificarToken } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const searchParams = request.nextUrl.searchParams
    const cuenta = searchParams.get("cuenta")
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")

    if (!cuenta || !fechaDesde || !fechaHasta) {
      return NextResponse.json({ error: "cuenta, fechaDesde y fechaHasta son requeridos" }, { status: 400 })
    }

    const asientoService = new AsientoService()
    const movimientos = await asientoService.obtenerLibroMayor(cuenta, new Date(fechaDesde), new Date(fechaHasta))

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
