import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { computeTicketMetricas, type TicketLite } from "@/lib/soporte/tickets-service"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const db = prisma as any
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresaId")
    const where: Record<string, unknown> = {}
    if (empresaId) where.empresaId = Number(empresaId)

    const tickets: TicketLite[] = await db.ticket.findMany({
      where,
      select: {
        estado: true,
        prioridad: true,
        modulo: true,
        createdAt: true,
        resolvedAt: true,
        empresaId: true,
      },
    })

    return NextResponse.json(computeTicketMetricas(tickets))
  } catch (error) {
    console.error("Error al obtener métricas CLAVER:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}