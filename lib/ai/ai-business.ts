/**
 * AI Business Service — High-level orchestrator that combines:
 * - context-builder (real business data from Prisma)
 * - system-prompts (rubro-specific personality)
 * - aiService (Ollama/Anthropic dual provider)
 *
 * One method per business capability. Each is self-contained with try/catch.
 * If AI is down → graceful fallback, never breaks the ERP.
 */

import { z } from "zod"
import { aiService, type AIMessage } from "./ai-service"
import { buildEmpresaContexto, type EmpresaContexto } from "./context-builder"
import { buildSystemPrompt } from "./system-prompts"

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

export const AlertaSchema = z.object({
  alertas: z.array(z.object({
    tipo: z.enum(["stock_critico", "demanda_cayendo", "cliente_inactivo", "cobranza_urgente", "anomalia", "oportunidad", "turno", "caja", "general"]),
    prioridad: z.enum(["alta", "media", "baja"]),
    titulo: z.string(),
    descripcion: z.string(),
    accion_sugerida: z.string().optional(),
    datos: z.record(z.any()).optional(),
  })),
})

export const ReporteSchema = z.object({
  resumen: z.string(),
  metricas_clave: z.array(z.object({
    label: z.string(),
    valor: z.string(),
    tendencia: z.enum(["sube", "baja", "estable"]).optional(),
  })),
  insights: z.array(z.string()),
  recomendaciones: z.array(z.string()),
  alertas_criticas: z.array(z.string()),
})

export const MensajeWhatsAppSchema = z.object({
  mensajes: z.array(z.object({
    destinatario: z.string(),
    telefono: z.string(),
    mensaje: z.string(),
    tipo: z.enum(["recordatorio_turno", "cobranza", "cliente_inactivo", "stock", "pedido", "general"]),
    prioridad: z.number().min(1).max(10),
  })),
})

export const ProyeccionSchema = z.object({
  proyeccion_semana: z.number(),
  proyeccion_mes: z.number(),
  confianza: z.enum(["alta", "media", "baja"]),
  factores: z.array(z.string()),
  recomendaciones_stock: z.array(z.object({
    producto: z.string(),
    cantidad_sugerida: z.number(),
    razon: z.string(),
  })),
})

export type AlertasResult = z.infer<typeof AlertaSchema>
export type ReporteResult = z.infer<typeof ReporteSchema>
export type MensajesWAResult = z.infer<typeof MensajeWhatsAppSchema>
export type ProyeccionResult = z.infer<typeof ProyeccionSchema>

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildMessages(contexto: EmpresaContexto, userPrompt: string, jsonOnly = true): AIMessage[] {
  const suffix = jsonOnly ? "\n\nRespondé ÚNICAMENTE con JSON válido, sin texto adicional ni markdown." : ""
  return [
    { role: "system", content: buildSystemPrompt(contexto) + suffix },
    { role: "user", content: userPrompt },
  ]
}

async function chatJsonSafe<T>(messages: AIMessage[], schema: z.ZodSchema<T>, tier: "realtime" | "batch" | "nightly", fallback: T): Promise<T> {
  try {
    const response = await aiService.chatJson<T>(messages, tier)
    if (response.data) {
      const parsed = schema.safeParse(response.data)
      if (parsed.success) return parsed.data
    }
    return fallback
  } catch {
    return fallback
  }
}

// ─── CHAT LIBRE ───────────────────────────────────────────────────────────────

// Máximo de intercambios (user+assistant) a incluir en el contexto del LLM.
// Evita que conversaciones largas superen el context window del modelo.
const MAX_HISTORIAL_PARES = 10

export async function chatConNegocio(
  empresaId: number,
  userMessage: string,
  historial: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<string> {
  const status = await aiService.isAvailable()
  if (!status.available) return "El asistente IA no está disponible. Verificá que Ollama esté corriendo."

  try {
    const contexto = await buildEmpresaContexto(empresaId)

    // Truncar historial para no superar el context window del modelo.
    // Tomamos los últimos MAX_HISTORIAL_PARES*2 mensajes (user+assistant por par).
    const historialTruncado = historial.slice(-(MAX_HISTORIAL_PARES * 2))

    const messages: AIMessage[] = [
      { role: "system", content: buildSystemPrompt(contexto) },
      ...historialTruncado.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: userMessage },
    ]

    const response = await aiService.chat(messages, "batch")
    return response.content || "No pude procesar tu consulta. Intentá de nuevo."
  } catch (err) {
    console.error("[AI Business] chatConNegocio error:", err)
    return "Hubo un error procesando tu consulta. Intentá de nuevo en unos segundos."
  }
}

// ─── ALERTAS INTELIGENTES ─────────────────────────────────────────────────────

export async function generarAlertasInteligentes(empresaId: number): Promise<AlertasResult> {
  const fallback: AlertasResult = { alertas: [] }
  try {
    const contexto = await buildEmpresaContexto(empresaId)
    const messages = buildMessages(contexto, `Analizá todos los datos del negocio y generá las alertas más importantes para hoy.

Considerá:
1. Stock bajo en productos críticos para el rubro
2. Clientes con deuda vencida hace más de 30 días
3. Clientes inactivos que solían comprar con frecuencia
4. Turnos sin confirmar para mañana
5. Tendencias de venta preocupantes (caída vs semana anterior)
6. Cualquier anomalía o oportunidad en los datos

Respondé con este JSON exacto:
{
  "alertas": [
    {
      "tipo": "stock_critico|demanda_cayendo|cliente_inactivo|cobranza_urgente|anomalia|oportunidad|turno|caja|general",
      "prioridad": "alta|media|baja",
      "titulo": "título corto de la alerta",
      "descripcion": "descripción detallada con números reales del contexto",
      "accion_sugerida": "qué hacer al respecto",
      "datos": {}
    }
  ]
}

Ordená por prioridad descendente. Máximo 8 alertas.`)

    return await chatJsonSafe(messages, AlertaSchema, "nightly", fallback)
  } catch (err) {
    console.error("[AI Business] generarAlertasInteligentes error:", err)
    return fallback
  }
}

// ─── REPORTE ──────────────────────────────────────────────────────────────────

export async function generarReporte(empresaId: number, periodo: "dia" | "semana" | "mes"): Promise<ReporteResult> {
  const fallback: ReporteResult = { resumen: "No se pudo generar el reporte.", metricas_clave: [], insights: [], recomendaciones: [], alertas_criticas: [] }
  try {
    const contexto = await buildEmpresaContexto(empresaId)
    const periodoTexto = { dia: "hoy", semana: "esta semana", mes: "este mes" }[periodo]
    const ventasPeriodo = { dia: contexto.snapshot.ventasHoy, semana: contexto.snapshot.ventasSemana, mes: contexto.snapshot.ventasMes }[periodo]

    const messages = buildMessages(contexto, `Generá un reporte completo del negocio para ${periodoTexto}.

Ventas del período: $${ventasPeriodo.total.toLocaleString("es-AR")} en ${ventasPeriodo.cantidad} operaciones.
Historial de ventas diarias (últimos 30 días): ${JSON.stringify(contexto.historico.ventasUltimos30Dias).slice(0, 6000)}

Respondé con este JSON:
{
  "resumen": "párrafo de 2-3 líneas con el estado general del negocio",
  "metricas_clave": [
    { "label": "nombre de la métrica", "valor": "valor formateado", "tendencia": "sube|baja|estable" }
  ],
  "insights": ["observación 1", "observación 2"],
  "recomendaciones": ["acción concreta 1", "acción concreta 2"],
  "alertas_criticas": ["alerta urgente 1"]
}`)

    return await chatJsonSafe(messages, ReporteSchema, "batch", fallback)
  } catch (err) {
    console.error("[AI Business] generarReporte error:", err)
    return fallback
  }
}

// ─── MENSAJES WHATSAPP ────────────────────────────────────────────────────────

export async function generarMensajesWhatsApp(
  empresaId: number,
  tipo: "cobranza" | "inactivos" | "turnos" | "todos"
): Promise<MensajesWAResult> {
  const fallback: MensajesWAResult = { mensajes: [] }
  try {
    const contexto = await buildEmpresaContexto(empresaId)

    let instruccion = ""
    if (tipo === "cobranza" || tipo === "todos") {
      instruccion += `\nDEUDORES — generá mensajes de cobranza cordiales pero directos para:\n${contexto.snapshot.clientesDeudores.slice(0, 8).map(c => `- ${c.nombre}: debe $${c.deuda.toLocaleString("es-AR")}${c.diasVencido > 0 ? ` (vencido ${c.diasVencido} días)` : ""}`).join("\n")}\n`
    }
    if (tipo === "inactivos" || tipo === "todos") {
      instruccion += `\nCLIENTES INACTIVOS — generá mensajes de reactivación para:\n${contexto.historico.clientesInactivos.slice(0, 5).map(c => `- ${c.nombre}: ${c.diasSinCompra} días sin comprar, promedio $${c.promedioCompra.toLocaleString("es-AR")}`).join("\n")}\n`
    }
    if (tipo === "turnos" || tipo === "todos") {
      instruccion += `\nTURNOS — Hay ${contexto.snapshot.turnosPendientesManana} turnos para mañana que necesitan recordatorio.\n`
    }

    if (!instruccion.trim()) return fallback

    const messages = buildMessages(contexto, `Generá mensajes de WhatsApp personalizados para cada destinatario.
Los mensajes deben ser en español rioplatense, amigables, con el nombre del negocio: ${contexto.empresa.nombre}.
No deben superar 3 líneas. No usar emojis en exceso (máximo 1-2 por mensaje).

${instruccion}

Respondé con este JSON:
{
  "mensajes": [
    {
      "destinatario": "nombre del cliente",
      "telefono": "1100000000",
      "mensaje": "texto del mensaje listo para enviar",
      "tipo": "recordatorio_turno|cobranza|cliente_inactivo|stock|pedido|general",
      "prioridad": 1
    }
  ]
}

Ordená por prioridad descendente (10 = máxima urgencia).`)

    return await chatJsonSafe(messages, MensajeWhatsAppSchema, "batch", fallback)
  } catch (err) {
    console.error("[AI Business] generarMensajesWhatsApp error:", err)
    return fallback
  }
}

// ─── PROYECCIÓN DE VENTAS ─────────────────────────────────────────────────────

export async function generarProyeccion(empresaId: number): Promise<ProyeccionResult> {
  const fallback: ProyeccionResult = { proyeccion_semana: 0, proyeccion_mes: 0, confianza: "baja", factores: [], recomendaciones_stock: [] }
  try {
    const contexto = await buildEmpresaContexto(empresaId)

    const messages = buildMessages(contexto, `Basándote en el historial de ventas de los últimos 30 días, proyectá:
1. Ventas de la próxima semana (en pesos)
2. Ventas del mes completo (en pesos)
3. Qué productos hay que reponer y en qué cantidad

Historial diario: ${JSON.stringify(contexto.historico.ventasUltimos30Dias).slice(0, 6000)}
Stock crítico actual: ${JSON.stringify(contexto.snapshot.stockCritico).slice(0, 4000)}

Respondé con este JSON:
{
  "proyeccion_semana": 0,
  "proyeccion_mes": 0,
  "confianza": "alta|media|baja",
  "factores": ["factor que influye en la proyección"],
  "recomendaciones_stock": [
    {
      "producto": "nombre del producto",
      "cantidad_sugerida": 0,
      "razon": "por qué recomendás esa cantidad"
    }
  ]
}`)

    return await chatJsonSafe(messages, ProyeccionSchema, "batch", fallback)
  } catch (err) {
    console.error("[AI Business] generarProyeccion error:", err)
    return fallback
  }
}
