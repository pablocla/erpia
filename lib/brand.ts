import { CLAVER_GROUP, CLAVERP_PRODUCT, CLAVERGROW_PRODUCT } from "@/lib/marketing/brand-system"

export { CLAVER_GROUP, CLAVERP_PRODUCT, CLAVERGROW_PRODUCT, BRAND_RECOMMENDED } from "@/lib/marketing/brand-system"

/** Producto ERP del grupo Claver */
export const BRAND_NAME = CLAVERP_PRODUCT.name

/** Evita lockups redundantes cuando producto y grupo comparten nombre */
export function brandByLine(
  productName: string,
  groupName: string = CLAVER_GROUP.name,
): string | null {
  if (productName.trim().toLowerCase() === groupName.trim().toLowerCase()) return null
  return `by ${groupName}`
}

/** Lockup comercial: "Claver" o "Clavergrow by Claver" */
export function brandLockup(
  productName: string,
  groupName: string = CLAVER_GROUP.name,
): string {
  const by = brandByLine(productName, groupName)
  return by ? `${productName} ${by}` : productName
}

export const BRAND_FULL = brandLockup(CLAVERP_PRODUCT.name)
export const CLAVERGROW_FULL = brandLockup(CLAVERGROW_PRODUCT.name)

/** Remitente por defecto en emails transaccionales */
export const BRAND_EMAIL_FROM = BRAND_FULL

/** Pie de firma en emails */
export const BRAND_EMAIL_FOOTER = `${BRAND_FULL} — Notificación automática`

/** Nombres legacy que se tratan como branding de plataforma (no personalización empresa) */
export const LEGACY_PLATFORM_APP_NAMES = ["ERP Argentina", "NegocioOS", "NexoOS"] as const

export function isCustomAppName(appName: string | null | undefined): boolean {
  if (!appName?.trim()) return false
  const trimmed = appName.trim()
  if (trimmed === CLAVERP_PRODUCT.name) return false
  if (trimmed === CLAVERGROW_PRODUCT.name) return false
  return !LEGACY_PLATFORM_APP_NAMES.includes(trimmed as (typeof LEGACY_PLATFORM_APP_NAMES)[number])
}

export function resolveSidebarBranding(appName: string | null | undefined) {
  const custom = isCustomAppName(appName)
  return {
    title: custom ? appName!.trim() : CLAVERP_PRODUCT.name,
    subtitle: custom
      ? BRAND_FULL
      : brandByLine(CLAVERP_PRODUCT.name) ?? CLAVERP_PRODUCT.tagline,
    showLiveIndicator: !custom,
  }
}

/** Rubros que usan línea Clavergrow en el dashboard */
export const AGRO_RUBROS = ["agro_acopio", "agro_cannabis"] as const

export type AgroRubro = (typeof AGRO_RUBROS)[number]

export function isAgroRubro(rubro: string | null | undefined): rubro is AgroRubro {
  if (!rubro) return false
  return (AGRO_RUBROS as readonly string[]).includes(rubro)
}

/** Branding del sidebar para tenants agro (Clavergrow) */
export function resolveAgroBranding(appName: string | null | undefined) {
  const custom = isCustomAppName(appName)
  return {
    title: custom ? appName!.trim() : CLAVERGROW_PRODUCT.name,
    subtitle: custom ? CLAVERGROW_FULL : (brandByLine(CLAVERGROW_PRODUCT.name) ?? CLAVERGROW_PRODUCT.tagline),
    tagline: CLAVERGROW_PRODUCT.tagline,
    showLiveIndicator: !custom,
  }
}

export type DashboardBranding = {
  title: string
  subtitle: string
  showLiveIndicator: boolean
  productLine: "clavis" | "clavergrow"
  liveLabel: string
}

/** Branding del sidebar según rubro del tenant */
export function resolveDashboardBranding(
  appName: string | null | undefined,
  rubro: string | null | undefined,
): DashboardBranding {
  const agro = isAgroRubro(rubro)
  const base = agro ? resolveAgroBranding(appName) : resolveSidebarBranding(appName)
  return {
    title: base.title,
    subtitle: base.subtitle,
    showLiveIndicator: base.showLiveIndicator,
    productLine: agro ? "clavergrow" : "clavis",
    liveLabel: agro ? CLAVERGROW_PRODUCT.tagline : "Operación en tiempo real",
  }
}

/** Rutas estáticas del kit de marca */
export const BRAND_ASSETS = {
  claverIcon: "/brand/claver-icon.svg",
  claverpIcon: "/brand/claverp-icon.svg",
  claverpLockup: "/brand/claverp-lockup.svg",
  clavergrowIcon: "/brand/clavergrow-icon.svg",
  favicon: "/icon.svg",
  ogClaver: "/claver/opengraph-image",
  ogClavERP: "/claver/claverp/opengraph-image",
  ogClavergrow: "/claver/clavergrow/opengraph-image",
} as const

/** Cuenta pública de testing / demos del ERP (no es analista Cloud) */
export const DEMO_ADMIN_EMAIL = "testing@claver.com.ar"
export const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || "admin1234"

/** Admin real de plataforma Claver (Cloud, torre, CEO) */
export const CLAVER_OWNER_EMAIL = "pabloclavero03@gmail.com"