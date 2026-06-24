import { prisma } from "@/lib/prisma"
import { filterHandlerLogsByEmpresa } from "@/lib/ops/handler-log-filter"

export interface UnifiedLogEntry {
  id: string
  fuente: "sistema" | "afip" | "handler" | "agente" | "ticket"
  severidad: string
  categoria: string
  contexto: string
  mensaje: string
  createdAt: Date
}

export interface LogsQuery {
  empresaId: number
  categoria?: string
  severidad?: string
  desde?: Date
  hasta?: Date
  take?: number
}

function inRange(date: Date, desde?: Date, hasta?: Date) {
  if (desde && date < desde) return false
  if (hasta && date > hasta) return false
  return true
}

export async function aggregateLogs(query: LogsQuery): Promise<UnifiedLogEntry[]> {
  const db = prisma as any
  const take = query.take ?? 100
  const dateFilter = {
    ...(query.desde || query.hasta
      ? {
          createdAt: {
            ...(query.desde ? { gte: query.desde } : {}),
            ...(query.hasta ? { lte: query.hasta } : {}),
          },
        }
      : {}),
  }

  const [sistema, afip, handlersRaw, agente, tickets] = await Promise.all([
    db.sistemaLog.findMany({
      where: {
        empresaId: query.empresaId,
        ...(query.categoria ? { categoria: query.categoria } : {}),
        ...(query.severidad ? { severidad: query.severidad } : {}),
        ...dateFilter,
      },
      orderBy: { createdAt: "desc" },
      take,
    }),
    db.afipWebserviceLog.findMany({
      where: { empresaId: query.empresaId, ...dateFilter },
      orderBy: { createdAt: "desc" },
      take: Math.min(take, 50),
    }),
    db.handlerLog.findMany({
      where: { exito: false, ...dateFilter },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    db.agenteLog.findMany({
      where: {
        empresaId: query.empresaId,
        ...(query.severidad === "error" ? { status: "error" } : {}),
        ...dateFilter,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.ticket.findMany({
      where: {
        empresaId: query.empresaId,
        estado: { in: ["abierto", "en_progreso"] },
        ...dateFilter,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, numero: true, titulo: true, prioridad: true, createdAt: true },
    }),
  ])

  const handlers = filterHandlerLogsByEmpresa<any>(handlersRaw, query.empresaId, 30)

  const entries: UnifiedLogEntry[] = []

  for (const s of sistema) {
    if (query.severidad && s.severidad !== query.severidad) continue
    entries.push({
      id: `sistema-${s.id}`,
      fuente: "sistema",
      severidad: s.severidad,
      categoria: s.categoria,
      contexto: s.contexto,
      mensaje: s.mensaje,
      createdAt: s.createdAt,
    })
  }

  for (const a of afip) {
    const sev = a.errorMsg ? "error" : "info"
    if (query.severidad && sev !== query.severidad) continue
    if (query.categoria && query.categoria !== "afip") continue
    entries.push({
      id: `afip-${a.id}`,
      fuente: "afip",
      severidad: sev,
      categoria: "afip",
      contexto: `${a.webservice}/${a.operacion}`,
      mensaje: a.errorMsg ?? `AFIP ${a.operacion} OK`,
      createdAt: a.createdAt,
    })
  }

  for (const h of handlers) {
    if (query.severidad && query.severidad !== "error") continue
    entries.push({
      id: `handler-${h.id}`,
      fuente: "handler",
      severidad: "error",
      categoria: "funcional",
      contexto: h.handler,
      mensaje: h.errorMsg ?? "Error en handler",
      createdAt: h.createdAt,
    })
  }

  for (const ag of agente) {
    entries.push({
      id: `agente-${ag.id}`,
      fuente: "agente",
      severidad: ag.status === "error" ? "error" : "info",
      categoria: "ia",
      contexto: ag.agenteId,
      mensaje: ag.error ?? ag.output ?? "Log agente",
      createdAt: ag.createdAt,
    })
  }

  for (const t of tickets) {
    entries.push({
      id: `ticket-${t.id}`,
      fuente: "ticket",
      severidad: t.prioridad === "critica" ? "fatal" : "warn",
      categoria: "soporte",
      contexto: t.numero,
      mensaje: t.titulo,
      createdAt: t.createdAt,
    })
  }

  return entries
    .filter((e) => inRange(e.createdAt, query.desde, query.hasta))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, take)
}

export function logsToCsv(entries: UnifiedLogEntry[]): string {
  const header = "fecha,fuente,severidad,categoria,contexto,mensaje"
  const rows = entries.map((e) =>
    [
      e.createdAt.toISOString(),
      e.fuente,
      e.severidad,
      e.categoria,
      e.contexto.replace(/"/g, '""'),
      e.mensaje.replace(/"/g, '""'),
    ]
      .map((v) => `"${v}"`)
      .join(","),
  )
  return [header, ...rows].join("\n")
}