import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { clasificarProducto } from "@/lib/ai"
import { z } from "zod"

const clasificarSchema = z.object({
  descripcion: z.string().min(2).max(500),
})

/**
 * POST /api/ai/clasificar-producto — Classify a product description using AI
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = clasificarSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Descripción inválida", detalles: parsed.error.errors }, { status: 400 })
    }

    const resultado = await clasificarProducto(parsed.data.descripcion, ctx.auth.empresaId)

    if (!resultado) {
      return NextResponse.json({ success: false, error: "IA no disponible" }, { status: 503 })
    }

    return NextResponse.json({ success: true, clasificacion: resultado })
  } catch (error) {
    console.error("[AI Clasificar] Error:", error)
    return NextResponse.json({ error: "Error al clasificar producto" }, { status: 500 })
  }
}
