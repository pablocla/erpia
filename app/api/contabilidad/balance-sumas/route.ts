import { type NextRequest, NextResponse } from "next/server"
import { AsientoService } from "@/lib/contabilidad/asiento-service"
import { getAuthContext } from "@/lib/auth/empresa-guard"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const asientoService = new AsientoService()
    const balance = await asientoService.obtenerBalanceSumas(ctx.auth.empresaId)

    return NextResponse.json({
      success: true,
      balance,
    })
  } catch (error) {
    console.error("Error al obtener balance de sumas:", error)
    return NextResponse.json({ error: "Error al obtener balance" }, { status: 500 })
  }
}
