import { describe, it, expect } from "vitest"
import {
  IA_SAAS_TOP_20,
  IA_SAAS_TIER_PACKS,
  getIaSaasPack,
  getIaSaasBySku,
  iaSaasDestacados,
  iaSaasPorRubro,
  iaSaasDisponibles,
  skusDelTierPack,
  resumenComercialTop20,
} from "@/lib/comercial/ia-saas-top20"

describe("ia-saas-top20", () => {
  it("tiene exactamente 20 empaquetados con rank único", () => {
    expect(IA_SAAS_TOP_20).toHaveLength(20)
    const ranks = IA_SAAS_TOP_20.map((p) => p.rank)
    expect(new Set(ranks).size).toBe(20)
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
  })

  it("cada pack tiene sku principal y rutas IA", () => {
    for (const p of IA_SAAS_TOP_20) {
      expect(p.skuPrincipal.length).toBeGreaterThan(0)
      expect(p.procesosErp.length).toBeGreaterThan(0)
      expect(p.rutasIa.length).toBeGreaterThan(0)
      expect(p.activarHref).toContain("activar=")
    }
  })

  it("getIaSaasPack y getIaSaasBySku resuelven", () => {
    const asistente = getIaSaasPack("asistente-negocio")
    expect(asistente?.nombre).toMatch(/Asistente/)
    expect(getIaSaasBySku("core.ia")?.id).toBe("asistente-negocio")
    expect(getIaSaasBySku("intang.cobranzas_wa")?.id).toBe("cobra-ia")
  })

  it("iaSaasPorRubro filtra almacen", () => {
    const packs = iaSaasPorRubro("almacen")
    expect(packs.some((p) => p.id === "fiado-cobro-inteligente")).toBe(true)
    expect(packs.some((p) => p.rubros.includes("*"))).toBe(true)
  })

  it("tier packs referencian packs existentes", () => {
    for (const tier of IA_SAAS_TIER_PACKS) {
      expect(tier.packIds.length).toBeGreaterThan(0)
      for (const id of tier.packIds) {
        expect(getIaSaasPack(id)).not.toBeNull()
      }
      const skus = skusDelTierPack(tier.id)
      expect(skus.length).toBeGreaterThan(0)
    }
  })

  it("resumen comercial coherente", () => {
    const r = resumenComercialTop20()
    expect(r.total).toBe(20)
    expect(r.disponibles).toBeLessThanOrEqual(20)
    expect(iaSaasDestacados().length).toBeGreaterThan(0)
    expect(iaSaasDisponibles().length).toBeGreaterThan(10)
  })
})