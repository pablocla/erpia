import { canUseSku } from "@/lib/platform/entitlements"

export const SKUS_INMOBILIARIA = [
  "niche.inmo_garantia",
  "niche.consorcios",
  "intang.cobranzas_wa",
] as const

export async function tieneAccesoInmobiliaria(empresaId: number): Promise<boolean> {
  for (const sku of SKUS_INMOBILIARIA) {
    const acceso = await canUseSku(empresaId, sku)
    if (acceso.ok) return true
  }
  return false
}