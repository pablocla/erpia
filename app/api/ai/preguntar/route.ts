import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { responderPregunta } from "@/lib/ai"
import { z } from "zod"

const preguntaSchema = z.object({
  pregunta: z.string().min(5).max(500),
})

/**
 * POST /api/ai/preguntar — Ask a business question in natural language
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = preguntaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Pregunta inválida", detalles: parsed.error.errors }, { status: 400 })
    }

    const resultado = await responderPregunta(parsed.data.pregunta, ctx.auth.empresaId)

    if (!resultado) {
      return NextResponse.json({ success: false, error: "IA no disponible o datos insuficientes" }, { status: 503 })
    }

    return NextResponse.json({ success: true, ...resultado })
  } catch (error) {
    console.error("[AI Preguntar] Error:", error)
    return NextResponse.json({ error: "Error al procesar pregunta" }, { status: 500 })
  }
}
