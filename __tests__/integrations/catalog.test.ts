import { describe, it, expect } from "vitest"
import {
  INTEGRATION_CATALOG,
  getCatalogEntry,
  getNovedades,
  getCatalogByCategoria,
} from "@/lib/integrations/catalog"

describe("integration catalog", () => {
  it("tiene al menos 30 integraciones", () => {
    expect(INTEGRATION_CATALOG.length).toBeGreaterThanOrEqual(30)
  })

  it("incluye integraciones prioritarias AR", () => {
    const ids = INTEGRATION_CATALOG.map((e) => e.id)
    expect(ids).toContain("mercado_pago")
    expect(ids).toContain("mercado_libre")
    expect(ids).toContain("tienda_nube")
    expect(ids).toContain("shopify")
    expect(ids).toContain("afip")
  })

  it("getNovedades retorna items marcados", () => {
    const n = getNovedades()
    expect(n.length).toBeGreaterThan(5)
    expect(n.every((e) => e.novedad)).toBe(true)
  })

  it("getCatalogEntry encuentra por id", () => {
    expect(getCatalogEntry("stripe")?.nombre).toBe("Stripe")
  })

  it("agrupa por categoría", () => {
    const grouped = getCatalogByCategoria()
    expect(grouped.ecommerce?.length).toBeGreaterThan(0)
    expect(grouped.pagos?.length).toBeGreaterThan(0)
  })
})