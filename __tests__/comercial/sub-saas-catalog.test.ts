import { describe, expect, it } from "vitest"
import {
  SUB_SAAS_APPS,
  SUB_SAAS_DESTACADOS,
  SUB_SAAS_SLUGS,
  formatPublicPath,
  getSubSaasApp,
  subSaasDestacadas,
  subSaasHrefBySku,
  subSaasLandingHref,
} from "@/lib/comercial/sub-saas-catalog"

describe("sub-saas-catalog", () => {
  it("define apps con slugs únicos incluyendo propiedad", () => {
    expect(SUB_SAAS_APPS.length).toBeGreaterThanOrEqual(11)
    const slugs = SUB_SAAS_APPS.map((a) => a.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(SUB_SAAS_SLUGS).toEqual(slugs)
    expect(slugs).toContain("propiedad")
  })

  it("resuelve apps por slug", () => {
    const fiado = getSubSaasApp("fiado")
    expect(fiado?.sku).toBe("pos.fiado_barrio")
    expect(fiado?.modoLite).toBe("fiado")
    expect(getSubSaasApp("inexistente")).toBeNull()
  })

  it("mapea SKU a landing href", () => {
    expect(subSaasHrefBySku("pos.fiado_barrio")).toBe("/claver/apps/fiado")
    expect(subSaasHrefBySku("intang.cobranzas_wa")).toBe("/claver/apps/cobra")
    expect(subSaasHrefBySku("pool-propiedad")).toBe("/claver/apps/propiedad")
    expect(subSaasHrefBySku("pool-monotributo")).toBe("/claver/apps/monotributo")
    expect(subSaasHrefBySku("pool-servicios-pro")).toBe("/claver/apps/servicios")
    expect(subSaasHrefBySku("pool-obra")).toBe("/claver/apps/obra")
    expect(subSaasHrefBySku("sku.desconocido")).toBeNull()
  })

  it("genera href de landing", () => {
    expect(subSaasLandingHref("turnos")).toBe("/claver/apps/turnos")
  })

  it("formatea rutas públicas con placeholders", () => {
    const turnos = getSubSaasApp("turnos")!
    expect(formatPublicPath(turnos, { empresaId: 42 })).toBe("/agenda-online/42")

    const tienda = getSubSaasApp("tienda")!
    expect(formatPublicPath(tienda, { slug: "mi-tienda" })).toBe("/tienda/mi-tienda")

    const menu = getSubSaasApp("menu-qr")!
    expect(formatPublicPath(menu, { empresaId: 7 })).toBe("/menu/7")
  })

  it("destacadas incluye fiado, cobra y propiedad", () => {
    expect(SUB_SAAS_DESTACADOS).toContain("fiado")
    expect(SUB_SAAS_DESTACADOS).toContain("cobra")
    expect(SUB_SAAS_DESTACADOS).toContain("propiedad")
    expect(SUB_SAAS_DESTACADOS).toContain("monotributo")
    expect(SUB_SAAS_DESTACADOS).toContain("servicios")
    const destacadas = subSaasDestacadas()
    expect(destacadas.length).toBe(SUB_SAAS_DESTACADOS.length)
    expect(destacadas.every((a) => SUB_SAAS_DESTACADOS.includes(a.slug as never))).toBe(true)
  })

  it("cada app tiene campos comerciales mínimos", () => {
    for (const app of SUB_SAAS_APPS) {
      expect(app.marca.length).toBeGreaterThan(0)
      expect(app.reelHook.length).toBeGreaterThan(0)
      expect(app.pains.length).toBeGreaterThan(0)
      expect(app.outcomes.length).toBeGreaterThan(0)
      expect(app.pasosActivacion.length).toBeGreaterThan(0)
      expect(app.listoPct).toBeGreaterThanOrEqual(0)
      expect(app.listoPct).toBeLessThanOrEqual(100)
      expect(app.dashboardPath.startsWith("/dashboard")).toBe(true)
    }
  })
})