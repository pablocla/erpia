import { describe, it, expect } from "vitest"
import { ENGANCHES, resumenEnganches, getEnganchesPorNicho } from "@/lib/marketplace/enganche-catalog"

describe("enganche-catalog", () => {
  it("tiene 40 enganches definidos (base + apps nicho LATAM)", () => {
    expect(ENGANCHES).toHaveLength(46)
  })

  it("resumenEnganches cuenta tiers correctamente", () => {
    const r = resumenEnganches()
    expect(r.totalEnganches).toBe(46)
    expect(r.porTier.implementado).toBe(27)
    expect(r.porTier.parcial).toBe(13)
    expect(r.porTier.catalogo).toBe(6)
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