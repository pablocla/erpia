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

export interface ActivarIntent {
  engancheId: string
  modoLite: ModoLite
  landingPath: string
  productName: string
  marca: string
  lema?: string
}

function fromSubSaas(sku: string, slug?: string): ActivarIntent | null {
  const app =
    (slug ? getSubSaasApp(slug) : null) ??
    SUB_SAAS_APPS.find((a) => a.sku === sku || a.skusAdicionales?.includes(sku)) ??
    null
  if (!app) return null
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

  if (decoded.includes(".") || decoded.startsWith("ECOM-") || decoded.startsWith("gen.")) {
    return fromSkuFallback(decoded)
  }

  return null
}

export function activarRegisterHref(activar: string | null | undefined): string {
  if (!activar?.trim()) return "/login/register?trial=14"
  return `/login/register?activar=${encodeURIComponent(activar.trim())}&trial=14`
}

/** Copy de trial/registro según oferta comercial */
export function mensajeActivarTrial(activar: string | null | undefined): string {
  const intent = resolveActivarIntent(activar)
  if (!intent) return "Trial 14 días gratis"
  if (intent.engancheId === "pos.fiado_barrio" || intent.modoLite === "fiado") {
    return "Libreta gratis + POS 14 días de prueba"
  }
  if (intent.modoLite === "pos") {
    return "POS 14 días de prueba — fiado cuando lo necesités"
  }
  return `Probá ${intent.marca} — 14 días gratis`
}