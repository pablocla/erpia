import { type NextRequest, NextResponse } from "next/server"
import { PrinterService } from "@/lib/printer/printer-service"
import { verificarToken } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const printerService = new PrinterService()
    const impresoras = await printerService.detectarImpresoras()

    return NextResponse.json({
      success: true,
      impresoras,
    })
  } catch (error) {
    console.error("Error al detectar impresoras:", error)
    return NextResponse.json({ error: "Error al detectar impresoras" }, { status: 500 })
  }
}
