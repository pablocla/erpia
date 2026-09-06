/**
 * Stripe REST client (no SDK required) — Checkout Sessions + Payment Links for debtors / SaaS.
 * Requires STRIPE_SECRET_KEY in env. Mock mode when key missing.
 */

import { getSiteUrl } from "@/lib/marketing/landing-seo"
import {
  getStripeRuntimeConfig,
  stripeCurrencyForMarket,
  toStripeAmountCents,
  type PaymentProviderId,
} from "@/lib/stripe/stripe-config"
import type { MarketId } from "@/lib/comercial/markets"
import { isProductionRuntime } from "@/lib/config/env"

export interface StripeCheckoutInput {
  empresaId: number
  /** Major units (e.g. 39.00 USD) */
  amount: number
  currency?: string
  title: string
  customerEmail?: string | null
  /** Stable ref for webhook: cxc-123 | fiado-… | claver-empresa-… */
  externalReference: string
  successUrl?: string
  cancelUrl?: string
  metadata?: Record<string, string>
  marketId?: MarketId
  /** subscription | payment (default payment) */
  mode?: "payment" | "subscription"
  /** Stripe Price id for subscription mode */
  priceId?: string
  quantity?: number
}

export interface StripeCheckoutResult {
  id: string
  url: string
  mock?: boolean
  provider: PaymentProviderId
}

function formBody(params: Record<string, string | number | undefined | null>): string {
  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue
    body.append(k, String(v))
  }
  return body.toString()
}

async function stripePost(
  path: string,
  params: Record<string, string | number | undefined | null>,
): Promise<Record<string, unknown>> {
  const cfg = getStripeRuntimeConfig()
  if (!cfg.secretKey) {
    throw new Error("STRIPE_SECRET_KEY no configurada")
  }

  const res = await fetch(`${cfg.apiBase}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody(params),
  })

  const data = (await res.json()) as Record<string, unknown>
  if (!res.ok) {
    const err = data.error as { message?: string } | undefined
    throw new Error(err?.message ?? `Stripe error ${res.status}`)
  }
  return data
}

/**
 * One-shot Checkout Session (debtor payment link) or subscription checkout.
 */
export async function createStripeCheckoutSession(
  input: StripeCheckoutInput,
): Promise<StripeCheckoutResult> {
  const cfg = getStripeRuntimeConfig()
  const site = getSiteUrl()
  const currency = (input.currency ?? stripeCurrencyForMarket(input.marketId)).toLowerCase()
  const success =
    input.successUrl ??
    `${site}/dashboard/cuentas-cobrar?stripe=ok&ref=${encodeURIComponent(input.externalReference)}`
  const cancel =
    input.cancelUrl ??
    `${site}/dashboard/cuentas-cobrar?stripe=cancel&ref=${encodeURIComponent(input.externalReference)}`

  if (cfg.mock) {
    if (isProductionRuntime()) {
      throw new Error(
        "Stripe no está configurado en producción (STRIPE_SECRET_KEY). " +
          "Agregá la key en .env / Vercel Environment Variables.",
      )
    }
    const mockId = `cs_test_mock_${Date.now()}`
    return {
      id: mockId,
      url: `${site}/dashboard/apps?stripe_mock=1&ref=${encodeURIComponent(input.externalReference)}`,
      mock: true,
      provider: "stripe",
    }
  }

  const meta: Record<string, string> = {
    empresaId: String(input.empresaId),
    external_reference: input.externalReference,
    ...input.metadata,
  }

  const mode = input.mode ?? "payment"
  const params: Record<string, string | number | undefined | null> = {
    mode,
    success_url: success.includes("{CHECKOUT_SESSION_ID}")
      ? success
      : `${success}${success.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancel,
    client_reference_id: input.externalReference.slice(0, 200),
    "metadata[empresaId]": meta.empresaId,
    "metadata[external_reference]": meta.external_reference,
  }

  if (input.customerEmail) {
    params.customer_email = input.customerEmail
  }

  // Pass through extra metadata keys
  for (const [k, v] of Object.entries(input.metadata ?? {})) {
    if (k === "empresaId" || k === "external_reference") continue
    params[`metadata[${k}]`] = v
  }

  if (mode === "subscription" && input.priceId) {
    params["line_items[0][price]"] = input.priceId
    params["line_items[0][quantity]"] = input.quantity ?? 1
  } else {
    const cents = toStripeAmountCents(input.amount, currency)
    if (cents <= 0) throw new Error("Monto Stripe inválido")
    params["line_items[0][price_data][currency]"] = currency
    params["line_items[0][price_data][unit_amount]"] = cents
    params["line_items[0][price_data][product_data][name]"] = input.title.slice(0, 120)
    params["line_items[0][quantity]"] = 1
  }

  const data = await stripePost("/checkout/sessions", params)
  const url = typeof data.url === "string" ? data.url : ""
  const id = typeof data.id === "string" ? data.id : ""
  if (!url || !id) throw new Error("Stripe Checkout sin url")

  return { id, url, provider: "stripe" }
}

/**
 * Create a reusable Payment Link (Dashboard-style) for a fixed amount.
 */
export async function createStripePaymentLink(input: {
  amount: number
  currency?: string
  title: string
  externalReference: string
  empresaId: number
  marketId?: MarketId
}): Promise<StripeCheckoutResult> {
  const cfg = getStripeRuntimeConfig()
  const currency = (input.currency ?? stripeCurrencyForMarket(input.marketId)).toLowerCase()
  const site = getSiteUrl()

  if (cfg.mock) {
    return createStripeCheckoutSession({
      empresaId: input.empresaId,
      amount: input.amount,
      currency,
      title: input.title,
      externalReference: input.externalReference,
      marketId: input.marketId,
    })
  }

  // 1) Product
  const product = await stripePost("/products", {
    name: input.title.slice(0, 120),
    "metadata[external_reference]": input.externalReference,
    "metadata[empresaId]": String(input.empresaId),
  })
  const productId = String(product.id)

  // 2) Price
  const cents = toStripeAmountCents(input.amount, currency)
  const price = await stripePost("/prices", {
    product: productId,
    unit_amount: cents,
    currency,
  })
  const priceId = String(price.id)

  // 3) Payment Link
  const link = await stripePost("/payment_links", {
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": 1,
    "metadata[external_reference]": input.externalReference,
    "metadata[empresaId]": String(input.empresaId),
    after_completion_type: "redirect",
    "after_completion[redirect][url]": `${site}/dashboard/cuentas-cobrar?stripe=ok`,
  })

  return {
    id: String(link.id),
    url: String(link.url ?? ""),
    provider: "stripe",
  }
}

export function isStripeReady(): boolean {
  return getStripeRuntimeConfig().configured
}
