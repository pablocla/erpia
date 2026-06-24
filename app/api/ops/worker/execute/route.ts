import { NextRequest, NextResponse } from "next/server"
import { executeJobSteps } from "@/lib/ops/orchestrator/step-executor"
import { completeWorkerJob } from "@/lib/ops/orchestrator/job-runner"
import type { OpsJobTipo } from "@/lib/ops/ops-types"

function verifyWorkerSecret(request: NextRequest): boolean {
  const secret = process.env.OPS_WORKER_SECRET
  if (!secret) return process.env.NODE_ENV !== "production"
  const auth = request.headers.get("authorization")
  return auth === `Bearer ${secret}`
}

export async function POST(request: NextRequest) {
  if (!verifyWorkerSecret(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { jobId, empresaId, entornoId, tipo, steps } = body as {
      jobId: number
      empresaId: number
      entornoId: number | null
      tipo: OpsJobTipo
      steps: string[]
    }

    if (!jobId || !empresaId || !tipo || !Array.isArray(steps)) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }

    const { resultados, jobError, deployMeta } = await executeJobSteps({
      jobId,
      empresaId,
      entornoId: entornoId ?? null,
      steps,
      isEnabled: true,
    })

    await completeWorkerJob({
      jobId,
      empresaId,
      tipo,
      resultados,
      jobError,
      deployMeta,
    })

    return NextResponse.json({ ok: true, estado: jobError ? "error" : "completado" })
  } catch (error) {
    console.error("Worker execute error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}