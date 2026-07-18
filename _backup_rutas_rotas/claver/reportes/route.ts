import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { buildTicketWhere } from "@/lib/soporte/tickets-service"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const db = prisma as any
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresaId")
    const skip = Number(searchParams.get("skip") || 0)
    const take = Math.min(Number(searchParams.get("take") || 50), 200)

    const where = buildTicketWhere({
      empresaId: empresaId ? Number(empresaId) : undefined,
      estado: searchParams.get("estado"),
      prioridad: searchParams.get("prioridad"),
      modulo: searchParams.get("modulo"),
      q: searchParams.get("q"),
    })

    const [tickets, total] = await Promise.all([
      db.ticket.findMany({
        where,
        orderBy: [{ estado: "asc" }, { createdAt: "desc" }],
        skip,
        take,
        include: {
          empresa: {
            select: { id: true, nombre: true, razonSocial: true, rubro: true },
          },
        },
      }),
      db.ticket.count({ where }),
    ])

    return NextResponse.json({ data: tickets, total, skip, take })
  } catch (error) {
    console.error("Error al listar reportes CLAVER:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}