import { describe, it, expect } from "vitest"
import { resolveSidebarBranding, BRAND_FULL, isCustomAppName } from "@/lib/brand"

describe("brand — ClavERP by Claver", () => {
  it("usa ClavERP por defecto", () => {
    const r = resolveSidebarBranding(null)
    expect(r.title).toBe("ClavERP")
    expect(r.subtitle).toBe("by Claver")
    expect(r.showLiveIndicator).toBe(true)
  })

  it("muestra powered-by con nombre de empresa custom", () => {
    const r = resolveSidebarBranding("Panadería La Rosa")
    expect(r.title).toBe("Panadería La Rosa")
    expect(r.subtitle).toBe(BRAND_FULL)
    expect(r.showLiveIndicator).toBe(false)
  })

  it("trata ERP Argentina como plataforma no custom", () => {
    expect(isCustomAppName("ERP Argentina")).toBe(false)
    expect(resolveSidebarBranding("ERP Argentina").title).toBe("ClavERP")
  })
})