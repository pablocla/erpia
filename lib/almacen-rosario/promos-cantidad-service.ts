/**
 * Promos por cantidad: 2×1, 3×2, llevá N pagá M.
 */
import { getAlmacenRosarioConfig } from "./config"

export interface PromoCantidad {
  id: string
  nombre: string
  tipo: "nxm" | "lleva_paga"
  lleva: number
  paga: number
  productoIds?: number[]
  categoriaIds?: number[]
  activo: boolean
}

export const PROMOS_CANTIDAD_DEFAULT: PromoCantidad[] = [
  { id: "gaseosa-2x1", nombre: "Gaseosa 2×1", tipo: "lleva_paga", lleva: 2, paga: 1, activo: true },
  { id: "cerveza-3x2", nombre: "Cerveza 3×2", tipo: "lleva_paga", lleva: 3, paga: 2, activo: true },
  { id: "alfajor-6x5", nombre: "Alfajores 6×5", tipo: "lleva_paga", lleva: 6, paga: 5, activo: true },
]

export async function listarPromosCantidadActivas(empresaId: number): Promise<PromoCantidad[]> {
  const cfg = await getAlmacenRosarioConfig(empresaId)
  const promos = (cfg as { promosCantidad?: PromoCantidad[] }).promosCantidad ?? PROMOS_CANTIDAD_DEFAULT
  return promos.filter((p) => p.activo)
}

export function aplicarPromoCantidad(
  cantidad: number,
  precioUnitario: number,
  promo: PromoCantidad,
): { cantidadCobrada: number; descuentoPct: number; ahorro: number } {
  if (cantidad < promo.lleva) {
    return { cantidadCobrada: cantidad, descuentoPct: 0, ahorro: 0 }
  }

  const grupos = Math.floor(cantidad / promo.lleva)
  const resto = cantidad % promo.lleva
  const unidadesGratis = grupos * (promo.lleva - promo.paga)
  const cantidadCobrada = cantidad - unidadesGratis
  const totalSinPromo = cantidad * precioUnitario
  const totalConPromo = cantidadCobrada * precioUnitario
  const ahorro = Math.round((totalSinPromo - totalConPromo) * 100) / 100
  const descuentoPct = totalSinPromo > 0 ? Math.round((ahorro / totalSinPromo) * 10000) / 100 : 0

  return { cantidadCobrada, descuentoPct, ahorro }
}