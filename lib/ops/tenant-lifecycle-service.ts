import { prisma } from "@/lib/prisma"
import { findLeadByEmail } from "@/lib/comercial/comercial-funnel-service"
import { PIPELINE_ETAPA_LABELS, type ComercialLeadRow } from "@/lib/ops/comercial-pipeline-service"
import { getOpsOverview } from "@/lib/ops/ops-service"
import { listSistemaLogs, persistSistemaLog } from "@/lib/ops/sistema-log"
import type { SignupMeta } from "@/lib/ops/signup-tracking"
import type { ReadinessReport } from "@/lib/ops/readiness-service"

function db() {
  return prisma as any
}

export const TENANT_LIFECYCLE_STATES = [
  "prospecto",
  "trial",
  "implementacion",
  "activo",
  "suspendido",
  "baja",
] as const

export type TenantLifecycleState = (typeof TENANT_LIFECYCLE_STATES)[number]

export const LIFECYCLE_LABELS: Record<TenantLifecycleState, string> = {
  prospecto: "Prospecto",
  trial: "Trial",
  implementacion: "Implementación",
  activo: "Activo",
  suspendido: "Suspendido",
  baja: "Baja",
}

export const LIFECYCLE_DESCRIPTIONS: Record<TenantLifecycleState, string> = {
  prospecto: "Organización creada, sin servicios activos",
  trial: "Período de prueba en curso",
  implementacion: "Proyecto CCA / go-live en progreso",
  activo: "Servicios activos y operando",
  suspendido: "Acceso suspendido por analista",
  baja: "Organización dada de baja",
}

export type TenantHealthLevel = "ok" | "warn" | "error"

export interface TenantLifecycle {
  estado: TenantLifecycleState
  label: string
  descripcion: string
  pasoActual: number
  pasos: { id: TenantLifecycleState; label: string; completado: boolean; actual: boolean }[]
  suspendidoAt: string | null
  accionesDisponibles: ("reactivate" | "suspend")[]
}

export interface TenantHealth {
  nivel: TenantHealthLevel
  label: string
  entornosError: number
  logsError: number
  ticketsAbiertos: number
  jobsActivos: number
  detalles: { id: string; label: string; valor: number | string; nivel: TenantHealthLevel }[]
}

export interface TenantActivityItem {
  id: string
  tipo: "log" | "job" | "pipeline" | "signup"
  titulo: string
  detalle?: string
  severidad?: string
  createdAt: string
  href?: string
}

export interface TenantPipelineLeadSummary {
  id: number
  nombre: string
  email: string | null
  etapa: string
  etapaLabel: string
  origen: string
  proximaAccion: string | null
  updatedAt: string
}

function mapPipelineLead(row: ComercialLeadRow): TenantPipelineLeadSummary {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    etapa: row.etapa,
    etapaLabel: PIPELINE_ETAPA_LABELS[row.etapa] ?? row.etapa,
    origen: row.origen,
    proximaAccion: row.proximaAccion,
    updatedAt: row.updatedAt,
  }
}

export async function getPipelineLeadForTenant(empresaId: number): Promise<TenantPipelineLeadSummary | null> {
  const byEmpresa = await db().comercialPipelineLead.findFirst({
    where: { empresaId },
    orderBy: { updatedAt: "desc" },
  })
  if (byEmpresa) {
    return mapPipelineLead({
      id: byEmpresa.id,
      nombre: byEmpresa.nombre,
      negocio: byEmpresa.negocio,
      telefono: byEmpresa.telefono,
      email: byEmpresa.email,
      localidad: byEmpresa.localidad,
      rubro: byEmpresa.rubro,
      origen: byEmpresa.origen,
      etapa: byEmpresa.etapa,
      valorEstimado: byEmpresa.valorEstimado != null ? Number(byEmpresa.valorEstimado) : null,
      proximaAccion: byEmpresa.proximaAccion,
      proximaFecha: byEmpresa.proximaFecha ? new Date(byEmpresa.proximaFecha).toISOString() : null,
      notas: byEmpresa.notas,
      lat: byEmpresa.lat,
      lon: byEmpresa.lon,
      empresaId: byEmpresa.empresaId,
      creadoPor: byEmpresa.creadoPor,
      createdAt: new Date(byEmpresa.createdAt).toISOString(),
      updatedAt: new Date(byEmpresa.updatedAt).toISOString(),
    })
  }

  const admin = await db().usuario.findFirst({
    where: { empresaId, rol: "administrador" },
    select: { email: true },
    orderBy: { createdAt: "asc" },
  })
  if (admin?.email) {
    const lead = await findLeadByEmail(admin.email)
    if (lead) return mapPipelineLead(lead)
  }

  return null
}

const LIFECYCLE_ORDER: TenantLifecycleState[] = [
  "prospecto",
  "trial",
  "implementacion",
  "activo",
]

function pasoIndex(estado: TenantLifecycleState): number {
  if (estado === "suspendido" || estado === "baja") return -1
  const idx = LIFECYCLE_ORDER.indexOf(estado)
  return idx >= 0 ? idx : 0
}

export function computeTenantLifecycle(input: {
  deletedAt: Date | null
  signup: SignupMeta
  productosActivos: number
  mpSubscriptionStatus: string | null
  proyecto: { porcentajeAvance: number } | null
  readiness: ReadinessReport
  pipelineLead: TenantPipelineLeadSummary | null
}): TenantLifecycle {
  let estado: TenantLifecycleState

  if (input.deletedAt) {
    estado = "suspendido"
  } else if (input.signup.trial?.activo) {
    estado = "trial"
  } else if (
    input.proyecto &&
    input.proyecto.porcentajeAvance < 100 &&
    !input.readiness.listoGoLive
  ) {
    estado = "implementacion"
  } else if (
    input.productosActivos > 0 ||
    input.mpSubscriptionStatus === "authorized"
  ) {
    estado = "activo"
  } else if (
    input.pipelineLead &&
    ["prospecto", "visita", "trial"].includes(input.pipelineLead.etapa)
  ) {
    estado = "prospecto"
  } else {
    estado = "prospecto"
  }

  const currentIdx = pasoIndex(estado)
  const estadoLiteral = estado as TenantLifecycleState
  const pasos = LIFECYCLE_ORDER.map((id, idx) => ({
    id,
    label: LIFECYCLE_LABELS[id],
    completado: estadoLiteral !== "baja" && estadoLiteral !== "suspendido" && idx < currentIdx,
    actual: idx === currentIdx && estadoLiteral !== "baja",
  }))

  const accionesDisponibles: TenantLifecycle["accionesDisponibles"] =
    estadoLiteral === "suspendido" || estadoLiteral === "baja" ? ["reactivate"] : ["suspend"]

  return {
    estado,
    label: LIFECYCLE_LABELS[estado],
    descripcion: LIFECYCLE_DESCRIPTIONS[estado],
    pasoActual: currentIdx,
    pasos,
    suspendidoAt: input.deletedAt?.toISOString() ?? null,
    accionesDisponibles,
  }
}

export async function getTenantHealth(empresaId: number): Promise<TenantHealth> {
  const overview = await getOpsOverview(empresaId)
  const { resumen, entornos, erroresFuncionales } = overview

  const entornosError = entornos.filter(
    (e: { estado: string }) => e.estado === "error" || e.estado === "degradado",
  ).length

  const logsError = resumen.logsError24h
  const ticketsAbiertos = resumen.ticketsAbiertos
  const jobsActivos = resumen.jobsActivos
  const erroresCriticos = erroresFuncionales.filter(
    (e: { severidad: string }) => e.severidad === "fatal" || e.severidad === "error",
  ).length

  let nivel: TenantHealthLevel = "ok"
  if (entornosError > 0 || erroresCriticos > 2 || logsError > 10) {
    nivel = "error"
  } else if (ticketsAbiertos > 0 || logsError > 0 || jobsActivos > 2) {
    nivel = "warn"
  }

  const label =
    nivel === "ok" ? "Saludable" : nivel === "warn" ? "Atención requerida" : "Incidente activo"

  return {
    nivel,
    label,
    entornosError,
    logsError,
    ticketsAbiertos,
    jobsActivos,
    detalles: [
      {
        id: "entornos",
        label: "Entornos con error",
        valor: entornosError,
        nivel: entornosError > 0 ? "error" : "ok",
      },
      {
        id: "logs",
        label: "Logs de error (recientes)",
        valor: logsError,
        nivel: logsError > 5 ? "error" : logsError > 0 ? "warn" : "ok",
      },
      {
        id: "tickets",
        label: "Tickets abiertos",
        valor: ticketsAbiertos,
        nivel: ticketsAbiertos > 3 ? "error" : ticketsAbiertos > 0 ? "warn" : "ok",
      },
      {
        id: "jobs",
        label: "Jobs en curso",
        valor: jobsActivos,
        nivel: jobsActivos > 3 ? "warn" : "ok",
      },
    ],
  }
}

export async function getTenantRecentActivity(
  empresaId: number,
  pipelineLead: TenantPipelineLeadSummary | null,
): Promise<TenantActivityItem[]> {
  const [logs, jobs] = await Promise.all([
    listSistemaLogs(empresaId, 8),
    db().opsJob.findMany({
      where: { empresaId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, tipo: true, estado: true, createdAt: true },
    }),
  ])

  const items: TenantActivityItem[] = []

  if (pipelineLead) {
    items.push({
      id: `pipeline-${pipelineLead.id}`,
      tipo: "pipeline",
      titulo: `Pipeline: ${pipelineLead.etapaLabel}`,
      detalle: pipelineLead.proximaAccion ?? pipelineLead.nombre,
      createdAt: pipelineLead.updatedAt,
      href: "/claver-cloud/comercial",
    })
  }

  for (const job of jobs) {
    items.push({
      id: `job-${job.id}`,
      tipo: "job",
      titulo: `Ops job: ${job.tipo}`,
      detalle: `Estado: ${job.estado}`,
      createdAt: new Date(job.createdAt).toISOString(),
      href: `/claver-cloud/operations/${empresaId}`,
    })
  }

  for (const log of logs) {
    items.push({
      id: `log-${log.id}`,
      tipo: "log",
      titulo: log.categoria ?? "Sistema",
      detalle: log.mensaje,
      severidad: log.severidad,
      createdAt: new Date(log.createdAt).toISOString(),
    })
  }

  return items
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12)
}

export async function ejecutarAccionLifecycle(
  empresaId: number,
  action: "suspend" | "reactivate",
  actorEmail: string,
): Promise<{ ok: true; deletedAt: string | null }> {
  const empresa = await db().empresa.findUnique({
    where: { id: empresaId },
    select: { id: true, nombre: true, deletedAt: true },
  })
  if (!empresa) throw new Error("Empresa no encontrada")

  const deletedAt =
    action === "suspend" ? new Date() : action === "reactivate" ? null : empresa.deletedAt

  await db().empresa.update({
    where: { id: empresaId },
    data: { deletedAt },
  })

  void persistSistemaLog({
    empresaId,
    severidad: "info",
    categoria: "lifecycle",
    contexto: "tenant_admin",
    mensaje:
      action === "suspend"
        ? `Tenant suspendido por ${actorEmail}`
        : `Tenant reactivado por ${actorEmail}`,
    metadata: { action, actorEmail },
  })

  return { ok: true, deletedAt: deletedAt?.toISOString() ?? null }
}