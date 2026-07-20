import { describe, expect, it } from "vitest"
import {
  GO_LIVE_PACKS_PRD,
  resolveGoLiveTier,
  isEnganchePrd,
} from "@/lib/comercial/go-live-packs"
import { allowsInstantMarketplaceCheckout } from "@/lib/billing/marketplace-checkout-policy"

describe("go-live-packs", () => {
  it("tiene packs PRD definidos", () => {
    expect(GO_LIVE_PACKS_PRD.length).toBeGreaterThanOrEqual(5)
  })

  it("fiado / almacen son PRD", () => {
    expect(resolveGoLiveTier({ industryId: "almacen" })).toBe("prd")
    expect(isEnganchePrd("pos.fiado_barrio")).toBe(true)
  })

  it("taller es piloto", () => {
    expect(resolveGoLiveTier({ industryId: "taller_mecanico" })).toBe("piloto")
  })

  it("desconocido es demo", () => {
    expect(resolveGoLiveTier({ industryId: "xyz_inventado" })).toBe("demo")
  })
})

describe("marketplace mock policy", () => {
  it("en test/dev permite mock por defecto", () => {
    // NODE_ENV en vitest no es production
    if (process.env.NODE_ENV !== "production") {
      expect(allowsInstantMarketplaceCheckout()).toBe(true)
    }
  })
})
