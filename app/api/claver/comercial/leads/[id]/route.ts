import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import {
  PIPELINE_ETAPAS,
  updateComercialLead,
  type PipelineEtapa,
} from "@/lib/ops/comercial-pipeline-service"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const leadId = Number(id)
    if (!Number.isFinite(leadId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await request.json()
    if (body.etapa && !PIPELINE_ETAPAS.includes(body.etapa as PipelineEtapa)) {
      return NextResponse.json({ error: "Etapa inválida" }, { status: 400 })
    }

    const lead = await updateComercialLead(leadId, body)
    if (!lead) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error("Error actualizando lead comercial:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}