import { prisma } from "@/lib/prisma"

/* ═══════════════════════════════════════════════════════════════════════════
   CRM / PIPELINE DE OPORTUNIDADES — Lead → Oportunidad → Presupuesto → Venta
   Equivalente a SAP CRM + Salesforce Pipeline
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── Leads ──────────────────────────────────────────────────────────────────

export async function crearLead(params: {
  empresaId: number
  nombre: string
  empresa?: string
  email?: string
  telefono?: string
  origen?: string
  vendedorId?: number
  valorEstimado?: number
  notas?: string
}) {
  return prisma.lead.create({
    data: {
      nombre: params.nombre,
      empresa: params.empresa,
      email: params.email,
      telefono: params.telefono,
      origen: params.origen ?? "manual",
      estado: "nuevo",
      vendedorId: params.vendedorId,
      valorEstimado: params.valorEstimado,
      notas: params.notas,
      empresaId: params.empresaId,
    },
  })
}

export async function actualizarEstadoLead(
  empresaId: number,
  leadId: number,
  estado: string,
) {
  const data: Record<string, unknown> = { estado }
  if (estado === "convertido") data.convertidoAt = new Date()

  return prisma.lead.update({
    where: { id: leadId, empresaId },
    data,
  })
}

export async function convertirLeadACliente(
  empresaId: number,
  leadId: number,
  clienteId: number,
) {
  return prisma.lead.update({
    where: { id: leadId, empresaId },
    data: {
      estado: "convertido",
      convertidoAt: new Date(),
      clienteId,
    },
  })
}

// ─── Oportunidades ──────────────────────────────────────────────────────────

export async function crearOportunidad(params: {
  empresaId: number
  nombre: string
  leadId?: number
  clienteId?: number
  vendedorId?: number
  montoEstimado: number
  fechaCierreEstimada?: Date
  notas?: string
}) {
  return prisma.oportunidad.create({
    data: {
      nombre: params.nombre,
      leadId: params.leadId,
      clienteId: params.clienteId,
      vendedorId: params.vendedorId,
      etapa: "prospecto",
      probabilidad: 10,
      montoEstimado: params.montoEstimado,
      fechaCierreEstimada: params.fechaCierreEstimada,
      notas: params.notas,
      empresaId: params.empresaId,
    },
  })
}

const PROBABILIDADES_ETAPA: Record<string, number> = {
  prospecto: 10,
  propuesta: 30,
  negociacion: 60,
  cierre: 85,
  ganada: 100,
  perdida: 0,
}

export async function avanzarEtapa(
  empresaId: number,
  oportunidadId: number,
  etapa: string,
  extras?: { montoReal?: number; motivoPerdida?: string; presupuestoId?: number; pedidoVentaId?: number },
) {
  const data: Record<string, unknown> = {
    etapa,
    probabilidad: PROBABILIDADES_ETAPA[etapa] ?? 50,
  }

  if (etapa === "ganada" || etapa === "perdida") {
    data.cerradaAt = new Date()
  }
  if (extras?.montoReal != null) data.montoReal = extras.montoReal
  if (extras?.motivoPerdida) data.motivoPerdida = extras.motivoPerdida
  if (extras?.presupuestoId) data.presupuestoId = extras.presupuestoId
  if (extras?.pedidoVentaId) data.pedidoVentaId = extras.pedidoVentaId

  return prisma.oportunidad.update({
    where: { id: oportunidadId, empresaId },
    data,
  })
}

// ─── Pipeline (resumen por etapa) ───────────────────────────────────────────

export async function pipelineResumen(empresaId: number) {
  const etapas = ["prospecto", "propuesta", "negociacion", "cierre"]

  const resultados = await Promise.all(
    etapas.map(async (etapa) => {
      const oportunidades = await prisma.oportunidad.findMany({
        where: { empresaId, etapa },
      })
      return {
        etapa,
        cantidad: oportunidades.length,
        montoTotal: oportunidades.reduce((s, o) => s + o.montoEstimado, 0),
        montoPonderado: oportunidades.reduce((s, o) => s + o.montoEstimado * (o.probabilidad / 100), 0),
      }
    }),
  )

  const totalPipeline = resultados.reduce((s, r) => s + r.montoTotal, 0)
  const totalPonderado = resultados.reduce((s, r) => s + r.montoPonderado, 0)

  return { etapas: resultados, totalPipeline, totalPonderado }
}

// ─── Actividades CRM ────────────────────────────────────────────────────────

export async function registrarActividad(params: {
  empresaId: number
  tipo: string
  descripcion: string
  usuarioId: number
  leadId?: number
  oportunidadId?: number
}) {
  return prisma.actividadCRM.create({
    data: {
      tipo: params.tipo,
      descripcion: params.descripcion,
      usuarioId: params.usuarioId,
      leadId: params.leadId,
      oportunidadId: params.oportunidadId,
      empresaId: params.empresaId,
    },
  })
}

// ─── Métricas CRM ──────────────────────────────────────────────────────────

export async function metricasCRM(empresaId: number) {
  const hoy = new Date()
  const hace30d = new Date(); hace30d.setDate(hace30d.getDate() - 30)

  const [leadsNuevos, oportunidadesAbiertas, ganadas30d, perdidas30d] = await Promise.all([
    prisma.lead.count({ where: { empresaId, createdAt: { gte: hace30d } } }),
    prisma.oportunidad.count({ where: { empresaId, etapa: { notIn: ["ganada", "perdida"] } } }),
    prisma.oportunidad.findMany({ where: { empresaId, etapa: "ganada", cerradaAt: { gte: hace30d } } }),
    prisma.oportunidad.count({ where: { empresaId, etapa: "perdida", cerradaAt: { gte: hace30d } } }),
  ])

  const montoGanado = ganadas30d.reduce((s, o) => s + (o.montoReal ?? o.montoEstimado), 0)
  const totalCerradas = ganadas30d.length + perdidas30d
  const winRate = totalCerradas > 0 ? Math.round((ganadas30d.length / totalCerradas) * 100) : 0

  return {
    leadsNuevos,
    oportunidadesAbiertas,
    ganadasMes: ganadas30d.length,
    perdidasMes: perdidas30d,
    montoGanado,
    winRate,
  }
}
