/**
 * Resuelve ?activar=sku|slug|pack → onboarding, modoLite y pantalla de entrada.
 * Evita que el cliente caiga en el ERP completo después de una landing de sub-SaaS.
 */

import type { ModoLite } from "@/lib/comercial/pack-calle-catalog"
import {
  inferModoLiteFromEnganche,
  landingPathParaModoLite,
  resolvePackCalle,
} from "@/lib/comercial/pack-calle-catalog"
import { getSubSaasApp, SUB_SAAS_APPS } from "@/lib/comercial/sub-saas-catalog"
import { resolveMarketProductIntent } from "@/lib/comercial/market-catalog"
import { resolveRubroSignup } from "@/lib/comercial/rubro-signup"

export interface ActivarIntent {
  engancheId: string
  modoLite: ModoLite
  landingPath: string
  productName: string
  marca: string
  lema?: string
}

function fromSubSaas(sku: string, slug?: string): ActivarIntent | null {
  // Multinational: US marketing slugs (collect, house-tab) resolve to core SKUs
  const marketHit = resolveMarketProductIntent(slug ?? sku)
  if (marketHit) {
    return {
      engancheId: marketHit.sku,
      modoLite: marketHit.modoLite,
      landingPath: marketHit.dashboardPath,
      productName: marketHit.nombre,
      marca: marketHit.marca,
      lema: marketHit.lema,
    }
  }

  const app =
    (slug ? getSubSaasApp(slug) : null) ??
    SUB_SAAS_APPS.find((a) => a.sku === sku || a.skusAdicionales?.includes(sku)) ??
    null
  if (!app) return null
  if (app.sku === "pos.fiado_barrio") {
    return {
      engancheId: app.sku,
      modoLite: app.modoLite,
      landingPath: app.dashboardPath,
      productName: "Libreta de fiados",
      marca: "Claver Fiado",
      lema: "Quién te debe, en pantalla",
    }
  }
  return {
    engancheId: app.sku,
    modoLite: app.modoLite,
    landingPath: app.dashboardPath,
    productName: app.nombre,
    marca: app.marca,
    lema: app.lema,
  }
}

function fromPackCalle(engancheId: string): ActivarIntent | null {
  const pack = resolvePackCalle(engancheId)
  if (!pack) return null
  return {
    engancheId: pack.id,
    modoLite: pack.modoLite,
    landingPath: pack.landingPath,
    productName: pack.nombre,
    marca: pack.nombre,
    lema: pack.lema,
  }
}

function fromSkuFallback(sku: string): ActivarIntent | null {
  const modoLite = inferModoLiteFromEnganche(sku)
  return {
    engancheId: sku,
    modoLite,
    landingPath: landingPathParaModoLite(modoLite),
    productName: sku,
    marca: "Claver",
  }
}

function fromRubroSignup(raw: string): ActivarIntent | null {
  const door = resolveRubroSignup(raw)
  if (!door) return null
  return {
    engancheId: door.engancheId,
    modoLite: door.modoLite,
    landingPath: door.landingPath,
    productName: door.label,
    marca: door.marca,
    lema: door.lema,
  }
}

export function resolveActivarIntent(activar: string | null | undefined): ActivarIntent | null {
  const raw = activar?.trim()
  if (!raw) return null

  const decoded = decodeURIComponent(raw)

  const bySlug = fromSubSaas(decoded, decoded)
  if (bySlug) return bySlug

  const bySku = fromSubSaas(decoded)
  if (bySku) return bySku

  const byPack = fromPackCalle(decoded)
  if (byPack) return byPack

  const byRubro = fromRubroSignup(decoded)
  if (byRubro) return byRubro

  if (decoded.includes(".") || decoded.startsWith("ECOM-") || decoded.startsWith("gen.")) {
    return fromSkuFallback(decoded)
  }

  return null
}

export function activarRegisterHref(activar: string | null | undefined): string {
  if (!activar?.trim()) return "/login/register?trial=14"
  const raw = activar.trim()
  const intent = resolveActivarIntent(raw)
  const ancla =
    intent?.engancheId === "pos.fiado_barrio" ||
    intent?.modoLite === "fiado" ||
    intent?.engancheId === "niche.oficios"
  const params = new URLSearchParams({ activar: raw })
  if (!ancla) params.set("trial", "14")
  return `/login/register?${params.toString()}`
}

/** Copy de trial/registro según oferta comercial */
export function mensajeActivarTrial(activar: string | null | undefined, market: string = "ar"): string {
  const intent = resolveActivarIntent(activar)
  const isUs = market === "us" || activar === "house-tab" || activar === "collect"

  if (!intent) return isUs ? "Start your 14-day free trial" : "Trial 14 días gratis"
  
  if (intent.engancheId === "pos.fiado_barrio" || intent.modoLite === "fiado") {
    return isUs ? "Free house tabs · no card, no trial clock" : "Activás la libreta de fiados. Caja y stock los sumás después."
  }
  if (intent.engancheId === "niche.oficios" || activar === "oficios") {
    return isUs
      ? "Quotes on your phone. No card to start."
      : "Presupuestos en el celu. Sin tarjeta para arrancar. La seña por link se activa cuando cobrás."
  }
  if (intent.modoLite === "pos") {
    return isUs ? "14-day free POS trial" : "POS 14 días de prueba — fiado cuando lo necesités"
  }
  return isUs ? `Try ${intent.marca} — 14 days free` : `Probá ${intent.marca} — 14 días gratis`
}