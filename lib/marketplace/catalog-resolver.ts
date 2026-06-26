import { MARKETPLACE_CATALOG } from "./marketplace-catalog"
import { AUTOPOOL_ENTRIES } from "./autopool-manifest"
import type { AutoCertLevel } from "./marketplace-catalog"

export interface ResolvedSku {
  sku: string
  nombre: string
  autoCertLevel: AutoCertLevel
  playbookId?: string
  precioArs: number
  tipoCobro: string
  integracionId?: string
}

export function resolveSku(sku: string): ResolvedSku | null {
  const catalog = MARKETPLACE_CATALOG.find((c) => c.sku === sku)
  if (catalog) {
    return {
      sku: catalog.sku,
      nombre: catalog.nombre,
      autoCertLevel: catalog.autoCertLevel,
      playbookId: catalog.playbookId,
      precioArs: catalog.precioArs,
      tipoCobro: catalog.tipoCobro,
    }
  }

  const pool = AUTOPOOL_ENTRIES.find((e) => e.sku === sku)
  if (pool) {
    return {
      sku: pool.sku,
      nombre: pool.nombre,
      autoCertLevel: pool.autoCertLevel as AutoCertLevel,
      playbookId: pool.playbookId,
      precioArs: pool.precioDesdeArs,
      tipoCobro: pool.tipoCobro,
      integracionId: pool.integracionId,
    }
  }

  return null
}