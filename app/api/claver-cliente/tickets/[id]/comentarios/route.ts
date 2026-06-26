import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getStakeholderContext } from "@/lib/auth/stakeholder-guard"
import { agregarComentarioStakeholder } from "@/lib/ops/ticket-stakeholder-service"

const schema = z.object({
  texto: z.string().min(2, "Comentario obligatorio").max(4000),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getStakeholderContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const ticketId = Number(id)
    if (!ticketId) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
    }

    const comentario = await agregarComentarioStakeholder(
      ctx.auth.empresaId,
      ticketId,
      parsed.data.texto,
      ctx.auth.email,
    )
    return NextResponse.json(comentario, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}