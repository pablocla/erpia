import { prisma } from "@/lib/prisma"
import {
  PIPELINE_VAL_PRD_PASOS,
  type EntornoCodigo,
  type OpsJobTipo,
  type PipelinePaso,
} from "@/lib/ops/ops-types"
import { filterHandlerLogsByEmpresa } from "@/lib/ops/handler-log-filter"
import { esperarOpsJob } from "@/lib/ops/job-wait"
import { persistSistemaLog, listSistemaLogs } from "@/lib/ops/sistema-log"
import { runJob } from "./orchestrator/job-runner"

export { persistSistemaLog, listSistemaLogs }

const DEFAULT_ENTORNOS: { codigo: EntornoCodigo; nombre: string }[] = [
  { codigo: "dev", nombre: "Desarrollo" },
  { codigo: "val", nombre: "Validación" },
  { codigo: "prd", nombre: "Producción" },
]

const JOB_STEPS: Record<OpsJobTipo, string[]> = {
  healthcheck: ["healthcheck"],
  test_suite: ["readiness_modules", "readiness_integrations", "healthcheck"],
  backup_db: ["snapshot_metadata", "export_schema", "verify_integrity"],
  migrate_db: ["backup_pre", "prisma_migrate_deploy", "verify_schema"],
  restart_app: ["drain_connections", "redeploy", "warmup", "healthcheck"],
  deploy: ["build", "migrate_db", "deploy_app", "smoke_post", "healthcheck"],
}

const PASOS_CON_JOB: Record<string, OpsJobTipo> = {
  tests_auto: "test_suite",
  backup_pre: "backup_db",
  migrate_db: "migrate_db",
  deploy_app: "deploy",
  smoke_post: "healthcheck",
}

function appVersion() {
  return process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? process.env.npm_package_version ?? "local"
}

function entornoUrl(codigo: EntornoCodigo) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  if (codigo === "prd") return base
  if (codigo === "val") return base.replace("://", "://val.")
  return base.replace("://", "://dev.")
}

/**
 * Crea entornos lógicos dev/val/prd por tenant.
 * 
 * ESTRATEGIA DE INFRAESTRUCTURA REAL MULTI-TENANT (PR-H):
 * Para lograr un aislamiento real de infraestructura de desarrollo, validación y producción
 * por cada tenant (Cliente) de manera dinámica, se implementa el siguiente flujo:
 * 
 * 1. Aislamiento Frontend (Vercel Preview Deployments):
 *    - Cada entorno tiene un `vercelProjectId` asignado.
 *    - El deployment se gatilla vía API de Vercel apuntando a una branch específica del repositorio (ej. `br_<empresaId>_<codigo>`).
 *    - Vercel genera URLs únicas de preview que se mapean dinámicamente mediante CNAME / Wildcard DNS
 *      (ej. https://<cuit>-<codigo>.claver.cloud o subdominios wildcard en la configuración del proyecto).
 * 
 * 2. Aislamiento Backend (Supabase Database Branches):
 *    - Supabase soporta la ramificación de bases de datos (Database Branching).
 *    - Para cada entorno de pruebas o validación (`dev`/`val`), se crea una branch de base de datos vinculada
 *      al branch de git (`supabaseBranchRef`).
 *    - En producción (`prd`), se puede utilizar una instancia dedicada o un esquema aislado de base de datos
 *      según la configuración de `planHosting`.
 * 
 * Al inicializar los entornos, pre-poblamos `vercelProjectId` y `supabaseBranchRef` en el metadata.
 */
export async function ensureTenantEntornos(empresaId: number) {
  const db = prisma as any
  const existentes = await db.tenantEntorno.findMany({ where: { empresaId } })
  if (existentes.length >= 3) return existentes

  const codigos = new Set(existentes.map((e: { codigo: string }) => e.codigo))
  const creados = [...existentes]

  for (const ent of DEFAULT_ENTORNOS) {
    if (codigos.has(ent.codigo)) continue
    const creado = await db.tenantEntorno.create({
      data: {
        empresaId,
        codigo: ent.codigo,
        nombre: ent.nombre,
        estado: "activo",
        urlBase: entornoUrl(ent.codigo),
        version: appVersion(),
        dbProveedor: "supabase",
        dbNombre: `claverp_${empresaId}_${ent.codigo}`,
        metadata: {
          stack: "vercel+supabase",
          region: "sa-east-1",
          vercelProjectId: process.env.VERCEL_PROJECT_ID || `prj_claver_${empresaId}`,
          supabaseBranchRef: `br_${empresaId}_${ent.codigo}`,
        },
      },
    })
    creados.push(creado)
  }

  return creados
}

export async function getOpsOverview(empresaId: number) {
  const db = prisma as any
  await ensureTenantEntornos(empresaId)

  const [entornos, jobs, pipelines, logs, tickets, handlerErrorsRaw, agenteErrors] = await Promise.all([
    db.tenantEntorno.findMany({ where: { empresaId }, orderBy: { codigo: "asc" } }),
    db.opsJob.findMany({ where: { empresaId }, orderBy: { createdAt: "desc" }, take: 15 }),
    db.opsPipeline.findMany({ where: { empresaId }, orderBy: { updatedAt: "desc" }, take: 5 }),
    db.sistemaLog.findMany({
      where: { empresaId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.ticket.findMany({
      where: { empresaId, estado: { in: ["abierto", "en_progreso"] } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, numero: true, titulo: true, prioridad: true, estado: true, modulo: true, createdAt: true },
    }),
    db.handlerLog.findMany({
      where: { exito: false },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    db.agenteLog.findMany({
      where: { empresaId, status: "error" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ])

  const handlerErrors = filterHandlerLogsByEmpresa<any>(handlerErrorsRaw, empresaId, 10)

  const erroresFuncionales = [
    ...tickets.map((t: { numero: string; titulo: string; prioridad: string; modulo: string | null; createdAt: Date }) => ({
      tipo: "ticket",
      ref: t.numero,
      mensaje: t.titulo,
      severidad: t.prioridad === "critica" ? "fatal" : "error",
      modulo: t.modulo,
      createdAt: t.createdAt,
    })),
    ...handlerErrors.map((h: { handler: string; errorMsg: string | null; createdAt: Date }) => ({
      tipo: "handler",
      ref: h.handler,
      mensaje: h.errorMsg ?? "Error en handler",
      severidad: "error",
      modulo: "event-bus",
      createdAt: h.createdAt,
    })),
    ...agenteErrors.map((a: { agenteId: string; error: string | null; createdAt: Date }) => ({
      tipo: "agente_ia",
      ref: a.agenteId,
      mensaje: a.error ?? "Error en agente IA",
      severidad: "warn",
      modulo: "ia",
      createdAt: a.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const jobsActivos = jobs.filter((j: { estado: string }) => j.estado === "pendiente" || j.estado === "en_progreso").length
  const logsError = logs.filter((l: { severidad: string }) => l.severidad === "error" || l.severidad === "fatal").length

  return {
    entornos,
    jobs,
    pipelines,
    logs,
    tickets,
    erroresFuncionales: erroresFuncionales.slice(0, 20),
    resumen: {
      entornosActivos: entornos.filter((e: { estado: string }) => e.estado === "activo").length,
      jobsActivos,
      pipelinesEnCurso: pipelines.filter((p: { estado: string }) => p.estado === "en_curso").length,
      logsError24h: logsError,
      ticketsAbiertos: tickets.length,
      version: appVersion(),
      ambienteRuntime: process.env.NODE_ENV ?? "development",
      vercelEnv: process.env.VERCEL_ENV ?? "local",
    },
  }
}

export async function crearOpsJob(input: {
  empresaId: number
  entornoId?: number | null
  tipo: OpsJobTipo
  iniciadoPor: string
  detalle?: Record<string, unknown>
}) {
  const db = prisma as any
  const job = await db.opsJob.create({
    data: {
      empresaId: input.empresaId,
      entornoId: input.entornoId ?? null,
      tipo: input.tipo,
      estado: "pendiente",
      iniciadoPor: input.iniciadoPor,
      detalle: input.detalle ?? null,
    },
  })

  void runJob(job.id, input.empresaId, input.entornoId ?? null, input.tipo, JOB_STEPS[input.tipo] ?? ["healthcheck"])

  return job
}

export async function crearPipelineValPrd(empresaId: number, iniciadoPor: string) {
  const db = prisma as any
  const pasos: PipelinePaso[] = PIPELINE_VAL_PRD_PASOS.map((p) => ({
    ...p,
    estado: "pendiente",
  }))

  return db.opsPipeline.create({
    data: {
      empresaId,
      nombre: "Promoción VAL → PRD",
      origen: "val",
      destino: "prd",
      estado: "borrador",
      pasoActual: 0,
      pasos,
      iniciadoPor,
    },
  })
}

async function ejecutarPasoJob(
  empresaId: number,
  ejecutadoPor: string,
  paso: PipelinePaso,
  idx: number,
  pasos: PipelinePaso[],
): Promise<{ ok: boolean; pasos: PipelinePaso[] }> {
  const jobTipo = PASOS_CON_JOB[paso.codigo]
  if (!jobTipo) {
    pasos[idx] = { ...paso, estado: "ok", ejecutadoAt: new Date().toISOString() }
    return { ok: true, pasos }
  }

  const job = await crearOpsJob({ empresaId, tipo: jobTipo, iniciadoPor: ejecutadoPor })
  pasos[idx] = {
    ...paso,
    estado: "en_curso",
    detalle: `Job #${job.id} en ejecución`,
  }

  try {
    const result = await esperarOpsJob(job.id)
    if (result.estado === "error") {
      pasos[idx] = {
        ...paso,
        estado: "error",
        detalle: result.errorMsg ?? `Job #${job.id} falló`,
        ejecutadoAt: new Date().toISOString(),
      }
      return { ok: false, pasos }
    }
    pasos[idx] = {
      ...paso,
      estado: "ok",
      detalle: `Job #${job.id} completado`,
      ejecutadoAt: new Date().toISOString(),
    }
    return { ok: true, pasos }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    pasos[idx] = {
      ...paso,
      estado: "error",
      detalle: msg,
      ejecutadoAt: new Date().toISOString(),
    }
    return { ok: false, pasos }
  }
}

export async function avanzarPipeline(pipelineId: number, empresaId: number, ejecutadoPor: string) {
  const db = prisma as any
  const pipeline = await db.opsPipeline.findFirst({ where: { id: pipelineId, empresaId } })
  if (!pipeline) throw new Error("Pipeline no encontrado")

  const pasos = (pipeline.pasos as PipelinePaso[]) ?? []
  const idx = pipeline.pasoActual ?? 0
  if (idx >= pasos.length) return pipeline

  const paso = pasos[idx]
  pasos[idx] = {
    ...paso,
    estado: "en_curso",
    detalle: `Ejecutado por ${ejecutadoPor}`,
  }

  let stepOk = true
  if (PASOS_CON_JOB[paso.codigo]) {
    const result = await ejecutarPasoJob(empresaId, ejecutadoPor, paso, idx, pasos)
    stepOk = result.ok
    pasos.splice(0, pasos.length, ...result.pasos)
  } else {
    pasos[idx] = { ...paso, estado: "ok", ejecutadoAt: new Date().toISOString() }
  }

  if (!stepOk) {
    return db.opsPipeline.update({
      where: { id: pipelineId },
      data: {
        pasos,
        estado: "rechazado",
        updatedAt: new Date(),
      },
    })
  }

  const siguiente = idx + 1
  const completado = siguiente >= pasos.length

  return db.opsPipeline.update({
    where: { id: pipelineId },
    data: {
      pasos,
      pasoActual: siguiente,
      estado: completado ? "completado" : pipeline.estado === "borrador" ? "en_curso" : pipeline.estado,
      updatedAt: new Date(),
    },
  })
}

export async function cambiarEstadoEntorno(
  empresaId: number,
  entornoId: number,
  estado: string,
  ejecutadoPor: string,
) {
  const db = prisma as any
  const entorno = await db.tenantEntorno.update({
    where: { id: entornoId, empresaId },
    data: { estado, updatedAt: new Date() },
  })

  await persistSistemaLog({
    empresaId,
    entornoId,
    severidad: "info",
    categoria: "ops",
    contexto: "entorno:estado",
    mensaje: `Entorno ${entorno.codigo} → ${estado} por ${ejecutadoPor}`,
  })

  return entorno
}