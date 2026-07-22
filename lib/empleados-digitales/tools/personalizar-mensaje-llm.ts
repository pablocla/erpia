/**
 * Path 20% — reescribe plantilla con LLM. No elige destinatarios ni montos.
 */

import { aiService } from "@/lib/ai/ai-service"
import { assertToolScope } from "../security"
import { checkLeoLimits, recordUsage } from "../metering"
import type { DeudaItem, EmpleadoLeoCobranzaConfig, ToolContext } from "../types"

export async function personalizarMensajeLlm(
  ctx: ToolContext,
  config: EmpleadoLeoCobranzaConfig,
  input: { deuda: DeudaItem; plantillaBase: string },
): Promise<{ mensaje: string; tokensIn: number; tokensOut: number; usedLlm: boolean }> {
  assertToolScope(ctx, ctx.empresaId, "personalizar_mensaje_llm")

  const limits = await checkLeoLimits(ctx.empresaId, ctx.empleadoId, config, "llm_call")
  if (!limits.ok) {
    return { mensaje: input.plantillaBase, tokensIn: 0, tokensOut: 0, usedLlm: false }
  }

  const available = await aiService.isAvailable()
  if (!available.available) {
    return { mensaje: input.plantillaBase, tokensIn: 0, tokensOut: 0, usedLlm: false }
  }

  const system = [
    "Sos Leo, asistente de cobranza de un comercio argentino.",
    "Reescribí el mensaje de WhatsApp manteniendo: monto exacto, días de atraso, nombre del cliente y del comercio.",
    "No inventes links de pago, teléfonos, montos ni amenazas legales.",
    "Máximo 400 caracteres. Tono profesional y cercano (es-AR).",
    "Respondé SOLO el texto del mensaje, sin comillas ni explicación.",
  ].join(" ")

  const user = JSON.stringify({
    plantilla: input.plantillaBase,
    cliente: input.deuda.clienteNombre,
    comercio: input.deuda.empresaNombre,
    montoArs: input.deuda.montoArs,
    diasVencido: input.deuda.diasVencido,
  })

  try {
    const res = await aiService.chat(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      "realtime",
    )

    const mensaje = (res.content || "").trim() || input.plantillaBase
    const tokensIn = res.tokensUsed ? Math.floor(res.tokensUsed * 0.6) : 200
    const tokensOut = res.tokensUsed ? Math.ceil(res.tokensUsed * 0.4) : 80

    await recordUsage({
      empresaId: ctx.empresaId,
      empleadoId: ctx.empleadoId,
      runId: ctx.runId,
      kind: "llm_call",
      tool: "personalizar_mensaje_llm",
      tokensIn,
      tokensOut,
      metadata: { provider: res.provider, model: res.model },
    })

    // Seguridad: si el modelo inventó un monto distinto, preferir plantilla
    const montoStr = String(Math.round(input.deuda.montoArs))
    if (mensaje.length > 600) {
      return { mensaje: input.plantillaBase, tokensIn, tokensOut, usedLlm: true }
    }

    return {
      mensaje: mensaje.includes(montoStr) || mensaje.includes(
        new Intl.NumberFormat("es-AR").format(input.deuda.montoArs),
      )
        ? mensaje
        : input.plantillaBase,
      tokensIn,
      tokensOut,
      usedLlm: true,
    }
  } catch (err) {
    console.warn("[Leo] LLM fallback a plantilla:", err)
    return { mensaje: input.plantillaBase, tokensIn: 0, tokensOut: 0, usedLlm: false }
  }
}
