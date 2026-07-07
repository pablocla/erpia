import { describe, expect, it } from "vitest"
import { reglaSkuParaRuta } from "@/lib/comercial/api-sku-entitlements"

describe("api-sku-entitlements", () => {
  it("mapea POS a core.claver en escritura", () => {
    const regla = reglaSkuParaRuta("/api/pos/venta", "POST")
    expect(regla?.skus).toContain("core.claver")
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
})