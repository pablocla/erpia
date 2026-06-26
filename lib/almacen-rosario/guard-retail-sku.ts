import { canUseSku } from "@/lib/platform/entitlements"
import type { RetailExtensionSku } from "./retail-skus"

export async function assertRetailSku(empresaId: number, sku: RetailExtensionSku) {
  const acceso = await canUseSku(empresaId, sku)
  if (!acceso.ok) {
    throw new Error(`SKU ${sku} no activo`)
  }
}