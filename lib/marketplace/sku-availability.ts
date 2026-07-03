/**
 * SKUs en vitrina pero sin producto implementado — auditoría F0-3.
 * Bloquea provisioning y marca "Próximamente" en marketplace.
 */

export type SkuCatalogStatus = "disponible" | "beta" | "planned"

/** Catálogo vendible hoy; el resto = planned hasta implementar hook/UI real */
export const SKUS_PLANNED_ONLY = new Set([
  // Falsos Parciales (sin motor end-to-end)
  "data.reportes_prog",
  "fiscal.ocr",
  "sec.backup",
  "sec.mfa",
  "bridge.opo_studio",
  // Catálogo (Planned)
  "intang.reactivador_clientes",
  "intang.reputation_firewall",
  "intang.legal_shield",
  "intang.subs_tax_scanner",
  "data.nps",
  "mkt.pixel",
  "mkt.pixel_ads",
  "releva.formulario_web",
])

export function isSkuProvisionable(sku: string): boolean {
  return !SKUS_PLANNED_ONLY.has(sku)
}

export function effectiveSkuStatus(sku: string, status: SkuCatalogStatus): SkuCatalogStatus {
  if (SKUS_PLANNED_ONLY.has(sku)) return "planned"
  return status
}

export function assertSkuProvisionable(sku: string): void {
  if (!isSkuProvisionable(sku)) {
    throw new Error(
      `El SKU ${sku} está en catálogo como "Próximamente" y aún no puede activarse. Elegí otro producto o contactá a Claver.`,
    )
  }
}

export function isPathAllowedInSidebarAllowlist(href: string, allowed: string[]): boolean {
  return allowed.some((path) =>
    path === "/dashboard" ? href === "/dashboard" : href === path || href.startsWith(`${path}/`),
  )
}