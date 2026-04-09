import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { analizarCobranza } from "@/lib/ai"

/**
 * POST /api/ai/cobranza — Prioritized collection analysis with AI-generated WhatsApp messages
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const resultado = await analizarCobranza(ctx.auth.empresaId)

    if (!resultado) {
      return NextResponse.json({ success: true, prioridad: [], mensaje: "Sin cuentas vencidas para analizar" })
    }

    return NextResponse.json({ success: true, ...resultado })
  } catch (error) {
    console.error("[AI Cobranza] Error:", error)
    return NextResponse.json({ error: "Error al analizar cobranza" }, { status: 500 })
  }
}
