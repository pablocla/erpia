import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

const updateTicketSchema = z.object({
  estado: z.enum(["abierto", "en_progreso", "resuelto", "cerrado"]).optional(),
  prioridad: z.enum(["baja", "media", "alta", "critica"]).optional(),
  asignadoA: z.string().optional().nullable(),
  tipo: z.enum(["bug", "mejora", "consulta", "urgente"]).optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = prisma as any
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const ticketId = Number(id)
    if (!ticketId) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const ticket = await db.ticket.findFirst({
      where: { id: ticketId, empresaId: ctx.auth.empresaId },
      include: {
        comentarios: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!ticket) return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })
    return NextResponse.json(ticket)
  } catch (error) {
    console.error("Error al obtener ticket:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = prisma as any
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const ticketId = Number(id)
    if (!ticketId) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    // Verify ticket belongs to this empresa before updating
    const existing = await db.ticket.findFirst({ where: { id: ticketId, empresaId: ctx.auth.empresaId } })
    if (!existing) return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })

    const body = await request.json()
    const validacion = updateTicketSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const data: Record<string, unknown> = { ...validacion.data }
    if (validacion.data.estado && ["resuelto", "cerrado"].includes(validacion.data.estado)) {
      data.resolvedAt = new Date()
    }

    const updated = await db.ticket.update({ where: { id: ticketId }, data })
    return NextResponse.json(updated)
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })
    console.error("Error al actualizar ticket:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
