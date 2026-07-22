/**
 * Router 0-token: decide template | llm | skip sin llamar al modelo.
 */

import type { DeudaItem, EmpleadoLeoCobranzaConfig, RouteDecision } from "../types"

export function decideMensajePath(
  d: DeudaItem,
  cfg: EmpleadoLeoCobranzaConfig,
  ctx: { contactos7d: number; yaContactadoHoy: boolean },
): RouteDecision {
  if (d.montoArs < cfg.montoMinArs) {
    return { path: "skip", reason: "monto_bajo" }
  }
  if (d.diasVencido < cfg.diasVencidoMin) {
    return { path: "skip", reason: "aun_no_vence_umbral" }
  }
  if (ctx.yaContactadoHoy || ctx.contactos7d >= cfg.maxContactosCliente7d) {
    return { path: "skip", reason: "anti_spam" }
  }
  if (cfg.excluirClienteIds.includes(d.clienteId)) {
    return { path: "skip", reason: "excluido" }
  }
  if (!d.telefono?.trim()) {
    return { path: "skip", reason: "sin_telefono" }
  }

  // 80% default: plantilla
  if (!cfg.llmEnabled) {
    return { path: "template", reason: "llm_disabled" }
  }

  const hard =
    d.diasVencido >= cfg.llmSoloSi.diasVencidoMin ||
    d.montoArs >= cfg.llmSoloSi.montoMinArs ||
    (cfg.llmSoloSi.primerContacto && ctx.contactos7d === 0 && d.diasVencido >= 21)

  if (hard) {
    return { path: "llm", reason: "caso_complejo" }
  }

  return { path: "template", reason: "default_rules" }
}

/** Score determinista 0–100 (mayor = más prioritario) */
export function scoreDeuda(d: {
  montoArs: number
  diasVencido: number
}): number {
  const aging = Math.min(50, d.diasVencido * 1.2)
  const monto = Math.min(40, Math.log10(Math.max(1, d.montoArs)) * 8)
  return Math.round(aging + monto)
}

export function scoreDeudas<T extends { montoArs: number; diasVencido: number }>(
  items: T[],
): Array<T & { score: number }> {
  return items
    .map((d) => ({ ...d, score: scoreDeuda(d) }))
    .sort((a, b) => b.score - a.score)
}
