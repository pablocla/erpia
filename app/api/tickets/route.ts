import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

const ticketSchema = z.object({
  titulo: z.string().min(4, "Título obligatorio"),
  descripcion: z.string().min(10, "Descripción obligatoria"),
  tipo: z.enum(["bug", "mejora", "consulta", "urgente"]).default("bug"),
  prioridad: z.enum(["baja", "media", "alta", "critica"]).default("media"),
  modulo: z.string().optional(),
  urlOrigen: z.string().optional(),
  stackTrace: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const db = prisma as any
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado")
    const prioridad = searchParams.get("prioridad")
    const modulo = searchParams.get("modulo")
    const q = searchParams.get("q")
    const skip = Number(searchParams.get("skip") || 0)
    const take = Math.min(Number(searchParams.get("take") || 50), 200)

    const where: Record<string, unknown> = { empresaId: ctx.auth.empresaId }
    if (estado) where.estado = estado
    if (prioridad) where.prioridad = prioridad
    if (modulo) where.modulo = modulo
    if (q) {
      where.OR = [
        { numero: { contains: q, mode: "insensitive" } },
        { titulo: { contains: q, mode: "insensitive" } },
        { descripcion: { contains: q, mode: "insensitive" } },
      ]
    }

    const [tickets, total] = await Promise.all([
      db.ticket.findMany({
        where,
        orderBy: [{ estado: "asc" }, { createdAt: "desc" }],
        skip,
        take,
      }),
      db.ticket.count({ where }),
    ])

    return NextResponse.json({ data: tickets, total, skip, take })
  } catch (error) {
    console.error("Error al listar tickets:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = prisma as any
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = ticketSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const now = new Date()
    const fecha = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`
    const countHoy = await db.ticket.count({
      where: {
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0),
        },
      },
    })
    const numero = `TK-${fecha}-${String(countHoy + 1).padStart(4, "0")}`

    const ticket = await db.ticket.create({
      data: {
        numero,
        ...validacion.data,
        reportadoPor: ctx.auth.email,
        empresaId: ctx.auth.empresaId,
      },
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error("Error al crear ticket:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
