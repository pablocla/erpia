import { afterEach, describe, expect, it } from "vitest"
import { createMercadoPagoSubscription } from "@/lib/billing/mercadopago-subscription"
import { confirmMockSubscription } from "@/lib/billing/billing-checkout-service"
import { createStripeCheckoutSession } from "@/lib/stripe/stripe-service"
import { hasProductionMockFlags } from "@/lib/config/env"

const previousEnv = { ...process.env }

afterEach(() => {
  process.env = { ...previousEnv }
})

describe("production reality gate", () => {
  it("rejects MP mock subscriptions even when the legacy override flag is set", async () => {
    process.env.NODE_ENV = "production"
    process.env.FORCE_MOCK_MP_PROD = "true"
    delete process.env.MP_ACCESS_TOKEN
    expect(hasProductionMockFlags()).toBe(true)
    await expect(createMercadoPagoSubscription({
      empresaId: 1,
      planName: "Claver",
      priceArs: 10000,
      payerEmail: "test@example.com",
    })).rejects.toThrow(/No se puede simular cobro/)
  })

  it("rejects direct mock confirmation in production", async () => {
    process.env.NODE_ENV = "production"
    await expect(confirmMockSubscription({ empresaId: 1 })).rejects.toThrow(/deshabilitada en producción/)
  })

  it("rejects Stripe mock checkout in production even with the override flag", async () => {
    process.env.NODE_ENV = "production"
    process.env.FORCE_MOCK_STRIPE_PROD = "true"
    delete process.env.STRIPE_SECRET_KEY
    await expect(createStripeCheckoutSession({
      empresaId: 1,
      amount: 10,
      title: "Test",
      externalReference: "test-1",
    })).rejects.toThrow(/no está configurado en producción/)
  })
})
