import { describe, it, expect } from "vitest"
import { DEFAULT_FEE_PCT, COBRANZA_AAS_SKU } from "@/lib/cobranza/as-a-service"
import { HARDWARE_BUNDLE_SKU, HARDWARE_BUNDLE_PRICE_ARS } from "@/lib/comercial/hardware-bundle"

describe("cobranza-aas constants", () => {
  it("fee default 5%", () => {
    expect(DEFAULT_FEE_PCT).toBe(5)
    expect(COBRANZA_AAS_SKU).toBe("svc.cobranza_as_a_service")
  })
})

describe("hardware bundle constants", () => {
  it("sku y precio de referencia", () => {
    expect(HARDWARE_BUNDLE_SKU).toBe("pack.hardware_pos")
    expect(HARDWARE_BUNDLE_PRICE_ARS).toBe(89000)
  })
})

describe("fee math", () => {
  it("5% de 100000 = 5000", () => {
    const fee = Math.round(100_000 * (DEFAULT_FEE_PCT / 100) * 100) / 100
    expect(fee).toBe(5000)
  })
})
