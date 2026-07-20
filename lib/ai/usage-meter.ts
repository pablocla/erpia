/**
 * Soft meter de uso IA — techo mensual gratis + upsell.
 * Usa UsageEvent (sku core.ia) sin bloquear de golpe en tier bajo.
 */

import {
  getMonthlyUsageCount,
  recordUsageEvent,
  resolveEventLimit,
} from "@/lib/platform/commercial-service"
import { AI_ENTITLEMENT_SKU } from "@/lib/ai/ai-route-guard"

/** Tope soft por defecto si no hay limiteEventosMes en suscripción */
export const AI_DEFAULT_MONTHLY_SOFT_LIMIT = Number(
  process.env.AI_MONTHLY_SOFT_LIMIT ?? 100,
)

export type AiUsageGate =
  | { ok: true; usado: number; limite: number; remaining: number }
  | { ok: false; usado: number; limite: number; code: "AI_USAGE_LIMIT" }

export async function checkAndRecordAiChatUsage(
  empresaId: number,
): Promise<AiUsageGate> {
  const subLimit = await resolveEventLimit(empresaId, AI_ENTITLEMENT_SKU)
  // null en resolve = sin límite de producto → aplicamos soft default (freemium)
  const limite = subLimit === null ? AI_DEFAULT_MONTHLY_SOFT_LIMIT : subLimit
  // limite 0 o negativo = ilimitado (plan pro)
  if (limite <= 0) {
    await recordUsageEvent(empresaId, AI_ENTITLEMENT_SKU, "chat")
    return { ok: true, usado: 0, limite: 0, remaining: 999999 }
  }

  const usado = await getMonthlyUsageCount(empresaId, AI_ENTITLEMENT_SKU, "chat")
  if (usado >= limite) {
    return { ok: false, usado, limite, code: "AI_USAGE_LIMIT" }
  }

  await recordUsageEvent(empresaId, AI_ENTITLEMENT_SKU, "chat")
  return {
    ok: true,
    usado: usado + 1,
    limite,
    remaining: Math.max(0, limite - usado - 1),
  }
}
