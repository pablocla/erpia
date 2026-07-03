import { describe, expect, it } from "vitest"
import { MARKETPLACE_BUNDLES } from "@/lib/marketplace/bundles"
import { NICHE_APPS } from "@/lib/niche/niche-apps-catalog"
import { PACKS_CALLE } from "@/lib/comercial/pack-calle-catalog"

const NICHE_PACK_IDS = ["pool-claver-nicho", "pool-propiedad", "pool-calle-nicho"] as const

describe("niche commercial packaging", () => {
  it("bundles nicho existen con SKUs niche", () => {
    for (const id of NICHE_PACK_IDS) {
      const bundle = MARKETPLACE_BUNDLES.find((b) => b.id === id)
      expect(bundle, id).toBeDefined()
      expect(bundle!.skus.some((s) => s.startsWith("niche."))).toBe(true)
    }
  })

  it("PACKS_CALLE incluye packs nicho vendibles", () => {
    for (const id of NICHE_PACK_IDS) {
      const pack = PACKS_CALLE.find((p) => p.id === id)
      expect(pack, id).toBeDefined()
      expect(pack!.vendibleHoy).toBe(true)
      expect(pack!.modoLite).toBe("niche")
      expect(pack!.landingPath).toBe("/dashboard/nicho")
    }
  })

  it("cada app de nicho tiene precio y SKU único", () => {
    const skus = NICHE_APPS.map((a) => a.sku)
    expect(new Set(skus).size).toBe(NICHE_APPS.length)
    for (const app of NICHE_APPS) {
      expect(app.precioArs).toBeGreaterThan(0)
    }
  })
})