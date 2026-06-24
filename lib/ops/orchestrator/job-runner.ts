import { prisma } from "@/lib/prisma"
import { type OpsJobTipo } from "@/lib/ops/ops-types"
import { notifyAnalistasJobFallido } from "@/lib/ops/ops-notificaciones"
import { executeJobSteps } from "./step-executor"
import { canExecuteInline, dispatchWorkerJob, jobNeedsWorker } from "./worker-client"

export async function runJob(
  jobId: number,
  empresaId: number,
  entornoId: number | null,
  tipo: OpsJobTipo,
  steps: string[],
) {
  const isEnabled = process.env.OPS_ORCHESTRATOR_ENABLED === "true"
  const db = prisma as any

  await db.opsJob.update({
    where: { id: jobId },
    data: { estado: "en_progreso", startedAt: new Date() },
  })

  if (isEnabled && jobNeedsWorker(steps) && !canExecuteInline()) {
    try {
      const dispatch = await dispatchWorkerJob({ jobId, empresaId, entornoId, tipo, steps })
      if (dispatch.dispatched) {
        await db.opsJob.update({
          where: { id: jobId },
          data: {
            resultado: { workerChannel: dispatch.channel, encolado: true, steps },
          },
        })
        return
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      await finalizeJob(jobId, empresaId, tipo, [], msg, null, isEnabled)
      return
    }
  }

  const { resultados, jobError, deployMeta } = await executeJobSteps({
    jobId,
    empresaId,
    entornoId,
    steps,
    isEnabled,
  })

  await finalizeJob(jobId, empresaId, tipo, resultados, jobError, deployMeta, isEnabled)
}

async function finalizeJob(
  jobId: number,
  empresaId: number,
  tipo: OpsJobTipo,
  resultados: { paso: string; ok: boolean; detalle?: string }[],
  jobError: string | null,
  deployMeta: Record<string, unknown> | null,
  isEnabled: boolean,
) {
  const db = prisma as any
  await db.opsJob.update({
    where: { id: jobId },
    data: {
      estado: jobError ? "error" : "completado",
      finishedAt: new Date(),
      errorMsg: jobError,
      resultado: {
        ...(deployMeta ?? {}),
        pasos: resultados,
        nota: isEnabled ? "Ejecución real" : "Ejecución simulada",
      },
    },
  })

  if (jobError) {
    void notifyAnalistasJobFallido({ empresaId, jobId, tipo, errorMsg: jobError })
  }
}

/** Invocado por worker externo al terminar ejecución */
export async function completeWorkerJob(input: {
  jobId: number
  empresaId: number
  tipo: OpsJobTipo
  resultados: { paso: string; ok: boolean; detalle?: string }[]
  jobError: string | null
  deployMeta?: Record<string, unknown> | null
}) {
  await finalizeJob(
    input.jobId,
    input.empresaId,
    input.tipo,
    input.resultados,
    input.jobError,
    input.deployMeta ?? null,
    true,
  )
}