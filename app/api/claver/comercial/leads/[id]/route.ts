import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import {
  PIPELINE_ETAPAS,
  getComercialLeadById,
  updateComercialLead,
  type PipelineEtapa,
} from "@/lib/ops/comercial-pipeline-service"
import { provisionarDesdeLead } from "@/lib/provisioning/provision-from-lead"

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

    if (body.provision) {
      const lead = await getComercialLeadById(leadId)
      if (!lead) {
        return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 })
      }
      if (lead.empresaId) {
        return NextResponse.json(
          { error: `El lead ya tiene tenant #${lead.empresaId}` },
          { status: 409 },
        )
      }

      const contactoEmail =
        body.contactoEmail?.trim()?.toLowerCase() || lead.email?.trim()?.toLowerCase()
      if (!contactoEmail) {
        return NextResponse.json(
          { error: "El lead necesita un email para provisionar" },
          { status: 400 },
        )
      }

      const result = await provisionarDesdeLead({
        leadId,
        contactoEmail,
        contactoNombre: body.contactoNombre || lead.nombre,
        analistaEmail: ctx.auth.email,
        engancheId: body.engancheId,
        planHosting: body.planHosting,
      })

      const updated = await getComercialLeadById(leadId)

      return NextResponse.json({
        ...updated,
        provision: {
          empresaId: result.empresaId,
          tempPassword: result.tempPassword,
          landingPath: result.landingPath,
        },
      })
    }

    const lead = await updateComercialLead(leadId, body)
    if (!lead) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error("Error actualizando lead comercial:", error)
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
