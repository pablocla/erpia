import { FEATURES, isFeatureActiva } from "@/lib/config/rubro-config-service"
import {
  currentUsageMonth,
  getActiveSubscription,
  getMonthlyUsageCount,
  recordUsageEvent,
  seedCommercialCatalog,
  upsertSuscripcion,
} from "@/lib/platform/commercial-service"
import { SHEETS_LITE_SKU, SHEETS_PRO_SKU } from "@/lib/platform/sku-catalog"

export type SheetsTier = "lite" | "pro"
export type SheetsMeterAction = "execute" | "export"

export const SHEETS_LIMITS: Record<
  SheetsTier,
  { execute: number | null; export: number | null; savedReports: number | null }
> = {
  lite: { execute: 500, export: 20, savedReports: 3 },
  pro: { execute: null, export: null, savedReports: null },
}

export const SHEETS_PLANS = [
  {
    sku: SHEETS_LITE_SKU,
    nombre: "Clav Sheets Lite",
    descripcion: "Pivot, gráficos y export Excel — ideal para PyMEs",
    precioArs: 6900,
    tier: "lite" as const,
  },
  {
    sku: SHEETS_PRO_SKU,
    nombre: "Clav Sheets Pro",
    descripcion: "Reportes ilimitados, plantillas verticales y programación",
    precioArs: 14900,
    tier: "pro" as const,
  },
]

export interface SheetsEntitlement {
  ok: boolean
  tier: SheetsTier | null
  sku: string | null
  source?: "subscription" | "feature"
  reason?: "module_not_entitled" | "usage_execute_exceeded" | "usage_export_exceeded" | "saved_reports_exceeded"
  usage?: {
    mes: string
    execute: { usado: number; limite: number | null }
    export: { usado: number; limite: number | null }
    savedReports?: { usado: number; limite: number | null }
  }
}

function skuForTier(tier: SheetsTier): string {
  return tier === "pro" ? SHEETS_PRO_SKU : SHEETS_LITE_SKU
}

export async function resolveSheetsTier(empresaId: number): Promise<{
  tier: SheetsTier | null
  sku: string | null
  source: "subscription" | "feature" | null
}> {
  const pro = await getActiveSubscription(empresaId, SHEETS_PRO_SKU)
  if (pro) return { tier: "pro", sku: SHEETS_PRO_SKU, source: "subscription" }

  const lite = await getActiveSubscription(empresaId, SHEETS_LITE_SKU)
  if (lite) return { tier: "lite", sku: SHEETS_LITE_SKU, source: "subscription" }

  const featureOn = await isFeatureActiva(empresaId, FEATURES.CLAV_SHEETS)
  if (featureOn) return { tier: "lite", sku: null, source: "feature" }

  return { tier: null, sku: null, source: null }
}

async function buildUsageSnapshot(empresaId: number, tier: SheetsTier): Promise<SheetsEntitlement["usage"]> {
  const mes = currentUsageMonth()
  const sku = skuForTier(tier)
  const limits = SHEETS_LIMITS[tier]
  const executeUsado = await getMonthlyUsageCount(empresaId, sku, "execute", mes)
  const exportUsado = await getMonthlyUsageCount(empresaId, sku, "export", mes)
  return {
    mes,
    execute: { usado: executeUsado, limite: limits.execute },
    export: { usado: exportUsado, limite: limits.export },
  }
}

export async function getSheetsEntitlement(empresaId: number): Promise<SheetsEntitlement> {
  const resolved = await resolveSheetsTier(empresaId)
  if (!resolved.tier) {
    return { ok: false, tier: null, sku: null, reason: "module_not_entitled" }
  }
  return {
    ok: true,
    tier: resolved.tier,
    sku: resolved.sku,
    source: resolved.source ?? undefined,
    usage: await buildUsageSnapshot(empresaId, resolved.tier),
  }
}

export async function requireSheetsAccess(empresaId: number): Promise<SheetsEntitlement> {
  return getSheetsEntitlement(empresaId)
}

export async function requireSheetsExecute(empresaId: number): Promise<SheetsEntitlement> {
  const base = await getSheetsEntitlement(empresaId)
  if (!base.ok || !base.tier) return base

  const limit = SHEETS_LIMITS[base.tier].execute
  if (limit == null) return base

  const usado = base.usage?.execute.usado ?? 0
  if (usado >= limit) {
    return {
      ...base,
      ok: false,
      reason: "usage_execute_exceeded",
    }
  }
  return base
}

export async function requireSheetsExport(empresaId: number): Promise<SheetsEntitlement> {
  const base = await getSheetsEntitlement(empresaId)
  if (!base.ok || !base.tier) return base

  const limit = SHEETS_LIMITS[base.tier].export
  if (limit == null) return base

  const usado = base.usage?.export.usado ?? 0
  if (usado >= limit) {
    return {
      ...base,
      ok: false,
      reason: "usage_export_exceeded",
    }
  }
  return base
}

export async function requireSheetsSave(
  empresaId: number,
  currentSavedCount: number,
): Promise<SheetsEntitlement> {
  const base = await getSheetsEntitlement(empresaId)
  if (!base.ok || !base.tier) return base

  const limit = SHEETS_LIMITS[base.tier].savedReports
  if (limit == null) return base

  if (currentSavedCount >= limit) {
    return {
      ...base,
      ok: false,
      reason: "saved_reports_exceeded",
      usage: {
        ...base.usage!,
        savedReports: { usado: currentSavedCount, limite: limit },
      },
    }
  }
  return base
}

export async function trackSheetsUsage(
  empresaId: number,
  action: SheetsMeterAction,
): Promise<void> {
  const resolved = await resolveSheetsTier(empresaId)
  if (!resolved.tier) return
  const sku = skuForTier(resolved.tier)
  await recordUsageEvent(empresaId, sku, action)
}

export async function ensureDemoSheetsSubscription(empresaId: number, tier: SheetsTier = "pro") {
  await seedCommercialCatalog()
  const sku = skuForTier(tier)
  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + 14)

  return upsertSuscripcion(empresaId, {
    sku,
    activo: true,
    vigenciaHasta: trialEnd,
    limiteEventosMes: null,
  })
}

export function sheetsEntitlementStatus(entitlement: SheetsEntitlement): number {
  if (!entitlement.ok) {
    if (entitlement.reason?.startsWith("usage_")) return 402
    return 403
  }
  return 200
}

export function sheetsEntitlementPayload(entitlement: SheetsEntitlement) {
  return {
    entitled: entitlement.ok,
    tier: entitlement.tier,
    sku: entitlement.sku,
    source: entitlement.source,
    reason: entitlement.reason,
    usage: entitlement.usage,
    plans: SHEETS_PLANS,
    limits: entitlement.tier ? SHEETS_LIMITS[entitlement.tier] : null,
  }
}