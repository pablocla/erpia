import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { generarPresupuestoPorTexto } from "@/lib/ai"
import { z } from "zod"

const presupuestoSchema = z.object({
  texto: z.string().min(10).max(2000),
})

/**
 * POST /api/ai/presupuesto — Generate a quote from natural language text/voice
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = presupuestoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Texto inválido", detalles: parsed.error.errors }, { status: 400 })
    }

    const resultado = await generarPresupuestoPorTexto(parsed.data.texto, ctx.auth.empresaId)

    if (!resultado) {
      return NextResponse.json({ success: false, error: "IA no disponible" }, { status: 503 })
    }

    return NextResponse.json({ success: true, presupuesto: resultado })
  } catch (error) {
    console.error("[AI Presupuesto] Error:", error)
    return NextResponse.json({ error: "Error al generar presupuesto" }, { status: 500 })
  }
}
