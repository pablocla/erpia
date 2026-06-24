import { prisma } from "@/lib/prisma"
import { persistSistemaLog } from "@/lib/ops/sistema-log"
import { runSmokeTests } from "@/lib/ops/test-runner"
import { createDeployment } from "./vercel-client"
import { backupDatabase, runPrismaMigrate } from "./supabase-client"
import { decryptCredentials } from "@/lib/integrations/core/credential-vault"

export type StepResult = { paso: string; ok: boolean; detalle?: string }

async function runHealthcheck(empresaId: number, entornoId: number) {
  const started = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    const ms = Date.now() - started
    const db = prisma as any
    await db.tenantEntorno.update({
      where: { id: entornoId },
      data: { estado: "activo", ultimoHealthcheck: new Date() },
    })
    await persistSistemaLog({
      empresaId,
      entornoId,
      severidad: "info",
      categoria: "ops",
      contexto: "healthcheck",
      mensaje: `Healthcheck OK (${ms}ms)`,
      metadata: { latencyMs: ms },
    })
    return { ok: true, latencyMs: ms }
  } catch (error) {
    const db = prisma as any
    await db.tenantEntorno.update({
      where: { id: entornoId },
      data: { estado: "error", ultimoHealthcheck: new Date() },
    })
    const msg = error instanceof Error ? error.message : String(error)
    await persistSistemaLog({
      empresaId,
      entornoId,
      severidad: "fatal",
      categoria: "ops",
      contexto: "healthcheck",
      mensaje: `Healthcheck falló: ${msg}`,
    })
    return { ok: false, error: msg }
  }
}

export async function resolveEntornoId(empresaId: number, entornoId: number | null, codigo = "prd") {
  if (entornoId) return entornoId
  const db = prisma as any
  const entorno = await db.tenantEntorno.findFirst({ where: { empresaId, codigo } })
  return entorno?.id ?? null
}

export async function executeStep(
  paso: string,
  ctx: {
    jobId: number
    empresaId: number
    entornoId: number | null
    isEnabled: boolean
  },
): Promise<{ ok: boolean; detalle: string; deployMeta?: Record<string, unknown> }> {
  const { jobId, empresaId, entornoId, isEnabled } = ctx
  const db = prisma as any

  if (!isEnabled) {
    await new Promise((r) => setTimeout(r, 80))
    if (paso === "healthcheck") {
      const ent = await resolveEntornoId(empresaId, entornoId)
      const hc = ent ? await runHealthcheck(empresaId, ent) : { ok: true }
      if (!hc.ok) throw new Error((hc as { error?: string }).error ?? "Healthcheck falló")
      return { ok: true, detalle: "DB reachable" }
    }
    return { ok: true, detalle: `${paso} simulado (OPS_ORCHESTRATOR_ENABLED=false)` }
  }

  if (paso === "healthcheck") {
    const ent = await resolveEntornoId(empresaId, entornoId)
    if (!ent) return { ok: true, detalle: "Sin entorno para healthcheck" }
    const hc = await runHealthcheck(empresaId, ent)
    if (!hc.ok) throw new Error((hc as { error?: string }).error ?? "Error")
    return { ok: true, detalle: "Healthcheck OK" }
  }

  if (paso === "readiness_modules" || paso === "readiness_integrations") {
    const tests = await runSmokeTests()
    const testMeta = {
      testsPassed: tests.passed,
      testsDurationMs: tests.durationMs,
      testsTotal: tests.totalTests,
      testsFailedList: tests.failedTests,
      testsSimulated: tests.simulated,
    }
    if (!tests.passed) {
      const err = new Error(
        tests.simulated
          ? "Tests simulados OK"
          : `Smoke tests fallaron: ${tests.failedTests?.join(", ") ?? "ver stderr"}`,
      )
      ;(err as any).deployMeta = testMeta
      throw err
    }
    return {
      ok: true,
      detalle: tests.simulated
        ? `${paso} simulado (OPS_TEST_RUNNER_ENABLED=false)`
        : `${paso} OK — ${tests.totalTests ?? "?"} tests en ${tests.durationMs}ms`,
      deployMeta: testMeta,
    }
  }

  if (paso === "deploy_app" || paso === "redeploy") {
    const ent = await resolveEntornoId(empresaId, entornoId)
    if (ent) {
      await db.tenantEntorno.update({
        where: { id: ent },
        data: { estado: "desplegando", updatedAt: new Date() },
      })
    }
    const deployRes = await createDeployment()
    const deployMeta = {
      vercelDeploymentId: deployRes.id,
      vercelUrl: deployRes.url,
      readyState: deployRes.readyState,
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
    }
    await db.opsJob.update({ where: { id: jobId }, data: { resultado: deployMeta } })
    return { ok: true, detalle: `Despliegue iniciado (ID: ${deployRes.id})`, deployMeta }
  }

  if (paso === "export_schema" || paso === "backup_pre") {
    const ent = await resolveEntornoId(empresaId, entornoId)
    let connectionString: string | undefined = undefined
    if (ent) {
      const entRecord = await db.tenantEntorno.findUnique({ where: { id: ent } })
      if (entRecord?.metadata && typeof entRecord.metadata === "object") {
        const meta = entRecord.metadata as Record<string, any>
        if (meta.connectionMode === "dedicated" && meta.connectionStringEnc) {
          const decrypted = decryptCredentials(meta.connectionStringEnc)
          connectionString = decrypted.connectionString
        }
      }
    }
    const backupRes = await backupDatabase(empresaId, connectionString)
    return { ok: true, detalle: backupRes.message }
  }

  if (paso === "prisma_migrate_deploy") {
    const ent = await resolveEntornoId(empresaId, entornoId)
    let connectionString: string | undefined = undefined
    if (ent) {
      const entRecord = await db.tenantEntorno.findUnique({ where: { id: ent } })
      if (entRecord?.metadata && typeof entRecord.metadata === "object") {
        const meta = entRecord.metadata as Record<string, any>
        if (meta.connectionMode === "dedicated" && meta.connectionStringEnc) {
          const decrypted = decryptCredentials(meta.connectionStringEnc)
          connectionString = decrypted.connectionString
        }
      }
    }
    const mig = await runPrismaMigrate(connectionString)
    return { ok: true, detalle: `Migración: ${mig.stdout?.slice(0, 500) ?? "ok"}` }
  }

  return { ok: true, detalle: `${paso} omitido/simulado (sin driver)` }
}

export async function executeJobSteps(input: {
  jobId: number
  empresaId: number
  entornoId: number | null
  steps: string[]
  isEnabled?: boolean
}): Promise<{ resultados: StepResult[]; jobError: string | null; deployMeta: Record<string, unknown> | null }> {
  const isEnabled = input.isEnabled ?? process.env.OPS_ORCHESTRATOR_ENABLED === "true"
  const resultados: StepResult[] = []
  let jobError: string | null = null
  let deployMeta: Record<string, any> = {}

  for (const paso of input.steps) {
    try {
      const res = await executeStep(paso, {
        jobId: input.jobId,
        empresaId: input.empresaId,
        entornoId: input.entornoId,
        isEnabled,
      })
      if (res.deployMeta) deployMeta = { ...deployMeta, ...res.deployMeta }
      resultados.push({ paso, ok: res.ok, detalle: res.detalle })
      await persistSistemaLog({
        empresaId: input.empresaId,
        entornoId: input.entornoId ?? undefined,
        severidad: "info",
        categoria: "ops",
        contexto: `job:${input.jobId}`,
        mensaje: `Paso completado: ${paso}`,
        metadata: { detalle: res.detalle },
      })
    } catch (error: any) {
      const detalle = error instanceof Error ? error.message : String(error)
      resultados.push({ paso, ok: false, detalle })
      jobError = detalle
      if (error?.deployMeta) {
        deployMeta = { ...deployMeta, ...error.deployMeta }
      }
      break
    }
  }

  const ent = await resolveEntornoId(input.empresaId, input.entornoId)
  if (ent && deployMeta && !jobError) {
    const db = prisma as any
    await db.tenantEntorno.update({
      where: { id: ent },
      data: {
        estado: "activo",
        version: (deployMeta.commitSha as string) ?? undefined,
        updatedAt: new Date(),
      },
    })
  } else if (ent && jobError && input.steps.some((s) => s === "deploy_app" || s === "redeploy")) {
    const db = prisma as any
    await db.tenantEntorno.update({
      where: { id: ent },
      data: { estado: "error", updatedAt: new Date() },
    })
  }

  return {
    resultados,
    jobError,
    deployMeta: Object.keys(deployMeta).length ? (deployMeta as Record<string, unknown>) : null,
  }
}