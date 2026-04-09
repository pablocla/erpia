import { type NextRequest, NextResponse } from "next/server"
import { procesarOnboardingConversacional } from "@/lib/ai"
import { z } from "zod"

const mensajeSchema = z.object({
  mensaje: z.string().min(5).max(1000),
})

/**
 * POST /api/ai/onboarding — Conversational onboarding: user describes their business naturally
 * Public endpoint (no auth required — this is the first interaction)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = mensajeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Mensaje inválido", detalles: parsed.error.errors }, { status: 400 })
    }

    const resultado = await procesarOnboardingConversacional(parsed.data.mensaje)

    if (!resultado) {
      return NextResponse.json({ success: false, error: "IA no disponible" }, { status: 503 })
    }

    return NextResponse.json({ success: true, ...resultado })
  } catch (error) {
    console.error("[AI Onboarding] Error:", error)
    return NextResponse.json({ error: "Error en onboarding conversacional" }, { status: 500 })
  }
}
