import { type NextRequest, NextResponse } from "next/server"
import { AsientoService } from "@/lib/contabilidad/asiento-service"
import { verificarToken } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const searchParams = request.nextUrl.searchParams
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")

    if (!fechaDesde || !fechaHasta) {
      return NextResponse.json({ error: "fechaDesde y fechaHasta son requeridos" }, { status: 400 })
    }

    const asientoService = new AsientoService()
    const csv = await asientoService.exportarAsientosCSV(new Date(fechaDesde), new Date(fechaHasta))

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="asientos-${fechaDesde}-${fechaHasta}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error al exportar CSV:", error)
    return NextResponse.json({ error: "Error al exportar CSV" }, { status: 500 })
  }
}
