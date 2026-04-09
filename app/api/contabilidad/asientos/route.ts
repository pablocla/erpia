import { type NextRequest, NextResponse } from "next/server"
import { AsientoService } from "@/lib/contabilidad/asiento-service"
import { getAuthContext } from "@/lib/auth/empresa-guard"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const searchParams = request.nextUrl.searchParams
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")

    if (!fechaDesde || !fechaHasta) {
      return NextResponse.json({ error: "fechaDesde y fechaHasta son requeridos" }, { status: 400 })
    }

    const asientoService = new AsientoService()
    const asientos = await asientoService.obtenerLibroDiario(new Date(fechaDesde), new Date(fechaHasta), ctx.auth.empresaId)

    return NextResponse.json({
      success: true,
      asientos,
    })
  } catch (error) {
    console.error("Error al obtener asientos:", error)
    return NextResponse.json({ error: "Error al obtener asientos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const { fecha, numero, descripcion, tipo, movimientos } = body

    const asientoService = new AsientoService()
    await asientoService.crearAsientoManual({
      fecha: new Date(fecha),
      numero,
      descripcion,
      tipo,
      movimientos,
      empresaId: ctx.auth.empresaId,
    })

    return NextResponse.json({
      success: true,
      mensaje: "Asiento creado correctamente",
    })
  } catch (error) {
    console.error("Error al crear asiento:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error al crear asiento",
      },
      { status: 500 },
    )
  }
}
