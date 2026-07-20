/**
 * Política de checkout marketplace — no activar SKUs sin pago confirmado en prod.
 * Oleada 0: production nunca marca "paid" instantáneo salvo FORCE_MOCK_MP_PROD.
 */

export function allowsInstantMarketplaceCheckout(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false
  }
  if (process.env.MARKETPLACE_CHECKOUT_MOCK === "false") return false
  return true // default true in dev
}

export function initialMarketplaceOrdenEstado(): "paid" | "pending_payment" {
  return allowsInstantMarketplaceCheckout() ? "paid" : "pending_payment"
}