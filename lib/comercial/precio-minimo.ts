/**
 * Política comercial go-live: ningún cobro recurrente de pago bajo el piso.
 * Excepción: anclas gratis (precio 0), p.ej. pos.fiado_barrio.
 */

/** Piso mínimo ARS/mes para cualquier suscripción de pago */
export const PRECIO_MINIMO_SUSCRIPCION_ARS = 10_000

/** SKUs que pueden quedar en $0 (ancla de captación) */
export const SKUS_ANCLA_GRATIS = new Set<string>([
  "pos.fiado_barrio",
])

/**
 * Normaliza un precio de catálogo/billing.
 * - 0 o negativo → 0 (gratis / no cobrable)
 * - 1..9999 → sube al piso
 * - >= 10000 → se mantiene
 */
export function aplicarPisoPrecioSuscripcion(precioArs: number): number {
  const n = Math.round(Number(precioArs) || 0)
  if (n <= 0) return 0
  return Math.max(n, PRECIO_MINIMO_SUSCRIPCION_ARS)
}

/** true si el SKU puede venderse a $0 */
export function esSkuAnclaGratis(sku: string): boolean {
  return SKUS_ANCLA_GRATIS.has(sku)
}

/**
 * Precio cobrable para un SKU en checkout.
 * Anclas gratis devuelven 0; el resto de pago nunca baja del piso.
 */
export function precioCobrableSku(sku: string, precioCatalogo: number): number {
  if (esSkuAnclaGratis(sku)) return 0
  return aplicarPisoPrecioSuscripcion(precioCatalogo)
}

export function assertPrecioSuscripcionValido(precioArs: number): {
  ok: boolean
  precio: number
  error?: string
} {
  const precio = aplicarPisoPrecioSuscripcion(precioArs)
  if (precio <= 0) {
    return {
      ok: false,
      precio: 0,
      error: "El plan base es gratuito. Elegí un módulo de pago desde el panel.",
    }
  }
  return { ok: true, precio }
}
