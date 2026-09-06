/**
 * Política de checkout marketplace — no activar SKUs sin pago confirmado en prod.
 * Production nunca marca "paid" instantáneo ni acepta overrides mock.
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