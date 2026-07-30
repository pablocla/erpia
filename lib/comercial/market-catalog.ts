/**
 * Unified market catalog — AR sub-SaaS or US English apps over the same core.
 * Activation always uses real SKUs from the core product.
 */

import {
  formatMarketPrice,
  getMarketConfig,
  type MarketId,
} from "@/lib/comercial/markets"
import {
  SUB_SAAS_APPS,
  getSubSaasApp,
  isSubSaasFuncionalActiva,
  sortSubSaasForMarketplace,
  type SubSaasApp,
  type SubSaasEstado,
  type SubSaasPlataforma,
} from "@/lib/comercial/sub-saas-catalog"
import {
  US_DESTACADOS,
  US_SAAS_APPS,
  getUsAppByCoreSlug,
  getUsAppBySku,
  getUsSaasApp,
  usMarketplaceGroups,
  type UsSaasApp,
} from "@/lib/comercial/us-saas-catalog"
import { activarRegisterHref } from "@/lib/comercial/activar-intent"

export interface MarketCatalogApp {
  slug: string
  /** Core slug used for product-shell / AR landing alias */
  coreSlug: string
  marca: string
  nombre: string
  lema: string
  descripcion: string
  sku: string
  skusAdicionales?: string[]
  precio: number
  currency: "ARS" | "USD" | "MXN" | "BRL"
  marketId: MarketId
  trialDias: number
  anclaGratis: boolean
  modoLite: SubSaasApp["modoLite"]
  dashboardPath: string
  publicPath?: string
  estado: SubSaasEstado
  listoPct: number
  plataforma: SubSaasPlataforma
  rubros: string[]
  pains: string[]
  outcomes: string[]
  pasosActivacion: string[]
  gatilloPago?: string
  roiCopy?: string
  wave?: number
  collective?: string
}

function arToMarketApp(app: SubSaasApp): MarketCatalogApp {
  return {
    slug: app.slug,
    coreSlug: app.slug,
    marca: app.marca,
    nombre: app.nombre,
    lema: app.lema,
    descripcion: app.descripcion,
    sku: app.sku,
    skusAdicionales: app.skusAdicionales,
    precio: app.precioArs,
    currency: "ARS",
    marketId: "ar",
    trialDias: app.trialDias,
    anclaGratis: app.precioArs === 0,
    modoLite: app.modoLite,
    dashboardPath: app.dashboardPath,
    publicPath: app.publicPath,
    estado: app.estado,
    listoPct: app.listoPct,
    plataforma: app.plataforma,
    rubros: app.rubros,
    pains: app.pains,
    outcomes: app.outcomes,
    pasosActivacion: app.pasosActivacion,
  }
}

function usToMarketApp(app: UsSaasApp): MarketCatalogApp {
  return {
    slug: app.slug,
    coreSlug: app.coreSlug,
    marca: app.marca,
    nombre: app.nombre,
    lema: app.lema,
    descripcion: app.descripcion,
    sku: app.sku,
    skusAdicionales: app.skusAdicionales,
    precio: app.precioUsd,
    currency: "USD",
    marketId: "us",
    trialDias: app.trialDias,
    anclaGratis: app.anclaGratis,
    modoLite: app.modoLite,
    dashboardPath: app.dashboardPath,
    publicPath: app.publicPath,
    estado: app.estado,
    listoPct: app.listoPct,
    plataforma: app.plataforma,
    rubros: app.rubros,
    pains: app.pains,
    outcomes: app.outcomes,
    pasosActivacion: app.pasosActivacion,
    gatilloPago: app.gatilloPago,
    roiCopy: app.roiCopy,
    wave: app.wave,
    collective: app.collective,
  }
}

/** Apps shown in public catalog for a market */
export function getMarketCatalogApps(marketId: MarketId): MarketCatalogApp[] {
  if (marketId === "us") {
    return US_SAAS_APPS.map(usToMarketApp)
  }
  // MX / BR: reuse AR catalog shape for now (same products, local locale via i18n)
  return sortSubSaasForMarketplace(SUB_SAAS_APPS).map(arToMarketApp)
}

export function getMarketCatalogApp(
  marketId: MarketId,
  slug: string,
): MarketCatalogApp | null {
  if (marketId === "us") {
    const byUs = getUsSaasApp(slug)
    if (byUs) return usToMarketApp(byUs)
    // Allow core slug (cobra) → English US app when market is US
    const byCore = getUsAppByCoreSlug(slug)
    if (byCore) return usToMarketApp(byCore)
    return null
  }
  const ar = getSubSaasApp(slug)
  return ar ? arToMarketApp(ar) : null
}

export function marketCatalogGroups(marketId: MarketId): {
  activas: MarketCatalogApp[]
  beta: MarketCatalogApp[]
  proximamente: MarketCatalogApp[]
} {
  if (marketId === "us") {
    const g = usMarketplaceGroups()
    return {
      activas: g.activas.map(usToMarketApp),
      beta: g.beta.map(usToMarketApp),
      proximamente: g.proximamente.map(usToMarketApp),
    }
  }
  const ordered = sortSubSaasForMarketplace(SUB_SAAS_APPS)
  return {
    activas: ordered.filter(isSubSaasFuncionalActiva).map(arToMarketApp),
    beta: ordered.filter((a) => a.estado === "beta").map(arToMarketApp),
    proximamente: ordered.filter((a) => a.estado === "proximamente").map(arToMarketApp),
  }
}

export function marketDestacadas(marketId: MarketId): MarketCatalogApp[] {
  if (marketId === "us") {
    return US_DESTACADOS.map((s) => getUsSaasApp(s)).filter(Boolean).map((a) => usToMarketApp(a!))
  }
  return getMarketCatalogApps("ar").filter((a) =>
    ["fiado", "cobra", "turnos", "pos", "tienda"].includes(a.slug),
  )
}

export function fmtMarketAppPrice(app: MarketCatalogApp): string {
  return formatMarketPrice(app.precio, app.marketId)
}

export function marketAppActivarHref(app: MarketCatalogApp): string {
  // Prefer US marketing slug when present so intent resolution can brand correctly
  return activarRegisterHref(app.slug)
}

export function marketAppLandingHref(app: MarketCatalogApp): string {
  return `/claver/apps/${app.slug}`
}

/**
 * Resolve marketing slug/sku to activation fields across markets.
 * - US marketing slugs (collect, house-tab) → core SKU + English brand
 * - AR slugs (cobra, fiado) stay AR — do NOT remap via coreSlug (would steal AR branding)
 */
export function resolveMarketProductIntent(raw: string): {
  sku: string
  slug: string
  coreSlug: string
  marca: string
  nombre: string
  lema: string
  modoLite: SubSaasApp["modoLite"]
  dashboardPath: string
  marketHint?: MarketId
} | null {
  const decoded = decodeURIComponent(raw.trim())

  // 1) Explicit US marketing slug only (not coreSlug alias)
  const usBySlug = getUsSaasApp(decoded)
  if (usBySlug) {
    return {
      sku: usBySlug.sku,
      slug: usBySlug.slug,
      coreSlug: usBySlug.coreSlug,
      marca: usBySlug.marca,
      nombre: usBySlug.nombre,
      lema: usBySlug.lema,
      modoLite: usBySlug.modoLite,
      dashboardPath: usBySlug.dashboardPath,
      marketHint: "us",
    }
  }

  // 2) AR catalog by slug
  const ar = getSubSaasApp(decoded)
  if (ar) {
    return {
      sku: ar.sku,
      slug: ar.slug,
      coreSlug: ar.slug,
      marca: ar.marca,
      nombre: ar.nombre,
      lema: ar.lema,
      modoLite: ar.modoLite,
      dashboardPath: ar.dashboardPath,
      marketHint: "ar",
    }
  }

  // 3) SKU match — prefer AR brand if both share SKU (same core)
  const arBySku = SUB_SAAS_APPS.find(
    (a) => a.sku === decoded || a.skusAdicionales?.includes(decoded),
  )
  if (arBySku) {
    return {
      sku: arBySku.sku,
      slug: arBySku.slug,
      coreSlug: arBySku.slug,
      marca: arBySku.marca,
      nombre: arBySku.nombre,
      lema: arBySku.lema,
      modoLite: arBySku.modoLite,
      dashboardPath: arBySku.dashboardPath,
      marketHint: "ar",
    }
  }

  const usBySku = getUsAppBySku(decoded)
  if (usBySku) {
    return {
      sku: usBySku.sku,
      slug: usBySku.slug,
      coreSlug: usBySku.coreSlug,
      marca: usBySku.marca,
      nombre: usBySku.nombre,
      lema: usBySku.lema,
      modoLite: usBySku.modoLite,
      dashboardPath: usBySku.dashboardPath,
      marketHint: "us",
    }
  }

  return null
}

/** Project MarketCatalogApp into SubSaasApp for legacy landing components */
export function marketAppAsSubSaas(app: MarketCatalogApp): SubSaasApp {
  return {
    slug: app.slug,
    marca: app.marca,
    nombre: app.nombre,
    lema: app.lema,
    descripcion: app.descripcion,
    sku: app.sku,
    skusAdicionales: app.skusAdicionales,
    precioArs: app.currency === "ARS" ? app.precio : app.precio, // display layer should use fmtMarketAppPrice
    trialDias: app.trialDias,
    modoLite: app.modoLite,
    dashboardPath: app.dashboardPath,
    publicPath: app.publicPath,
    publicPathLabel: undefined,
    procesosReciclados: app.coreSlug ? [app.coreSlug] : [],
    serviciosBackend: [],
    listoPct: app.listoPct,
    estado: app.estado,
    plataforma: app.plataforma,
    redesScore: 8,
    impactoScore: 9,
    rubros: app.rubros,
    reelHook: app.lema,
    pains: app.pains,
    outcomes: app.outcomes,
    pasosActivacion: app.pasosActivacion,
    upsellSkus: undefined,
  }
}

export function marketLabelCopy(marketId: MarketId): {
  badge: string
  heroTitle: string
  heroSubtitle: string
  ctaTrial: string
  ctaCatalog: string
  priceSuffix: string
  freeLabel: string
  activeLabel: string
  betaLabel: string
} {
  const m = getMarketConfig(marketId)
  if (marketId === "us") {
    return {
      badge: "Apps that go live in minutes · United States",
      heroTitle: "Business apps that pay for themselves",
      heroSubtitle:
        "Collections, bookings, house tabs, memberships, and field sales — automatic activation, real value on day one. Same Claver core, localized for the US.",
      ctaTrial: "Start free trial",
      ctaCatalog: "Browse apps",
      priceSuffix: "/ mo · 14-day trial",
      freeLabel: "Free",
      activeLabel: "Live apps",
      betaLabel: "Beta",
    }
  }
  return {
    badge: `Apps funcionales · ${m.label}`,
    heroTitle: "Catálogo de apps y packs",
    heroSubtitle:
      "Primero las apps listas para usar. Después packs, automatizaciones y betas.",
    ctaTrial: "Probar gratis",
    ctaCatalog: "Ver apps activas",
    priceSuffix: "/ mes · trial 14 días",
    freeLabel: "Gratis",
    activeLabel: "Apps activas",
    betaLabel: "En beta",
  }
}
