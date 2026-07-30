/**
 * Stripe configuration for US / multinational payments.
 * Keys live in env — never hardcode secrets.
 */

import {
  getPaymentsProviderMode,
  getStripePublishableKey,
  getStripeSecretKey,
  getStripeWebhookSecret,
  isStripeConfigured,
  isStripeMockMode,
} from "@/lib/config/env"
import type { MarketId } from "@/lib/comercial/markets"

export type PaymentProviderId = "stripe" | "mercadopago"

export interface StripeRuntimeConfig {
  secretKey: string
  publishableKey: string
  webhookSecret: string
  configured: boolean
  mock: boolean
  apiBase: string
}

export function getStripeRuntimeConfig(): StripeRuntimeConfig {
  return {
    secretKey: getStripeSecretKey(),
    publishableKey: getStripePublishableKey(),
    webhookSecret: getStripeWebhookSecret(),
    configured: isStripeConfigured(),
    mock: isStripeMockMode(),
    apiBase: "https://api.stripe.com/v1",
  }
}

/**
 * Resolve which payment rail to use for a tenant / market.
 * Priority: PAYMENTS_PROVIDER force → paisFiscal US + Stripe keys → MercadoPago.
 */
export function resolvePaymentProvider(input?: {
  paisFiscal?: string | null
  marketId?: MarketId | null
}): PaymentProviderId {
  const mode = getPaymentsProviderMode()
  if (mode === "stripe") return "stripe"
  if (mode === "mercadopago") return "mercadopago"

  // auto
  if (!isStripeConfigured()) return "mercadopago"

  const pais = (input?.paisFiscal ?? "").toUpperCase()
  if (pais === "US" || pais === "CA" || pais === "GB" || pais === "AU") {
    return "stripe"
  }
  if (input?.marketId === "us") return "stripe"

  return "mercadopago"
}

export function stripeCurrencyForMarket(marketId?: MarketId | null): string {
  switch (marketId) {
    case "us":
      return "usd"
    case "mx":
      return "mxn"
    case "br":
      return "brl"
    case "ar":
    default:
      return "usd" // Stripe rarely used for AR; MP preferred
  }
}

/** Amount in major units → Stripe minor units (cents) */
export function toStripeAmountCents(amount: number, currency = "usd"): number {
  const c = currency.toLowerCase()
  // Zero-decimal currencies (JPY etc.) — we only use USD/MXN/BRL for now (2 decimals)
  if (c === "jpy" || c === "krw") return Math.round(amount)
  return Math.round(Number(amount) * 100)
}
