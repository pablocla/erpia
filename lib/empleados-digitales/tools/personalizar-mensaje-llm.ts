/**
 * Path 20% — reescribe plantilla con LLM. No elige destinatarios ni montos.
 * ED-10: prompt corto + maxOutput 120 · SEC-01: no inventa links/montos
 */

import { aiService } from "@/lib/ai/ai-service"
import { assertToolScope } from "../security"
import { checkLeoLimits, recordUsage } from "../metering"
import type { DeudaItem, EmpleadoLeoCobranzaConfig, ToolContext } from "../types"

function extractUrls(text: string): string[] {
  return text.match(/https?:\/\/[^\s]+/gi) ?? []
}

function montoOk(mensaje: string, montoArs: number): boolean {
  const montoStr = String(Math.round(montoArs))
  const fmt = new Intl.NumberFormat("es-AR").format(montoArs)
  const fmtCur = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(montoArs)
  return (
    mensaje.includes(montoStr) ||
    mensaje.includes(fmt) ||
    mensaje.includes(fmtCur) ||
    mensaje.includes(fmtCur.replace(/\s/g, ""))
  )
}

export async function personalizarMensajeLlm(
  ctx: ToolContext,
  config: EmpleadoLeoCobranzaConfig,
  input: { deuda: DeudaItem; plantillaBase: string },
): Promise<{ mensaje: string; tokensIn: number; tokensOut: number; usedLlm: boolean }> {
  assertToolScope(ctx, ctx.empresaId, "personalizar_mensaje_llm")

  // Trial / límites
  if (!config.llmEnabled) {
    return { mensaje: input.plantillaBase, tokensIn: 0, tokensOut: 0, usedLlm: false }
  }

  const limits = await checkLeoLimits(ctx.empresaId, ctx.empleadoId, config, "llm_call")
  if (!limits.ok) {
    return { mensaje: input.plantillaBase, tokensIn: 0, tokensOut: 0, usedLlm: false }
  }

  const available = await aiService.isAvailable()
  if (!available.available) {
    return { mensaje: input.plantillaBase, tokensIn: 0, tokensOut: 0, usedLlm: false }
  }

  // Prompt corto (ED-10)
  const system =
    "Sos Leo. Reescribí este WA de cobranza en es-AR. Conservá monto, días, nombres y link si hay. Sin amenazas ni URLs nuevas. Máx 350 caracteres. Solo el mensaje."

  const user = JSON.stringify({
    m: Math.round(input.deuda.montoArs),
    d: input.deuda.diasVencido,
    c: input.deuda.clienteNombre,
    e: input.deuda.empresaNombre,
    t: input.plantillaBase.slice(0, 400),
    link: Boolean(input.deuda.linkPago),
  })

  const allowedUrls = new Set([
    ...extractUrls(input.plantillaBase),
    ...(input.deuda.linkPago ? [input.deuda.linkPago.trim()] : []),
  ])

  try {
    const res = await aiService.chat(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      "realtime",
      { maxTokens: 120, temperature: 0.3 },
    )

    let mensaje = (res.content || "").trim() || input.plantillaBase
    const tokensIn = res.tokensUsed ? Math.floor(res.tokensUsed * 0.6) : 80
    const tokensOut = res.tokensUsed ? Math.ceil(res.tokensUsed * 0.4) : 40

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

    if (mensaje.length > 500) {
      return { mensaje: input.plantillaBase, tokensIn, tokensOut, usedLlm: true }
    }

    // SEC-01: URLs no whitelist → plantilla
    const urls = extractUrls(mensaje)
    for (const u of urls) {
      const ok = [...allowedUrls].some((a) => u.startsWith(a) || a.startsWith(u.replace(/[.,);]+$/, "")))
      if (!ok && allowedUrls.size > 0) {
        return { mensaje: input.plantillaBase, tokensIn, tokensOut, usedLlm: true }
      }
      if (!ok && allowedUrls.size === 0) {
        // sin link permitido: strip urls inventadas
        mensaje = mensaje.replace(u, "").replace(/\s{2,}/g, " ").trim()
      }
    }

    if (!montoOk(mensaje, input.deuda.montoArs)) {
      return { mensaje: input.plantillaBase, tokensIn, tokensOut, usedLlm: true }
    }

    return { mensaje, tokensIn, tokensOut, usedLlm: true }
  } catch (err) {
    console.warn("[Leo] LLM fallback a plantilla:", err)
    return { mensaje: input.plantillaBase, tokensIn: 0, tokensOut: 0, usedLlm: false }
  }
}
