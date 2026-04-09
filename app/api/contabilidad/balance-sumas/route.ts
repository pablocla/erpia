import { type NextRequest, NextResponse } from "next/server"
import { AsientoService } from "@/lib/contabilidad/asiento-service"
import { verificarToken } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const asientoService = new AsientoService()
    const balance = await asientoService.obtenerBalanceSumas()

    return NextResponse.json({
      success: true,
      balance,
    })
  } catch (error) {
    console.error("Error al obtener balance de sumas:", error)
    return NextResponse.json({ error: "Error al obtener balance" }, { status: 500 })
  }
}
