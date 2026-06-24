/**
 * Ejecuta un OpsJob desde CI/worker (GitHub Actions, Railway).
 * Uso: npx tsx scripts/ops-run-job.ts <jobId> <empresaId> <tipo> <steps_csv>
 */
import { executeJobSteps } from "../lib/ops/orchestrator/step-executor"
import { completeWorkerJob } from "../lib/ops/orchestrator/job-runner"
import type { OpsJobTipo } from "../lib/ops/ops-types"

const [jobId, empresaId, tipo, stepsRaw] = process.argv.slice(2)

if (!jobId || !empresaId || !tipo) {
  console.error("Uso: ops-run-job.ts <jobId> <empresaId> <tipo> [steps_csv]")
  process.exit(1)
}

const steps = stepsRaw
  ? stepsRaw.split(",").map((s) => s.trim()).filter(Boolean)
  : ["healthcheck"]

async function main() {
  const { resultados, jobError, deployMeta } = await executeJobSteps({
    jobId: Number(jobId),
    empresaId: Number(empresaId),
    entornoId: null,
    steps,
    isEnabled: true,
  })

  await completeWorkerJob({
    jobId: Number(jobId),
    empresaId: Number(empresaId),
    tipo: tipo as OpsJobTipo,
    resultados,
    jobError,
    deployMeta,
  })

  if (jobError) {
    console.error("Job falló:", jobError)
    process.exit(1)
  }
  console.log("Job completado OK")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})