import { describe, expect, it } from "vitest"
import { reglaSkuParaRuta } from "@/lib/comercial/api-sku-entitlements"

describe("api-sku-entitlements", () => {
  it("mapea POS a ancla fiado o core.claver (1 caja gratis)", () => {
    const regla = reglaSkuParaRuta("/api/pos/venta", "POST")
    expect(regla?.mode).toBe("any")
    expect(regla?.skus).toContain("pos.fiado_barrio")
    expect(regla?.skus).toContain("core.claver")
  })

  it("oficios escritura usa ancla niche.oficios", () => {
    const regla = reglaSkuParaRuta("/api/oficios/trabajos", "POST")
    expect(regla?.mode).toBe("any")
    expect(regla?.skus).toContain("niche.oficios")
  })

  it("mapea fiado a pos.fiado_barrio", () => {
    const regla = reglaSkuParaRuta("/api/fiado/anotar", "POST")
    expect(regla?.skus).toContain("pos.fiado_barrio")
  })

  it("no aplica regla en GET", () => {
    expect(reglaSkuParaRuta("/api/pos/venta", "GET")).toBeNull()
  })

  it("cobranzas acepta any de fiado/cobra/pos", () => {
    const regla = reglaSkuParaRuta("/api/cuentas-cobrar/cobros", "POST")
    expect(regla?.mode).toBe("any")
    expect(regla?.skus).toContain("pos.fiado_barrio")
  })

  it("exige fiscal.cert_afip para /api/afip (no cubierto por pos.fiado_barrio)", () => {
    const regla = reglaSkuParaRuta("/api/afip/facturar", "POST")
    expect(regla).not.toBeNull()
    expect(regla?.skus).toContain("fiscal.cert_afip")
    expect(regla?.skus).not.toContain("pos.fiado_barrio")
  })

  it("exige intang.cobranzas_wa para /api/whatsapp", () => {
    const regla = reglaSkuParaRuta("/api/whatsapp/enviar", "POST")
    expect(regla).not.toBeNull()
    expect(regla?.skus).toContain("intang.cobranzas_wa")
    expect(regla?.skus).not.toContain("pos.fiado_barrio")
  })
})