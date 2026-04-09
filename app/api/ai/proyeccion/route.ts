import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { generarProyeccion, isIAEnabled } from "@/lib/ai"

/**
 * GET /api/ai/proyeccion — Proyección de ventas y recomendaciones de stock
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    if (!(await isIAEnabled(ctx.auth.empresaId))) {
      return NextResponse.json({ error: "Módulo IA no está habilitado para esta empresa" }, { status: 403 })
    }

    const proyeccion = await generarProyeccion(ctx.auth.empresaId)

    return NextResponse.json({ success: true, data: proyeccion })
  } catch (error) {
    console.error("[AI Proyeccion] Error:", error)
    return NextResponse.json({ error: "Error generando proyección" }, { status: 500 })
  }
}
