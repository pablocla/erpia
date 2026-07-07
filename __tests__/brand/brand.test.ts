import { describe, it, expect } from "vitest"
import {
  resolveSidebarBranding,
  resolveAgroBranding,
  resolveDashboardBranding,
  isAgroRubro,
  BRAND_FULL,
  CLAVERGROW_FULL,
  isCustomAppName,
} from "@/lib/brand"
import { CLAVERGROW_PRODUCT } from "@/lib/marketing/brand-system"
import { CLAVERGROW_PACKS } from "@/lib/marketing/clavergrow-catalog"

describe("brand — Claver", () => {
  it("usa Claver por defecto", () => {
    const r = resolveSidebarBranding(null)
    expect(r.title).toBe("Claver")
    expect(r.subtitle).toBe("Un sistema. Toda tu operación.")
    expect(r.showLiveIndicator).toBe(true)
  })

  it("BRAND_FULL no repite el nombre del grupo", () => {
    expect(BRAND_FULL).toBe("Claver")
  })

  it("muestra powered-by con nombre de empresa custom", () => {
    const r = resolveSidebarBranding("Panadería La Rosa")
    expect(r.title).toBe("Panadería La Rosa")
    expect(r.subtitle).toBe("Claver")
    expect(r.showLiveIndicator).toBe(false)
  })

  it("trata ERP Argentina como plataforma no custom", () => {
    expect(isCustomAppName("ERP Argentina")).toBe(false)
    expect(resolveSidebarBranding("ERP Argentina").title).toBe("Claver")
  })
})

describe("brand — Clavergrow", () => {
  it("define producto Clavergrow con tagline", () => {
    expect(CLAVERGROW_PRODUCT.name).toBe("Clavergrow")
    expect(CLAVERGROW_PRODUCT.tagline).toBe("Cultivá con control.")
    expect(CLAVERGROW_PRODUCT.slug).toBe("clavergrow")
  })

  it("usa Clavergrow por defecto en branding agro", () => {
    const r = resolveAgroBranding(null)
    expect(r.title).toBe("Clavergrow")
    expect(r.subtitle).toBe("by Claver")
    expect(r.tagline).toBe("Cultivá con control.")
    expect(r.showLiveIndicator).toBe(true)
  })

  it("trata Clavergrow como nombre de plataforma no custom", () => {
    expect(isCustomAppName("Clavergrow")).toBe(false)
    expect(resolveAgroBranding("Clavergrow").title).toBe("Clavergrow")
  })

  it("muestra lockup con empresa custom en agro", () => {
    const r = resolveAgroBranding("Cooperativa del Sur")
    expect(r.title).toBe("Cooperativa del Sur")
    expect(r.subtitle).toBe(CLAVERGROW_FULL)
    expect(r.showLiveIndicator).toBe(false)
  })

  it("catálogo tiene packs core y regulado", () => {
    const ids = CLAVERGROW_PACKS.map((p) => p.id)
    expect(ids).toContain("core")
    expect(ids).toContain("acopio")
    expect(ids).toContain("regulated")
  })
})

describe("brand — dashboard por rubro", () => {
  it("detecta rubros agro", () => {
    expect(isAgroRubro("agro_acopio")).toBe(true)
    expect(isAgroRubro("agro_cannabis")).toBe(true)
    expect(isAgroRubro("kiosco")).toBe(false)
    expect(isAgroRubro(null)).toBe(false)
  })

  it("usa Clavergrow en sidebar para agro_acopio", () => {
    const r = resolveDashboardBranding("ERP Argentina", "agro_acopio")
    expect(r.title).toBe("Clavergrow")
    expect(r.productLine).toBe("clavergrow")
    expect(r.liveLabel).toBe("Cultivá con control.")
  })

  it("usa Clavis en sidebar para comercio", () => {
    const r = resolveDashboardBranding("ERP Argentina", "kiosco")
    expect(r.productLine).toBe("clavis")
    expect(r.liveLabel).toBe("Operación en tiempo real")
  })

  it("respeta nombre custom en tenant agro", () => {
    const r = resolveDashboardBranding("Acopio del Sur", "agro_acopio")
    expect(r.title).toBe("Acopio del Sur")
    expect(r.subtitle).toBe(CLAVERGROW_FULL)
    expect(r.showLiveIndicator).toBe(false)
  })
})