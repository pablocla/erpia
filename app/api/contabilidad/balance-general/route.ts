import { type NextRequest, NextResponse } from "next/server"
import { estadosFinancierosService } from "@/lib/contabilidad/estados-financieros-service"
import { verificarToken } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const fechaCorte = searchParams.get("fechaCorte")
      ? new Date(searchParams.get("fechaCorte")!)
      : new Date()
    const empresaId = usuario.empresaId ?? 1

    const balance = await estadosFinancierosService.generarBalanceGeneral(fechaCorte, empresaId)

    return NextResponse.json({ success: true, ...balance })
  } catch (error) {
    console.error("Error al generar balance general:", error)
    return NextResponse.json({ error: "Error al generar balance general" }, { status: 500 })
  }
}
