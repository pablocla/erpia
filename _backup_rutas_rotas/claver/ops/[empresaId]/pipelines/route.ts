import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystEmpresaContext } from "@/lib/auth/claver-analyst"
import { avanzarPipeline, crearPipelineValPrd } from "@/lib/ops/ops-service"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId: raw } = await params
    const empresaId = Number(raw)
    const ctx = await getClaverAnalystEmpresaContext(request, empresaId)
    if (!ctx.ok) return ctx.response

    const body = await request.json().catch(() => ({}))
    const action = body?.action ?? "create"

    if (action === "advance" && body.pipelineId) {
      const pipeline = await avanzarPipeline(
        Number(body.pipelineId),
        empresaId,
        ctx.auth.email,
      )
      return NextResponse.json(pipeline)
    }

    const pipeline = await crearPipelineValPrd(empresaId, ctx.auth.email)
    return NextResponse.json(pipeline, { status: 201 })
  } catch (error) {
    console.error("Error pipeline analista:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}