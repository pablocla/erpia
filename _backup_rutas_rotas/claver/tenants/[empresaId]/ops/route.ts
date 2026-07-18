import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystEmpresaContext } from "@/lib/auth/claver-analyst"
import { crearOpsJob, crearPipelineValPrd, getOpsOverview } from "@/lib/ops/ops-service"

const ACCIONES = ["diagnosticar", "reiniciar_opo"] as const

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId: raw } = await params
    const empresaId = Number(raw)
    if (!Number.isFinite(empresaId)) {
      return NextResponse.json({ error: "empresaId inválido" }, { status: 400 })
    }

    const ctx = await getClaverAnalystEmpresaContext(request, empresaId)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const action = body.action as (typeof ACCIONES)[number]
    if (!ACCIONES.includes(action)) {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
    }

    if (action === "diagnosticar") {
      const overview = await getOpsOverview(empresaId)
      const job = await crearOpsJob({
        empresaId,
        tipo: "healthcheck",
        iniciadoPor: ctx.auth.email,
        detalle: { origen: "command_center", action },
      })
      return NextResponse.json({
        ok: true,
        action,
        jobId: job.id,
        resumen: overview.resumen,
      })
    }

    const pipeline = await crearPipelineValPrd(empresaId, ctx.auth.email)
    const job = await crearOpsJob({
      empresaId,
      tipo: "restart_app",
      iniciadoPor: ctx.auth.email,
      detalle: { origen: "command_center", action, pipelineId: pipeline.id },
    })

    return NextResponse.json({
      ok: true,
      action,
      pipelineId: pipeline.id,
      jobId: job.id,
    })
  } catch (error) {
    console.error("Error tenant ops:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}