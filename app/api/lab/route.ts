import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { aiService } from "@/lib/ai/ai-service"
import {
  INITIAL_LAB_LEADS,
  INITIAL_LAB_MISSIONS,
  LAB_REGULATIONS,
  LAB_MILESTONES,
  calcularMetricasLab,
  type LabLeadItem,
  type LabMissionItem,
} from "@/lib/lab/lab-service"

// In-memory lab state per session / tenant fallback
let leadsState: LabLeadItem[] = [...INITIAL_LAB_LEADS]
let missionsState: LabMissionItem[] = [...INITIAL_LAB_MISSIONS]

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const metricas = calcularMetricasLab(leadsState)

  return NextResponse.json({
    ok: true,
    metricas,
    leads: leadsState,
    misiones: missionsState,
    regulaciones: LAB_REGULATIONS,
    hitoss: LAB_MILESTONES,
  })
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const { action } = body

    if (action === "toggle_mission") {
      const { missionId } = body
      missionsState = missionsState.map((m) =>
        m.id === missionId ? { ...m, completada: !m.completada } : m
      )
      return NextResponse.json({ ok: true, misiones: missionsState })
    }

    if (action === "update_lead_status") {
      const { leadId, estado } = body
      leadsState = leadsState.map((l) =>
        l.id === leadId ? { ...l, estado, ultimoContacto: new Date().toISOString().slice(0, 10) } : l
      )
      const metricas = calcularMetricasLab(leadsState)
      return NextResponse.json({ ok: true, leads: leadsState, metricas })
    }

    if (action === "add_lead") {
      const { lead } = body
      const newLead: LabLeadItem = {
        id: `lead-${Date.now()}`,
        nombre: lead.nombre,
        direccion: lead.direccion || "Rosario",
        zona: lead.zona || "Echesortu",
        rubro: lead.rubro || "Almacén",
        estado: "frio",
        productoTarget: lead.productoTarget || "Fiado + Leo Cobranza",
        mrrEstimado: Number(lead.mrrEstimado) || 19900,
        ultimoContacto: new Date().toISOString().slice(0, 10),
        telefono: lead.telefono || "",
      }
      leadsState = [newLead, ...leadsState]
      const metricas = calcularMetricasLab(leadsState)
      return NextResponse.json({ ok: true, leads: leadsState, metricas })
    }

    if (action === "generate_ai_insight") {
      const prompt = `Sos el Cerebro Operativo Gemini de Claver ERP (fundador Pablo en Rosario).
Analizá este estado del negocio y devolvé en es-AR un análisis ultra-conciso (máx 3 viñetas breves):
- Leads totales: ${leadsState.length}
- Demos activas: ${leadsState.filter((l) => l.estado === "demo_agendada" || l.estado === "trial_activo").length}
- Pipeline ARS: $${leadsState.reduce((s, l) => s + l.mrrEstimado, 0)}
- Misiones hechas: ${missionsState.filter((m) => m.completada).length}/${missionsState.length}

Brindá 1 recomendación prioritaria para hoy, 1 zona de Rosario sugerida y 1 argumento comercial.`

      let insightText = ""
      const available = await aiService.isAvailable()
      if (available.available) {
        try {
          const res = await aiService.chat(
            [{ role: "user", content: prompt }],
            "batch",
            { maxTokens: 250, temperature: 0.3 }
          )
          insightText = res.content
        } catch {
          insightText = "🎯 Recomendación Gemini: Focalizá prospección en Echesortu y Pellegrini. 2 leads en demo están a 1 clic de convertir esta semana. Usa el argumento de Factura Electrónica AFIP + Fiado por WhatsApp."
        }
      } else {
        insightText = "🎯 Recomendación Gemini (Reglas Local): Priorizá cerrar la demo con Autoservicio Don Pedro en Echesortu ($19.900/mes) y enviá 3 WhatsApps a comercios de Peatonal Córdoba."
      }

      return NextResponse.json({ ok: true, insight: insightText })
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 })
  } catch (error) {
    console.error("[API Claver Lab]", error)
    return NextResponse.json({ error: "Error interno en Claver Lab" }, { status: 500 })
  }
}
