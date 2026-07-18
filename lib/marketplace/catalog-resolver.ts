import { MARKETPLACE_CATALOG } from "./marketplace-catalog"
import { AUTOPOOL_ENTRIES } from "./autopool-manifest"
import type { AutoCertLevel } from "./marketplace-catalog"
import { effectiveSkuStatus, isSkuProvisionable } from "./sku-availability"
import { precioCobrableSku } from "@/lib/comercial/precio-minimo"

export interface ResolvedSku {
  sku: string
  nombre: string
  autoCertLevel: AutoCertLevel
  playbookId?: string
  precioArs: number
  tipoCobro: string
  integracionId?: string
  status: "disponible" | "beta" | "planned"
  provisionable: boolean
}

export function resolveSku(sku: string): ResolvedSku | null {
  const catalog = MARKETPLACE_CATALOG.find((c) => c.sku === sku)
  if (catalog) {
    const status = effectiveSkuStatus(catalog.sku, catalog.status)
    return {
      sku: catalog.sku,
      nombre: catalog.nombre,
      autoCertLevel: catalog.autoCertLevel,
      playbookId: catalog.playbookId,
      precioArs: precioCobrableSku(catalog.sku, catalog.precioArs),
      tipoCobro: catalog.tipoCobro,
      status,
      provisionable: isSkuProvisionable(catalog.sku),
    }
  }

  const pool = AUTOPOOL_ENTRIES.find((e) => e.sku === sku)
  if (pool) {
    const status = effectiveSkuStatus(pool.sku, "disponible")
    return {
      sku: pool.sku,
      nombre: pool.nombre,
      autoCertLevel: pool.autoCertLevel as AutoCertLevel,
      playbookId: pool.playbookId,
      precioArs: precioCobrableSku(pool.sku, pool.precioDesdeArs),
      tipoCobro: pool.tipoCobro,
      integracionId: pool.integracionId,
      status,
      provisionable: isSkuProvisionable(pool.sku),
    }
  }

  return null
}