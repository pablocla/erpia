import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { evaluarProductoParaPos } from "@/lib/almacen-rosario/evaluar-producto-pos"

const schema = z.object({
  productoId: z.number().int().positive(),
  precioLista: z.number().nonnegative().optional(),
})

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const result = await evaluarProductoParaPos(
    ctx.auth.empresaId,
    parsed.data.productoId,
    parsed.data.precioLista,
  )

  return NextResponse.json(result)
}