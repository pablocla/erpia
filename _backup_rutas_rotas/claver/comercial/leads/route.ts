import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import {
  createComercialLead,
  listComercialLeads,
  PIPELINE_ETAPAS,
  type PipelineEtapa,
} from "@/lib/ops/comercial-pipeline-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const leads = await listComercialLeads()
    return NextResponse.json(leads)
  } catch (error) {
    console.error("Error listando leads comerciales:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    if (!body.nombre?.trim()) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })
    }

    if (body.etapa && !PIPELINE_ETAPAS.includes(body.etapa as PipelineEtapa)) {
      return NextResponse.json({ error: "Etapa inválida" }, { status: 400 })
    }

    const lead = await createComercialLead(body, ctx.auth.email)
    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    console.error("Error creando lead comercial:", error)
    return NextResponse.json(
      { error: "No se pudo crear el lead. ¿Corriste la migración de comercial_pipeline_leads?" },
      { status: 500 },
    )
  }
}