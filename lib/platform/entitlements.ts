import { isFeatureActiva } from "@/lib/config/rubro-config-service"
import { AUTOMATION_SKU, SKU_TO_FEATURE } from "./sku-catalog"
import {
  getActiveSubscription,
  getMonthlyUsageTotal,
  recordUsageEvent,
  resolveEventLimit,
} from "./commercial-service"

export interface AccessResult {
  ok: boolean
  sku: string
  reason?: string
  source?: "subscription" | "feature" | "unrestricted"
  usage?: { mes: string; usado: number; limite: number | null }
}

export async function canUseSku(empresaId: number, sku: string): Promise<AccessResult> {
  const featureKey = SKU_TO_FEATURE[sku]

  const subscription = await getActiveSubscription(empresaId, sku)
  if (subscription) {
    const limit = await resolveEventLimit(empresaId, sku)
    if (limit != null) {
      const usado = await getMonthlyUsageTotal(empresaId, sku)
      if (usado >= limit) {
        return {
          ok: false,
          sku,
          reason: "usage_limit_exceeded",
          source: "subscription",
          usage: { mes: new Date().toISOString().slice(0, 7), usado, limite: limit },
        }
      }
    }
    return { ok: true, sku, source: "subscription" }
  }

  if (!featureKey) {
    return { ok: true, sku, source: "unrestricted" }
  }

  const activa = await isFeatureActiva(empresaId, featureKey)
  if (!activa) {
    return {
      ok: false,
      sku,
      reason: "module_not_entitled",
      source: "feature",
    }
  }
  return { ok: true, sku, source: "feature" }
}

export async function requireAutomationEntitlement(
  empresaId: number
): Promise<AccessResult> {
  return canUseSku(empresaId, AUTOMATION_SKU)
}

export async function trackAutomationUsage(
  empresaId: number,
  eventKey: string
): Promise<void> {
  const access = await canUseSku(empresaId, AUTOMATION_SKU)
  if (!access.ok) return
  await recordUsageEvent(empresaId, AUTOMATION_SKU, eventKey)
}