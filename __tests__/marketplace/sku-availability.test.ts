import { describe, it, expect } from "vitest"
import {
  SKUS_PLANNED_ONLY,
  assertSkuProvisionable,
  effectiveSkuStatus,
  isPathAllowedInSidebarAllowlist,
  isSkuProvisionable,
} from "@/lib/marketplace/sku-availability"
import { getSidebarAllowlist } from "@/lib/comercial/sidebar-rubro-filter"

describe("sku-availability", () => {
  it("marca SKUs fantasma como no provisionables", () => {
    for (const sku of SKUS_PLANNED_ONLY) {
      expect(isSkuProvisionable(sku)).toBe(false)
      expect(effectiveSkuStatus(sku, "disponible")).toBe("planned")
    }
  })

  it("permite SKUs implementados", () => {
    expect(isSkuProvisionable("niche.consorcios")).toBe(true)
    expect(effectiveSkuStatus("niche.consorcios", "disponible")).toBe("disponible")
  })

  it("assertSkuProvisionable lanza para planned", () => {
    expect(() => assertSkuProvisionable("sec.mfa")).toThrow(/Próximamente/)
  })

  it("isPathAllowedInSidebarAllowlist respeta prefijos", () => {
    const allowed = ["/dashboard", "/dashboard/pos", "/dashboard/nicho"]
    expect(isPathAllowedInSidebarAllowlist("/dashboard", allowed)).toBe(true)
    expect(isPathAllowedInSidebarAllowlist("/dashboard/pos", allowed)).toBe(true)
    expect(isPathAllowedInSidebarAllowlist("/dashboard/nicho/consorcios", allowed)).toBe(true)
    expect(isPathAllowedInSidebarAllowlist("/dashboard/compras", allowed)).toBe(false)
  })
})

describe("sidebar-rubro-filter allowlist", () => {
  it("devuelve paths acotados para demo almacén", () => {
    const paths = getSidebarAllowlist({
      rubro: "almacen",
      industryId: "almacen",
      modoLite: "completo",
      presentMode: true,
      isAdmin: true,
    })
    expect(paths).not.toBeNull()
    expect(paths!.length).toBeLessThan(20)
    expect(paths!.some((p) => p.includes("/dashboard/pos") || p.includes("/dashboard/productos"))).toBe(true)
    expect(paths!.some((p) => p.includes("/dashboard/iot"))).toBe(false)
  })

  it("null para admin ERP completo sin demo", () => {
    const paths = getSidebarAllowlist({
      rubro: "otro",
      industryId: null,
      modoLite: "completo",
      presentMode: false,
      isAdmin: true,
    })
    expect(paths).toBeNull()
  })
})