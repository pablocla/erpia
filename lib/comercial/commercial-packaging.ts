/**
 * Empaquetado comercial unificado — vitrine, home y catálogo.
 * Fuente de verdad para entrada, packs, plataformas y contadores de catálogo.
 */

import { PACKS_CALLE } from "@/lib/comercial/pack-calle-catalog"
import { subSaasHrefBySku } from "@/lib/comercial/sub-saas-catalog"
import {
  CLAVER_SERVICE_LINES,
  type ClaverServiceLine,
} from "@/lib/marketing/claver-services-catalog"
import { AUTOPOOL_ENTRIES } from "@/lib/marketplace/autopool-manifest"
import { MARKETPLACE_BUNDLES, type MarketplaceBundle } from "@/lib/marketplace/bundles"
import { getEngancheBySku } from "@/lib/marketplace/enganche-catalog"
import { GENERATIVE_CATALOG } from "@/lib/marketplace/generative-catalog"
import { MARKETPLACE_CATALOG } from "@/lib/marketplace/marketplace-catalog"
import { isSkuProvisionable } from "@/lib/marketplace/sku-availability"
import { NICHE_APPS } from "@/lib/niche/niche-apps-catalog"
import {
  IA_SAAS_TOP_20,
  IA_SAAS_TIER_PACKS,
  iaSaasDestacados,
  resumenComercialTop20,
  type IaSaasPack,
  type IaSaasTierPack,
} from "@/lib/comercial/ia-saas-top20"

export type LineaTier = "plataforma" | "servicio" | "proximamente"

export interface ProductoEntrada {
  sku: string
  nombre: string
  lema: string
  precioArs: number
  href: string
  disponible: boolean
  trialDias: number
}

export interface PackComercial {
  id: string
  nombre: string
  lema: string
  precioArs: number
  cantidadSkus: number
  href: string
  tipoCobro: MarketplaceBundle["tipoCobro"]
  ahorroPct: number
}

export interface CatalogoResumen {
  automatizaciones: number
  serviciosIa: number
  iaSaasTop20: number
  appsNicho: number
  modulosErp: number
  packs: number
  skusMarketplace: number
  productosCalle: number
}

const ENTRADA_SKUS = ["pos.fiado_barrio", "intang.cobranzas_wa"] as const

const PACKS_HOME_IDS = [
  "pool-almacen-barrio",
  "pool-almacen-rosario",
  "pool-claver-nicho",
  "pool-deportes-barrio",
  "pool-propiedad",
  "pool-monotributo",
  "pool-servicios-pro",
  "pool-obra",
  "pool-kiosco-barrio",
] as const

const PLATAFORMA_IDS = ["claverp", "clavergrow", "clavercloud"] as const

export function activarSkuHref(sku: string): string {
  return `/login?activar=${encodeURIComponent(sku)}`
}

export function activarPackHref(packId: string): string {
  return `/login?activar=${encodeURIComponent(packId)}`
}

export const CATALOGO_RESUMEN: CatalogoResumen = {
  automatizaciones: AUTOPOOL_ENTRIES.length,
  serviciosIa: GENERATIVE_CATALOG.length,
  iaSaasTop20: IA_SAAS_TOP_20.length,
  appsNicho: NICHE_APPS.length,
  modulosErp: 40,
  packs: MARKETPLACE_BUNDLES.length,
  skusMarketplace: MARKETPLACE_CATALOG.length,
  productosCalle: PACKS_CALLE.filter((p) => p.vendibleHoy).length,
}

export function totalSolucionesPublicadas(): number {
  return (
    CATALOGO_RESUMEN.automatizaciones +
    CATALOGO_RESUMEN.serviciosIa +
    CATALOGO_RESUMEN.iaSaasTop20 +
    CATALOGO_RESUMEN.appsNicho +
    CATALOGO_RESUMEN.packs +
    CATALOGO_RESUMEN.modulosErp
  )
}

export {
  IA_SAAS_TOP_20,
  IA_SAAS_TIER_PACKS,
  iaSaasDestacados,
  resumenComercialTop20,
  type IaSaasPack,
  type IaSaasTierPack,
}

export const PRODUCTOS_ENTRADA: ProductoEntrada[] = ENTRADA_SKUS.map((sku) => {
  const e = getEngancheBySku(sku)
  if (!e) {
    return {
      sku,
      nombre: sku,
      lema: "",
      precioArs: 0,
      href: activarSkuHref(sku),
      disponible: isSkuProvisionable(sku),
      trialDias: 14,
    }
  }
  const landing = subSaasHrefBySku(sku)
  return {
    sku,
    nombre: e.nombre,
    lema: e.lema,
    precioArs: e.precioArs,
    href: landing ?? activarSkuHref(sku),
    disponible: isSkuProvisionable(sku),
    trialDias: 14,
  }
})

export const PACKS_DESTACADOS: PackComercial[] = PACKS_HOME_IDS.map((id) => {
  const b = MARKETPLACE_BUNDLES.find((x) => x.id === id)
  if (!b) return null
  return {
    id: b.id,
    nombre: b.nombre,
    lema: b.lema,
    precioArs: b.precioPackArs,
    cantidadSkus: b.skus.length,
    href: activarPackHref(b.id),
    tipoCobro: b.tipoCobro,
    ahorroPct: b.ahorroPct,
  }
}).filter(Boolean) as PackComercial[]

export const PLATAFORMAS_PRINCIPALES: ClaverServiceLine[] = PLATAFORMA_IDS.map(
  (id) => CLAVER_SERVICE_LINES.find((l) => l.id === id)!,
).filter(Boolean)

export function lineaTier(line: ClaverServiceLine): LineaTier {
  if (line.status === "proximamente") return "proximamente"
  if (PLATAFORMA_IDS.includes(line.id as (typeof PLATAFORMA_IDS)[number])) return "plataforma"
  return "servicio"
}

export function hrefPublicoLinea(line: ClaverServiceLine): string | undefined {
  if (line.href && !line.href.startsWith("/dashboard")) return line.href
  if (line.status === "proximamente") return undefined
  return "/claver/contacto"
}

export function lineasPorTier(): Record<LineaTier, ClaverServiceLine[]> {
  const out: Record<LineaTier, ClaverServiceLine[]> = {
    plataforma: [],
    servicio: [],
    proximamente: [],
  }
  for (const line of CLAVER_SERVICE_LINES) {
    out[lineaTier(line)].push(line)
  }
  return out
}

export const fmtPrecioArs = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n)