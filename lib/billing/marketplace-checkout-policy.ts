/**
 * Política de checkout marketplace — no activar SKUs sin pago confirmado en prod.
 */

export function allowsInstantMarketplaceCheckout(): boolean {
  if (process.env.NODE_ENV === "production") {
    return process.env.FORCE_MOCK_MP_PROD === "true"
  }
  if (process.env.MARKETPLACE_CHECKOUT_MOCK === "false") return false
  return true // default true in dev
}

export function initialMarketplaceOrdenEstado(): "paid" | "pending_payment" {
  return allowsInstantMarketplaceCheckout() ? "paid" : "pending_payment"
}