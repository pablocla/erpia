/**
 * Cliente worker externo para jobs ops pesados (backup, migrate, tests).
 *
 * Env:
 * - OPS_WORKER_WEBHOOK_URL — URL del worker (Railway / GH Action callback / /api/ops/worker/execute)
 * - OPS_WORKER_SECRET — shared secret Bearer
 * - GITHUB_TOKEN + GITHUB_REPO — opcional, dispara workflow ops-jobs.yml
 */

export interface WorkerJobPayload {
  jobId: number
  empresaId: number
  entornoId: number | null
  tipo: string
  steps: string[]
}

export function jobNeedsWorker(steps: string[]): boolean {
  const heavy = new Set([
    "export_schema",
    "backup_pre",
    "prisma_migrate_deploy",
    "readiness_modules",
    "readiness_integrations",
    "build",
    "migrate_db",
    "verify_schema",
    "verify_integrity",
    "snapshot_metadata",
  ])
  return steps.some((s) => heavy.has(s))
}

export async function dispatchWorkerJob(payload: WorkerJobPayload): Promise<{ dispatched: boolean; channel?: string }> {
  const secret = process.env.OPS_WORKER_SECRET
  const webhookUrl = process.env.OPS_WORKER_WEBHOOK_URL

  if (webhookUrl) {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Worker webhook falló (${res.status}): ${text}`)
    }
    return { dispatched: true, channel: "webhook" }
  }

  const ghToken = process.env.GITHUB_TOKEN
  const ghRepo = process.env.GITHUB_REPO
  if (ghToken && ghRepo) {
    const [owner, repo] = ghRepo.split("/")
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/ops-jobs.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ghToken}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: process.env.GITHUB_REF ?? "main",
          inputs: {
            job_id: String(payload.jobId),
            empresa_id: String(payload.empresaId),
            job_type: payload.tipo,
            steps: payload.steps.join(","),
          },
        }),
      },
    )
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`GitHub workflow dispatch falló (${res.status}): ${text}`)
    }
    return { dispatched: true, channel: "github_actions" }
  }

  return { dispatched: false }
}

export function canExecuteInline(): boolean {
  return process.env.OPS_WORKER_EXECUTE_INLINE === "true"
}