import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { predecirCompras } from "@/lib/ai"

/**
 * POST /api/ai/prediccion-compras — Predict what to restock this week based on sales history
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const resultado = await predecirCompras(ctx.auth.empresaId)

    if (!resultado) {
      return NextResponse.json({ success: true, reposiciones: [], mensaje: "Sin datos suficientes para predecir" })
    }

    return NextResponse.json({ success: true, ...resultado })
  } catch (error) {
    console.error("[AI Predicción Compras] Error:", error)
    return NextResponse.json({ error: "Error al predecir compras" }, { status: 500 })
  }
}
