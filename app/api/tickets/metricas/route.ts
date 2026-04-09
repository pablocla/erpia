import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

type TicketLite = {
  estado: string
  prioridad: string
  modulo: string | null
  createdAt: Date
  resolvedAt: Date | null
}

const SLA_HORAS: Record<string, number> = {
  critica: 4,
  alta: 8,
  media: 24,
  baja: 72,
}

function horasEntre(inicio: Date, fin: Date) {
  return (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60)
}

export async function GET(request: NextRequest) {
  try {
    const db = prisma as any
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const tickets: TicketLite[] = await db.ticket.findMany({
      where: { empresaId: ctx.auth.empresaId },
      select: {
        estado: true,
        prioridad: true,
        modulo: true,
        createdAt: true,
        resolvedAt: true,
      },
    })

    const ahora = new Date()
    const abiertos = tickets.filter((t) => t.estado === "abierto" || t.estado === "en_progreso")
    const criticosAbiertos = abiertos.filter((t) => t.prioridad === "critica").length

    let vencidosSla = 0
    for (const t of abiertos) {
      const limite = SLA_HORAS[t.prioridad] ?? SLA_HORAS.media
      if (horasEntre(t.createdAt, ahora) > limite) vencidosSla += 1
    }

    const cerradosConResolucion = tickets.filter(
      (t) => (t.estado === "resuelto" || t.estado === "cerrado") && t.resolvedAt,
    )
    const mttrHoras =
      cerradosConResolucion.length > 0
        ? cerradosConResolucion.reduce((acc, t) => acc + horasEntre(t.createdAt, t.resolvedAt as Date), 0) /
          cerradosConResolucion.length
        : 0

    const porModulo = tickets.reduce<Record<string, number>>((acc, t) => {
      const key = t.modulo?.trim() || "general"
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const modulos = Object.entries(porModulo)
      .map(([modulo, total]) => ({ modulo, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)

    return NextResponse.json({
      resumen: {
        total: tickets.length,
        abiertos: abiertos.length,
        enProgreso: tickets.filter((t) => t.estado === "en_progreso").length,
        resueltos: tickets.filter((t) => t.estado === "resuelto").length,
        cerrados: tickets.filter((t) => t.estado === "cerrado").length,
        criticosAbiertos,
        vencidosSla,
        mttrHoras: Number(mttrHoras.toFixed(2)),
      },
      modulos,
      generadoAt: ahora.toISOString(),
    })
  } catch (error) {
    console.error("Error al obtener metricas de tickets:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
