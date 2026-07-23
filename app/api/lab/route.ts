import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { aiService } from "@/lib/ai/ai-service"
import {
  getLabDashboard,
  labToggleMission,
  labUpdateLeadStatus,
  labAddLead,
  labLogWaClick,
  labTrackCopy,
  labResetDemoData,
  buildRuleBasedInsight,
  type LabLeadEstado,
} from "@/lib/lab/lab-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const payload = await getLabDashboard(auth.auth.empresaId)
    return NextResponse.json(payload)
  } catch (error) {
    console.error("[API Claver Lab GET]", error)
    return NextResponse.json({ error: "Error al cargar Claver Lab" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const empresaId = auth.auth.empresaId

  try {
    const body = await request.json()
    const { action } = body

    if (action === "toggle_mission") {
      const payload = await labToggleMission(empresaId, String(body.missionId))
      return NextResponse.json(payload)
    }

    if (action === "update_lead_status") {
      const payload = await labUpdateLeadStatus(
        empresaId,
        String(body.leadId),
        body.estado as LabLeadEstado,
      )
      return NextResponse.json(payload)
    }

    if (action === "add_lead") {
      if (!body.lead?.nombre) {
        return NextResponse.json({ error: "nombre requerido" }, { status: 400 })
      }
      const payload = await labAddLead(empresaId, body.lead)
      return NextResponse.json(payload)
    }

    if (action === "log_wa_click") {
      const payload = await labLogWaClick(
        empresaId,
        String(body.leadId),
        body.variant === "B" ? "B" : body.variant === "custom" ? "custom" : "A",
      )
      return NextResponse.json(payload)
    }

    if (action === "track_copy") {
      const payload = await labTrackCopy(
        empresaId,
        String(body.packId),
        body.variant === "B" ? "B" : "A",
      )
      return NextResponse.json(payload)
    }

    if (action === "reset_demo") {
      const payload = await labResetDemoData(empresaId)
      return NextResponse.json(payload)
    }

    if (action === "generate_ai_insight") {
      const dash = await getLabDashboard(empresaId)
      const fallback = buildRuleBasedInsight(
        dash.leads,
        dash.misiones,
        dash.productSignals,
      )

      let insightText = fallback
      try {
        const available = await aiService.isAvailable()
        if (available.available) {
          const prompt = `Sos el coach comercial de Claver (ERP Argentina, ventas en Rosario).
Datos:
- Leads: ${dash.leads.length}, demos/trials: ${dash.metricas.demosActivas}
- MRR: ${dash.metricas.mrrActual}, pipeline: ${dash.metricas.pipelinePotencial}
- Next action: ${dash.nextAction.title}
- Fiado deudores en tenant: ${dash.productSignals.deudoresFiado}, Leo: ${dash.productSignals.leoActivo}
- Top lead: ${dash.leads[0]?.nombre ?? "n/a"} score ${dash.leads[0]?.score ?? 0}

Devolvé en es-AR máximo 4 viñetas cortas: 1 acción hoy, 1 zona, 1 argumento, 1 riesgo. Sin inventar leads.`
          const res = await aiService.chat(
            [{ role: "user", content: prompt }],
            "batch",
            { maxTokens: 280, temperature: 0.3 },
          )
          if (res.content?.trim()) insightText = res.content.trim()
        }
      } catch {
        insightText = fallback
      }

      return NextResponse.json({ ok: true, insight: insightText, nextAction: dash.nextAction })
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 })
  } catch (error) {
    console.error("[API Claver Lab POST]", error)
    return NextResponse.json({ error: "Error interno en Claver Lab" }, { status: 500 })
  }
}
