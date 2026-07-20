import { describe, expect, it, afterEach } from "vitest"
import {
  allowsInstantMarketplaceCheckout,
  initialMarketplaceOrdenEstado,
} from "@/lib/billing/marketplace-checkout-policy"

const env = process.env

afterEach(() => {
  process.env = { ...env }
})

describe("marketplace-checkout-policy", () => {
  it("prod sin mock → pending_payment", () => {
    process.env.NODE_ENV = "production"
    delete process.env.MARKETPLACE_CHECKOUT_MOCK
    expect(allowsInstantMarketplaceCheckout()).toBe(false)
    expect(initialMarketplaceOrdenEstado()).toBe("pending_payment")
  })

  it("MARKETPLACE_CHECKOUT_MOCK=true → paid", () => {
    process.env.NODE_ENV = "test"
    process.env.MARKETPLACE_CHECKOUT_MOCK = "true"
    expect(allowsInstantMarketplaceCheckout()).toBe(true)
    expect(initialMarketplaceOrdenEstado()).toBe("paid")
  })
})