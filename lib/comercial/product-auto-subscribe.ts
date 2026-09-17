/**
 * Política de suscripción automática de productos.
 *
 * - Automático: anclas gratis, demos, trials de enganche, packs calle.
 * - Pago: Mercado Pago / checkout (sin intervención humana).
 * - Analista: SKUs planned, setup one-shot, hardware, AFIP prod, casos grises.
 */

import { isSkuProvisionable } from "@/lib/marketplace/sku-availability"
import { resolveOferta, skuEsAnclaGratis } from "@/lib/comercial/ofertas-comerciales"
import { resolvePackCalle, type ModoLite } from "@/lib/comercial/pack-calle-catalog"
import { getProductoHorizontal } from "@/lib/platform/product-registry"
import { SETUP_FEE_SKU } from "@/lib/comercial/ofertas-comerciales"
import { precioCobrableSku } from "@/lib/comercial/precio-minimo"
import { isProtheusLicenseSku } from "@/lib/comercial/protheus-license"

export type SubscribeMode =
  | "auto_free" // permanente gratis (ancla)
  | "auto_trial" // se activa solo, vence con trial
  | "auto_paid" // se activa vía pago (MP) sin analista
  | "analyst" // requiere intervención humana
  | "blocked" // no se puede vender / planned

export type SubscribeContext =
  | "industry_demo"
  | "activar_intent"
  | "register"
  | "marketplace"
  | "billing"
  | "ops_force"
  | "seed_demo"

export interface AutoSubscribeDecision {
  sku: string
  mode: SubscribeMode
  /** Si true, el backend puede llamar activarProducto sin UI de pago */
  canAutoActivate: boolean
  reason: string
  /** Quién interviene si no es auto */
  owner: "system" | "cliente" | "analista"
  requiresPayment: boolean
  trialEligible: boolean
}

/** SKUs que nunca se auto-activan: setup humano, hardware físico, compliance */
const ALWAYS_ANALYST = new Set([
  SETUP_FEE_SKU,
  "pack.hardware_pos",
  "impl.setup_one_shot",
  "afip.cert_prod",
  "svc.implementacion",
])

/** Orígenes donde el provision es libre (demo / seed / force) */
const ORIGEN_AUTO = new Set([
  "industry_demo",
  "seed_demo",
  "demo",
  "ops_force",
  "retail_onboarding",
  "activar_intent",
  "subscribe_free",
  "test",
  "marketplace_analista",
  "pack",
])

export function resolveAutoSubscribe(
  sku: string,
  opts?: {
    context?: SubscribeContext
    engancheId?: string | null
    modoLite?: ModoLite
    origen?: string
  },
): AutoSubscribeDecision {
  const context = opts?.context ?? "marketplace"
  const origen = opts?.origen ?? context
  const origenBase = origen.split(":")[0] ?? origen

  if (!isSkuProvisionable(sku)) {
    return {
      sku,
      mode: "blocked",
      canAutoActivate: false,
      reason: "SKU en catálogo como Próximamente — no se auto-activa",
      owner: "analista",
      requiresPayment: false,
      trialEligible: false,
    }
  }

  if (isProtheusLicenseSku(sku)) {
    return {
      sku,
      mode: "auto_paid",
      canAutoActivate: true,
      reason: "Licencia anual TOTVS — se activa en el alta, no pasa por trial ni Mercado Pago",
      owner: "system",
      requiresPayment: false,
      trialEligible: false,
    }
  }

  if (ALWAYS_ANALYST.has(sku)) {
    return {
      sku,
      mode: "analyst",
      canAutoActivate: context === "ops_force" || origenBase === "ops_force",
      reason: "Requiere setup / hardware / compliance — intervienen analista o implementador",
      owner: "analista",
      requiresPayment: true,
      trialEligible: false,
    }
  }

  const oferta = resolveOferta(opts?.engancheId ?? sku, opts?.modoLite)
  if (skuEsAnclaGratis(oferta, sku) || sku === "pos.fiado_barrio") {
    return {
      sku,
      mode: "auto_free",
      canAutoActivate: true,
      reason: "Ancla gratis permanente — se activa sola",
      owner: "system",
      requiresPayment: false,
      trialEligible: false,
    }
  }

  const altaAncla =
    (context === "activar_intent" || context === "register") &&
    oferta.autoActivarMonetizados === false
  if (altaAncla) {
    return {
      sku,
      mode: "auto_paid",
      canAutoActivate: false,
      reason: "Extra de pago — no se activa en el alta del ancla; paywall / Mi plan",
      owner: "cliente",
      requiresPayment: true,
      trialEligible: false,
    }
  }

  // Demo / onboarding retail: todo el enganche va automático en trial
  if (
    context === "industry_demo" ||
    context === "activar_intent" ||
    context === "register" ||
    context === "seed_demo" ||
    ORIGEN_AUTO.has(origenBase)
  ) {
    return {
      sku,
      mode: "auto_trial",
      canAutoActivate: true,
      reason: `Activación automática en contexto ${context} (trial/demo)`,
      owner: "system",
      requiresPayment: false,
      trialEligible: true,
    }
  }

  const pack = resolvePackCalle(sku)
  const producto = getProductoHorizontal(sku)
  const precio = producto ? precioCobrableSku(sku, producto.precioArs) : 0

  if (precio <= 0 || pack?.precioArs === 0) {
    return {
      sku,
      mode: "auto_free",
      canAutoActivate: true,
      reason: "Precio 0 — auto-subscribe",
      owner: "system",
      requiresPayment: false,
      trialEligible: false,
    }
  }

  // Marketplace / billing: cliente paga solo (MP), sin analista
  if (context === "marketplace" || context === "billing") {
    return {
      sku,
      mode: "auto_paid",
      canAutoActivate: false,
      reason: "Producto de pago — checkout automático (Mercado Pago), sin analista",
      owner: "cliente",
      requiresPayment: true,
      trialEligible: true,
    }
  }

  return {
    sku,
    mode: "analyst",
    canAutoActivate: false,
    reason: "Caso no mapeado — revisar con analista Claver",
    owner: "analista",
    requiresPayment: precio > 0,
    trialEligible: true,
  }
}

/**
 * Filtra SKUs que el sistema puede activar solo en un provision.
 * Los blocked/analyst (sin force) se reportan aparte para el embudo.
 */
export function partitionSkusForAutoActivate(
  skus: string[],
  opts?: Parameters<typeof resolveAutoSubscribe>[1],
): {
  auto: string[]
  paid: string[]
  analyst: string[]
  blocked: string[]
  decisions: AutoSubscribeDecision[]
} {
  const decisions = skus.map((sku) => resolveAutoSubscribe(sku, opts))
  return {
    auto: decisions.filter((d) => d.canAutoActivate).map((d) => d.sku),
    paid: decisions.filter((d) => d.mode === "auto_paid").map((d) => d.sku),
    analyst: decisions.filter((d) => d.mode === "analyst").map((d) => d.sku),
    blocked: decisions.filter((d) => d.mode === "blocked").map((d) => d.sku),
    decisions,
  }
}

export function summarizeSubscribePolicy(decisions: AutoSubscribeDecision[]): string {
  const counts = { auto_free: 0, auto_trial: 0, auto_paid: 0, analyst: 0, blocked: 0 }
  for (const d of decisions) counts[d.mode]++
  return [
    `auto_free=${counts.auto_free}`,
    `auto_trial=${counts.auto_trial}`,
    `auto_paid=${counts.auto_paid}`,
    `analyst=${counts.analyst}`,
    `blocked=${counts.blocked}`,
  ].join(" · ")
}
