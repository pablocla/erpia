import { NextRequest, NextResponse } from "next/server"
import { aiService } from "@/lib/ai/ai-service"

const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 20
const hits = new Map<string, { count: number; resetAt: number }>()

function rateLimit(ip: string) {
  const now = Date.now()
  const rec = hits.get(ip)
  if (!rec || now > rec.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (rec.count >= MAX_PER_WINDOW) return false
  rec.count += 1
  return true
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
    if (!rateLimit(ip)) {
      return NextResponse.json({ error: "Demasiados mensajes. Esperá un minuto." }, { status: 429 })
    }

    const { agentRole, agentDepartment, userMessage, context } = await req.json()
    const timestamp = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })

    const traces = [
      {
        timestamp,
        tool: "Claver Agent City",
        action: `Intent contra alcance ${agentDepartment || "ERP"}`,
        status: "success",
        durationMs: 8,
        cost: 0,
      },
    ]

    const systemPrompt = `Sos ${agentRole || "un agente ERP autónomo"} del departamento ${agentDepartment || "Operaciones"} en Agent City (lab de Claver).
La empresa corre TOTVS Protheus y procesos ARCA/AFIP Argentina.
Hablá como operador de backend, no como chatbot genérico.
Respondé en el idioma del usuario (español rioplatense si habla español).
Si el dato no está en el contexto, decilo. No inventes CAE, saldos ni TES como si estuvieran en producción.
Contexto: ${JSON.stringify(context || {})}`

    const result = await aiService.chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: String(userMessage || "").slice(0, 4000) },
      ],
      "realtime",
      { maxTokens: 800, temperature: 0.4 },
    )

    if (result.content) {
      traces.push({
        timestamp,
        tool: result.provider,
        action: `Modelo ${result.model} (${result.durationMs}ms)`,
        status: "success",
        durationMs: result.durationMs,
        cost: 0,
      })
      return NextResponse.json({
        reply: result.content,
        modelUsed: `${result.model} (${result.provider})`,
        traces,
        cost: 0,
        isLiveModel: result.provider !== "none",
      })
    }

    const lower = String(userMessage || "").toLowerCase()
    let reply =
      `Gemini no respondió (¿falta GOOGLE_GENERATIVE_AI_API_KEY?). Como agente de ${agentDepartment || "Operaciones"} dejo el caso en cola. ` +
      `Esto es el lab de Agent City: el chat es el único cable vivo; el mapa y el feed siguen siendo simulación.`

    if (lower.includes("factura") || lower.includes("invoice") || lower.includes("tes")) {
      reply = `Lab — diagnóstico de ejemplo, no es el ERP en vivo.
- Factura #18392: TSS rechazó porque D2_TES llegó NULL.
- SX3 / SD2010 movimiento M02 sin fórmula de relación.
- Pedí aprobación #APP-824 para parche X3_RELACAO = "501".
Hasta que el job lea SQL de verdad, esto es un caso de playbook, no un CAE real.`
    }

    return NextResponse.json({
      reply,
      modelUsed: "fallback-lab (sin modelo vivo)",
      traces,
      cost: 0,
      isLiveModel: false,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Error interno del agente", details: String(error) },
      { status: 500 },
    )
  }
}
