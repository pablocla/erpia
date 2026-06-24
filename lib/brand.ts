import { CLAVER_GROUP, CLAVERP_PRODUCT } from "@/lib/marketing/brand-system"

export { CLAVER_GROUP, CLAVERP_PRODUCT, BRAND_RECOMMENDED } from "@/lib/marketing/brand-system"

/** Producto ERP del grupo Claver */
export const BRAND_NAME = CLAVERP_PRODUCT.name

/** Lockup comercial: ClavERP by Claver */
export const BRAND_FULL = `${CLAVERP_PRODUCT.name} by ${CLAVER_GROUP.name}`

/** Remitente por defecto en emails transaccionales */
export const BRAND_EMAIL_FROM = BRAND_FULL

/** Pie de firma en emails */
export const BRAND_EMAIL_FOOTER = `${BRAND_FULL} — Notificación automática · ${CLAVER_GROUP.name}`

/** Nombres legacy que se tratan como branding de plataforma (no personalización empresa) */
export const LEGACY_PLATFORM_APP_NAMES = ["ERP Argentina", "NegocioOS", "NexoOS"] as const

export function isCustomAppName(appName: string | null | undefined): boolean {
  if (!appName?.trim()) return false
  const trimmed = appName.trim()
  if (trimmed === CLAVERP_PRODUCT.name) return false
  return !LEGACY_PLATFORM_APP_NAMES.includes(trimmed as (typeof LEGACY_PLATFORM_APP_NAMES)[number])
}

export function resolveSidebarBranding(appName: string | null | undefined) {
  const custom = isCustomAppName(appName)
  return {
    title: custom ? appName!.trim() : CLAVERP_PRODUCT.name,
    subtitle: custom
      ? BRAND_FULL
      : `by ${CLAVER_GROUP.name}`,
    showLiveIndicator: !custom,
  }
}

/** Rutas estáticas del kit de marca */
export const BRAND_ASSETS = {
  claverIcon: "/brand/claver-icon.svg",
  claverpIcon: "/brand/claverp-icon.svg",
  claverpLockup: "/brand/claverp-lockup.svg",
  favicon: "/icon.svg",
  ogClaver: "/claver/opengraph-image",
  ogClavERP: "/claver/claverp/opengraph-image",
} as const

export const DEMO_ADMIN_EMAIL = "admin@erp-argentina.com"
export const DEMO_ADMIN_PASSWORD = "admin1234"