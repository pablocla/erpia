import { type NextRequest, NextResponse } from "next/server"
import { estadosFinancierosService } from "@/lib/contabilidad/estados-financieros-service"
import { verificarToken } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const empresaId = usuario.empresaId ?? 1

    const hoy = new Date()
    const fechaDesde = searchParams.get("fechaDesde")
      ? new Date(searchParams.get("fechaDesde")!)
      : new Date(hoy.getFullYear(), 0, 1) // 1 de enero del año actual
    const fechaHasta = searchParams.get("fechaHasta")
      ? new Date(searchParams.get("fechaHasta")!)
      : hoy

    const eerr = await estadosFinancierosService.generarEstadoResultados(fechaDesde, fechaHasta, empresaId)

    return NextResponse.json({ success: true, ...eerr })
  } catch (error) {
    console.error("Error al generar estado de resultados:", error)
    return NextResponse.json({ error: "Error al generar estado de resultados" }, { status: 500 })
  }
}
