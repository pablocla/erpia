import { describe, expect, it } from "vitest"
import {
  CABALLOS_CALLE_APP_IDS,
  NICHE_APPS,
  getNicheApp,
  getNicheAppBySku,
  isCaballoCalle,
} from "@/lib/niche/niche-apps-catalog"
import { ENGANCHES } from "@/lib/marketplace/enganche-catalog"

describe("Grupo Claver — niche apps", () => {
  it("registra 21 apps de nicho (+ fiado aparte)", () => {
    expect(NICHE_APPS.length).toBe(21)
    const ids = NICHE_APPS.map((a) => a.appId)
    expect(ids).toContain("consorcios")
    expect(ids).toContain("club")
    expect(ids).toContain("plancha")
    expect(ids).toContain("mutuo")
    expect(ids).toContain("escuela")
    expect(ids).toContain("gimnasio")
    expect(ids).toContain("veterinaria")
  })

  it("cada app tiene SKU, engine y golden path", () => {
    for (const app of NICHE_APPS) {
      expect(app.sku.startsWith("niche.")).toBe(true)
      expect(app.goldenPath).toMatch(/^\/dashboard/)
      expect(app.plantillaWhatsApp?.length).toBeGreaterThan(10)
    }
  })

  it("genera enganches comerciales alineados", () => {
    const nicheEng = ENGANCHES.filter((e) => e.sku.startsWith("niche."))
    expect(nicheEng.length).toBe(NICHE_APPS.length)
    expect(getNicheApp("consorcios")?.sku).toBe(getNicheAppBySku("niche.consorcios")?.sku)
  })

  it("prestamista redirige a libreta fiado", () => {
    const p = getNicheApp("prestamista")
    expect(p?.engine).toBe("libreta")
    expect(p?.redirectPath).toBe("/dashboard/fiado")
  })

  it("caballos de calle son subset vendible", () => {
    expect(CABALLOS_CALLE_APP_IDS.length).toBe(5)
    expect(isCaballoCalle("consorcios")).toBe(true)
    expect(isCaballoCalle("escuela")).toBe(false)
  })

  it("veterinaria redirige a historia clínica", () => {
    const v = getNicheApp("veterinaria")
    expect(v?.redirectPath).toBe("/dashboard/historia-clinica")
  })
})