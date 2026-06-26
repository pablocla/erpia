import { prisma } from "@/lib/prisma"
import { getResumenImplementacionFlota } from "@/lib/ops/implementacion-service"
import { getOpsOverview } from "@/lib/ops/ops-service"
import { listBacklogStakeholder } from "@/lib/ops/scrum-service"
import { CCA_FASES } from "@/lib/ops/implementacion-types"
import { horasAbierto, estaVencidoSla } from "@/lib/soporte/tickets-service"

function db() {
  return prisma as any
}

function faseLabel(codigo: string) {
  return CCA_FASES.find((f) => f.codigo === codigo)?.nombre ?? codigo
}

export async function getClientPortalOverview(empresaId: number) {
  const [empresa, proyecto, proyectoRaw, tickets, tareasCliente, backlog] = await Promise.all([
    db().empresa.findUnique({
      where: { id: empresaId },
      select: { id: true, nombre: true, razonSocial: true, rubro: true },
    }),
    getResumenImplementacionFlota(empresaId),
    db().proyectoImplementacion.findUnique({
      where: { empresaId },
      select: { analistaEmail: true },
    }),
    db().ticket.findMany({
      where: { empresaId },
      orderBy: { updatedAt: "desc" },
      take: 15,
      select: {
        id: true,
        numero: true,
        titulo: true,
        estado: true,
        prioridad: true,
        modulo: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db().marketplaceTareaAnalista.findMany({
      where: { empresaId, estado: { in: ["pendiente", "en_curso"] } },
      take: 10,
      select: {
        id: true,
        sku: true,
        titulo: true,
        estado: true,
        checklistJson: true,
        metadata: true,
      },
    }),
    listBacklogStakeholder(empresaId),
  ])

  let errores: Array<{
    tipo: string
    ref: string
    mensaje: string
    severidad: string
    createdAt: string
  }> = []
  try {
    const ops = await getOpsOverview(empresaId)
    errores = ops.erroresFuncionales
      .filter((e) => e.severidad !== "fatal" || e.tipo === "ticket")
      .slice(0, 10)
      .map((e) => ({
        tipo: e.tipo,
        ref: e.ref,
        mensaje: e.mensaje,
        severidad: e.severidad,
        createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt),
      }))
  } catch {
    /* ops opcional */
  }

  const ticketsResumen = {
    total: tickets.length,
    abiertos: tickets.filter((t) => t.estado === "abierto" || t.estado === "en_progreso").length,
    vencidosSla: tickets.filter((t) =>
      estaVencidoSla(t.estado, t.prioridad, new Date(t.createdAt)),
    ).length,
  }

  const pasosCliente = tareasCliente.flatMap((t) => {
    const checklist = Array.isArray(t.checklistJson) ? t.checklistJson : []
    return checklist
      .filter((c: { ejecutor?: string }) => c.ejecutor === "cliente")
      .map((c: { titulo?: string; hecho?: boolean }) => ({
        sku: t.sku,
        tareaId: t.id,
        titulo: c.titulo ?? t.titulo,
        hecho: Boolean(c.hecho),
      }))
  })

  return {
    empresa,
    implementacion: proyecto
      ? {
          codigo: proyecto.codigo,
          faseActual: proyecto.faseActual,
          faseNombre: faseLabel(proyecto.faseActual),
          porcentajeAvance: proyecto.porcentajeAvance,
          packOnboardEntregado: proyecto.packOnboardEntregado,
          fechaObjetivoGoLive: proyecto.fechaObjetivoGoLive,
          atrasado: proyecto.atrasado,
        }
      : null,
    tickets: tickets.map((t) => ({
      ...t,
      horasAbierto: Math.round(horasAbierto(t.createdAt) * 10) / 10,
      slaVencido: estaVencidoSla(t.estado, t.prioridad, new Date(t.createdAt)),
    })),
    ticketsResumen,
    errores,
    pasosCliente,
    backlog,
    analistaContacto: proyectoRaw?.analistaEmail ?? null,
  }
}

export async function getStakeholderTicketDetalle(empresaId: number, ticketId: number) {
  const ticket = await db().ticket.findFirst({
    where: { id: ticketId, empresaId },
    select: {
      id: true,
      numero: true,
      titulo: true,
      descripcion: true,
      tipo: true,
      estado: true,
      prioridad: true,
      modulo: true,
      asignadoA: true,
      reportadoPor: true,
      createdAt: true,
      updatedAt: true,
      resolvedAt: true,
      comentarios: {
        orderBy: { createdAt: "asc" },
        select: { id: true, texto: true, autor: true, createdAt: true },
      },
    },
  })
  if (!ticket) return null
  return ticket
}