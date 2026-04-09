import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

const comentarioSchema = z.object({
  texto: z.string().min(2, "Comentario obligatorio"),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = prisma as any
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const ticketId = Number(id)
    if (!ticketId) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    // Verify ticket belongs to this empresa
    const ticket = await db.ticket.findFirst({ where: { id: ticketId, empresaId: ctx.auth.empresaId } })
    if (!ticket) return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })

    const body = await request.json()
    const validacion = comentarioSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const comentario = await db.comentarioTicket.create({
      data: {
        ticketId,
        texto: validacion.data.texto,
        autor: ctx.auth.email,
      },
    })

    return NextResponse.json(comentario, { status: 201 })
  } catch (error: any) {
    if (error?.code === "P2003") return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })
    console.error("Error al comentar ticket:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
