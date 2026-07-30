import { afterEach, describe, expect, it, vi } from "vitest"
import {
  getStripeSecretKey,
  getStripePublishableKey,
  getStripeWebhookSecret,
  isStripeConfigured,
  isStripeMockMode,
  getPaymentsProviderMode,
} from "@/lib/config/env"
import {
  resolvePaymentProvider,
  toStripeAmountCents,
  stripeCurrencyForMarket,
} from "@/lib/stripe/stripe-config"
import { verifyStripeSignature } from "@/lib/stripe/stripe-webhook"
import { createHmac } from "crypto"

describe("stripe env helpers", () => {
  const prev = { ...process.env }

  afterEach(() => {
    process.env = { ...prev }
    vi.unstubAllEnvs()
  })

  it("reads STRIPE_* keys and mock when empty", () => {
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.STRIPE_API_KEY
    expect(getStripeSecretKey()).toBe("")
    expect(isStripeMockMode()).toBe(true)
    expect(isStripeConfigured()).toBe(false)
  })

  it("detects configured secret key", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_abc123"
    expect(getStripeSecretKey()).toBe("sk_test_abc123")
    expect(isStripeConfigured()).toBe(true)
    expect(isStripeMockMode()).toBe(false)
  })

  it("reads publishable + webhook secrets", () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_x"
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_y"
    expect(getStripePublishableKey()).toBe("pk_test_x")
    expect(getStripeWebhookSecret()).toBe("whsec_y")
  })

  it("parses PAYMENTS_PROVIDER", () => {
    process.env.PAYMENTS_PROVIDER = "stripe"
    expect(getPaymentsProviderMode()).toBe("stripe")
    process.env.PAYMENTS_PROVIDER = "mercadopago"
    expect(getPaymentsProviderMode()).toBe("mercadopago")
    delete process.env.PAYMENTS_PROVIDER
    expect(getPaymentsProviderMode()).toBe("auto")
  })
})

describe("resolvePaymentProvider", () => {
  const prev = { ...process.env }

  afterEach(() => {
    process.env = { ...prev }
  })

  it("forces stripe / mercadopago", () => {
    process.env.PAYMENTS_PROVIDER = "stripe"
    process.env.STRIPE_SECRET_KEY = "sk_test_1"
    expect(resolvePaymentProvider({ paisFiscal: "AR" })).toBe("stripe")

    process.env.PAYMENTS_PROVIDER = "mercadopago"
    expect(resolvePaymentProvider({ paisFiscal: "US" })).toBe("mercadopago")
  })

  it("auto uses stripe for US when configured", () => {
    process.env.PAYMENTS_PROVIDER = "auto"
    process.env.STRIPE_SECRET_KEY = "sk_test_1"
    expect(resolvePaymentProvider({ paisFiscal: "US" })).toBe("stripe")
    expect(resolvePaymentProvider({ marketId: "us" })).toBe("stripe")
    expect(resolvePaymentProvider({ paisFiscal: "AR" })).toBe("mercadopago")
  })

  it("auto falls back to MP without stripe keys", () => {
    process.env.PAYMENTS_PROVIDER = "auto"
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.STRIPE_API_KEY
    expect(resolvePaymentProvider({ paisFiscal: "US" })).toBe("mercadopago")
  })
})

describe("stripe amounts + signature", () => {
  it("converts USD to cents", () => {
    expect(toStripeAmountCents(39, "usd")).toBe(3900)
    expect(toStripeAmountCents(10.5, "usd")).toBe(1050)
    expect(stripeCurrencyForMarket("us")).toBe("usd")
  })

  it("verifies Stripe-Signature v1", () => {
    const secret = "whsec_test_secret"
    const body = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" })
    const t = Math.floor(Date.now() / 1000)
    const v1 = createHmac("sha256", secret).update(`${t}.${body}`, "utf8").digest("hex")
    const header = `t=${t},v1=${v1}`
    expect(verifyStripeSignature(body, header, secret)).toBe(true)
    expect(verifyStripeSignature(body, "t=1,v1=bad", secret)).toBe(false)
  })
})
