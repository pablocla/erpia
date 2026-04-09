import { type NextRequest, NextResponse } from "next/server"
import { IVAService } from "@/lib/impuestos/iva-service"
import { verificarToken } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const searchParams = request.nextUrl.searchParams
    const mes = searchParams.get("mes")
    const anio = searchParams.get("anio")
    const formato = searchParams.get("formato") || "json"

    if (!mes || !anio) {
      return NextResponse.json({ error: "mes y anio son requeridos" }, { status: 400 })
    }

    const ivaService = new IVAService()

    if (formato === "csv") {
      const csv = await ivaService.exportarLibroIVAVentasCSV(Number.parseInt(mes), Number.parseInt(anio))

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="libro-iva-ventas-${mes}-${anio}.csv"`,
        },
      })
    }

    const libro = await ivaService.generarLibroIVAVentas(Number.parseInt(mes), Number.parseInt(anio))

    return NextResponse.json({
      success: true,
      libro,
    })
  } catch (error) {
    console.error("Error al generar libro IVA ventas:", error)
    return NextResponse.json({ error: "Error al generar libro IVA ventas" }, { status: 500 })
  }
}
