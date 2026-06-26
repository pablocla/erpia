import { describe, it, expect } from "vitest"
import { ENGANCHES, resumenEnganches, getEnganchesPorNicho } from "@/lib/marketplace/enganche-catalog"

describe("enganche-catalog", () => {
  it("tiene 17 enganches definidos (incl. Premium 7)", () => {
    expect(ENGANCHES).toHaveLength(17)
  })

  it("resumenEnganches cuenta tiers correctamente", () => {
    const r = resumenEnganches()
    expect(r.totalEnganches).toBe(17)
    expect(r.porTier.implementado).toBe(3)
    expect(r.porTier.parcial).toBe(7)
    expect(r.porTier.catalogo).toBe(7)
    expect(r.skusMarketplaceTotal).toBeGreaterThanOrEqual(57)
    expect(r.intangiblesTop5).toBe(5)
    expect(r.intangiblesPremium7).toBe(7)
  })

  it("almacen de barrio tiene al menos 6 enganches", () => {
    const barrio = getEnganchesPorNicho("almacen_barrio")
    expect(barrio.length).toBeGreaterThanOrEqual(6)
    expect(barrio.map((e) => e.sku)).toContain("pos.fiado_barrio")
  })
})