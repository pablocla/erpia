import { canUseSku } from "@/lib/platform/entitlements"

export const SKUS_INMOBILIARIA = [
  "niche.inmo_garantia",
  "niche.inmobiliaria",
  "niche.consorcios",
  "pool-propiedad",
  "intang.cobranzas_wa",
  "core.claver",
] as const

export async function tieneAccesoInmobiliaria(empresaId: number): Promise<boolean> {
  for (const sku of SKUS_INMOBILIARIA) {
    const acceso = await canUseSku(empresaId, sku)
    if (acceso.ok) return true
  }
  return false
}