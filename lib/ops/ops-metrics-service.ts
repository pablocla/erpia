import { prisma } from "@/lib/prisma"
import { getAnalystEmpresaScope } from "@/lib/auth/claver-analyst"
import { computeTicketMetricas } from "@/lib/soporte/tickets-service"

const THIRTY_DAYS_AGO = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

export async function getPlataformaMetricas(analystEmail: string) {
  const db = prisma as any
  const scope = await getAnalystEmpresaScope(analystEmail)
  const empresaWhere =
    scope.mode === "assigned" ? { id: { in: scope.empresaIds } } : {}

  const desde = THIRTY_DAYS_AGO()

  const empresaIdFilter =
    scope.mode === "assigned" ? { empresaId: { in: scope.empresaIds } } : {}

  const [empresas, jobs, pipelines, entornosError, tickets] = await Promise.all([
    db.empresa.count({ where: empresaWhere }),
    db.opsJob.groupBy({
      by: ["estado", "tipo"],
      where: { ...empresaIdFilter, createdAt: { gte: desde } },
      _count: true,
    }),
    db.opsPipeline.groupBy({
      by: ["estado"],
      where: { ...empresaIdFilter, createdAt: { gte: desde } },
      _count: true,
    }),
    db.tenantEntorno.count({
      where: { ...empresaIdFilter, estado: "error" },
    }),
    db.ticket.findMany({
      where:
        scope.mode === "assigned"
          ? { empresaId: { in: scope.empresaIds } }
          : {},
      select: {
        estado: true,
        prioridad: true,
        modulo: true,
        createdAt: true,
        resolvedAt: true,
        empresaId: true,
      },
      take: 500,
    }),
  ])

  const ticketMetricas = computeTicketMetricas(tickets)

  const jobsPorEstado: Record<string, number> = {}
  const jobsPorTipo: Record<string, number> = {}
  for (const j of jobs) {
    jobsPorEstado[j.estado] = (jobsPorEstado[j.estado] ?? 0) + j._count
    jobsPorTipo[j.tipo] = (jobsPorTipo[j.tipo] ?? 0) + j._count
  }

  const pipelinesPorEstado: Record<string, number> = {}
  for (const p of pipelines) {
    pipelinesPorEstado[p.estado] = (pipelinesPorEstado[p.estado] ?? 0) + p._count
  }

  return {
    scope: scope.mode,
    clientes: empresas,
    entornosEnError: entornosError,
    jobs30d: { porEstado: jobsPorEstado, porTipo: jobsPorTipo },
    pipelines30d: pipelinesPorEstado,
    tickets: ticketMetricas.resumen,
    mttrHoras: ticketMetricas.resumen.mttrHoras,
    slaVencidos: ticketMetricas.resumen.vencidosSla,
    generadoAt: new Date().toISOString(),
  }
}