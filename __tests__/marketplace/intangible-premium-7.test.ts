import { describe, it, expect } from "vitest"
import {
  INTANGIBLE_PREMIUM_7,
  PREMIUM_7_BUNDLE_ID,
  getPremiumIntangibleBySku,
} from "@/lib/marketplace/intangible-premium-7"
import { MARKETPLACE_BUNDLES } from "@/lib/marketplace/bundles"
import { MARKETPLACE_CATALOG } from "@/lib/marketplace/marketplace-catalog"
import { AUTOPOOL_ENTRIES } from "@/lib/marketplace/autopool-manifest"
import { getRunbook } from "@/lib/marketplace/product-runbooks"

describe("intangible-premium-7", () => {
  it("define exactamente 7 servicios premium", () => {
    expect(INTANGIBLE_PREMIUM_7).toHaveLength(7)
    const ranks = INTANGIBLE_PREMIUM_7.map((s) => s.rank).sort()
    expect(ranks).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it("cada SKU premium está en catálogo, autopool y runbook", () => {
    for (const svc of INTANGIBLE_PREMIUM_7) {
      expect(MARKETPLACE_CATALOG.some((c) => c.sku === svc.sku)).toBe(true)
      expect(AUTOPOOL_ENTRIES.some((e) => e.sku === svc.sku)).toBe(true)
      expect(getRunbook(svc.sku)).not.toBeNull()
    }
  })

  it("bundle premium-erp-7 incluye los 7 SKUs", () => {
    const bundle = MARKETPLACE_BUNDLES.find((b) => b.id === PREMIUM_7_BUNDLE_ID)
    expect(bundle).toBeDefined()
    expect(bundle!.skus).toHaveLength(7)
    for (const sku of INTANGIBLE_PREMIUM_7.map((s) => s.sku)) {
      expect(bundle!.skus).toContain(sku)
    }
  })

  it("getPremiumIntangibleBySku resuelve guardian_pos", () => {
    const g = getPremiumIntangibleBySku("intang.guardian_pos")
    expect(g?.nombre).toContain("Guardián")
    expect(g?.precioArs).toBe(14900)
  })
})