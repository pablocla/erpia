import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canAccessClientOps } from "@/lib/auth/claver-analyst"
import { avanzarPipeline, crearPipelineValPrd } from "@/lib/ops/ops-service"

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    if (!canAccessClientOps(ctx.auth.rol)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const action = body?.action ?? "create"

    if (action === "advance" && body.pipelineId) {
      const pipeline = await avanzarPipeline(
        Number(body.pipelineId),
        ctx.auth.empresaId,
        ctx.auth.email,
      )
      return NextResponse.json(pipeline)
    }

    const pipeline = await crearPipelineValPrd(ctx.auth.empresaId, ctx.auth.email)
    return NextResponse.json(pipeline, { status: 201 })
  } catch (error) {
    console.error("Error pipeline ops:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}