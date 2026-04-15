import { type NextRequest, NextResponse } from "next/server"
import { IVAService } from "@/lib/impuestos/iva-service"
import { getAuthContext } from "@/lib/auth/empresa-guard"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const searchParams = request.nextUrl.searchParams
    const mes = searchParams.get("mes")
    const anio = searchParams.get("anio")

    if (!mes || !anio) {
      return NextResponse.json({ error: "mes y anio son requeridos" }, { status: 400 })
    }

    const ivaService = new IVAService()
    const reporte = await ivaService.calcularIVAPeriodo(Number.parseInt(mes), Number.parseInt(anio), ctx.auth.empresaId)

    return NextResponse.json({
      success: true,
      reporte,
    })
  } catch (error) {
    console.error("Error al calcular IVA:", error)
    return NextResponse.json({ error: "Error al calcular IVA" }, { status: 500 })
  }
}
