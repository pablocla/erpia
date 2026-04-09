import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { detectarAnomalias } from "@/lib/ai"

/**
 * POST /api/ai/anomalias — Detect suspicious operations using AI
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const resultado = await detectarAnomalias(ctx.auth.empresaId)

    if (!resultado) {
      return NextResponse.json({ success: true, anomalias: [], mensaje: "Sin operaciones suficientes para analizar" })
    }

    return NextResponse.json({ success: true, ...resultado })
  } catch (error) {
    console.error("[AI Anomalías] Error:", error)
    return NextResponse.json({ error: "Error al detectar anomalías" }, { status: 500 })
  }
}
