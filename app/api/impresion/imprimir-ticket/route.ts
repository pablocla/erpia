import { type NextRequest, NextResponse } from "next/server"
import { PrinterService } from "@/lib/printer/printer-service"
import { getAuthContext } from "@/lib/auth/empresa-guard"

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.ok) return auth.response

    const { facturaId } = await request.json()

    if (!facturaId) {
      return NextResponse.json({ error: "facturaId es requerido" }, { status: 400 })
    }

    const printerService = new PrinterService()
    const resultado = await printerService.imprimirFactura(facturaId, auth.auth.empresaId)

    if (!resultado.success) {
      return NextResponse.json({ error: resultado.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      mensaje: resultado.mensaje,
    })
  } catch (error) {
    console.error("Error en endpoint imprimir-ticket:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
