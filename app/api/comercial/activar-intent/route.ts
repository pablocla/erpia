import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { applyActivarIntent } from "@/lib/comercial/activar-producto-service"
import { resolveActivarIntent } from "@/lib/comercial/activar-intent"

const bodySchema = z.object({
  activar: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const intent = resolveActivarIntent(parsed.data.activar)
  if (!intent) {
    return NextResponse.json({ error: "Producto no reconocido" }, { status: 400 })
  }

  try {
    const result = await applyActivarIntent({
      empresaId: ctx.auth.empresaId,
      activar: parsed.data.activar,
      origen: "activar_intent_api",
    })

    return NextResponse.json({
      success: true,
      marca: intent.marca,
      landingPath: intent.landingPath,
      ...result,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al activar producto"
    console.error("[activar-intent]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}