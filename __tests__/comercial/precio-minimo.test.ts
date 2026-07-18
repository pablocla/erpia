import { describe, expect, it } from "vitest"
import {
  PRECIO_MINIMO_SUSCRIPCION_ARS,
  aplicarPisoPrecioSuscripcion,
  assertPrecioSuscripcionValido,
  esSkuAnclaGratis,
  precioCobrableSku,
} from "@/lib/comercial/precio-minimo"
import { resolvePrecioSku, precioOfertaMonetizada, OFERTA_FIADO_ANCLA } from "@/lib/comercial/ofertas-comerciales"

describe("precio-minimo go-live", () => {
  it("piso es $10.000", () => {
    expect(PRECIO_MINIMO_SUSCRIPCION_ARS).toBe(10_000)
  })

  it("sube precios de pago por debajo del piso", () => {
    expect(aplicarPisoPrecioSuscripcion(3990)).toBe(10_000)
    expect(aplicarPisoPrecioSuscripcion(9999)).toBe(10_000)
    expect(aplicarPisoPrecioSuscripcion(10_000)).toBe(10_000)
    expect(aplicarPisoPrecioSuscripcion(25_000)).toBe(25_000)
  })

  it("deja gratis en 0", () => {
    expect(aplicarPisoPrecioSuscripcion(0)).toBe(0)
    expect(aplicarPisoPrecioSuscripcion(-5)).toBe(0)
  })

  it("ancla fiado sigue gratis", () => {
    expect(esSkuAnclaGratis("pos.fiado_barrio")).toBe(true)
    expect(precioCobrableSku("pos.fiado_barrio", 4990)).toBe(0)
    expect(precioCobrableSku("intang.cobranzas_wa", 4990)).toBe(10_000)
  })

  it("assert rechaza 0 y acepta piso", () => {
    expect(assertPrecioSuscripcionValido(0).ok).toBe(false)
    expect(assertPrecioSuscripcionValido(5000).ok).toBe(true)
    expect(assertPrecioSuscripcionValido(5000).precio).toBe(10_000)
  })

  it("resolvePrecioSku no devuelve pago bajo el piso (salvo ancla 0)", () => {
    // Cualquier SKU de pago resuelto debe ser 0 o >= 10000
    const sample = ["intang.cobranzas_wa", "fiscal.clavpay_link", "com.whatsapp", "core.claver"]
    for (const sku of sample) {
      const p = resolvePrecioSku(sku)
      expect(p === 0 || p >= PRECIO_MINIMO_SUSCRIPCION_ARS).toBe(true)
    }
    expect(resolvePrecioSku("pos.fiado_barrio")).toBe(0)
  })

  it("pack fiado-ancla monetizado >= piso", () => {
    expect(precioOfertaMonetizada(OFERTA_FIADO_ANCLA)).toBeGreaterThanOrEqual(PRECIO_MINIMO_SUSCRIPCION_ARS)
  })

  it("catálogos retail/pos no publican precios de pago bajo el piso", async () => {
    const { RETAIL_SKU_META } = await import("@/lib/almacen-rosario/retail-skus")
    for (const meta of Object.values(RETAIL_SKU_META)) {
      expect(meta.precioArs === 0 || meta.precioArs >= PRECIO_MINIMO_SUSCRIPCION_ARS).toBe(true)
    }
  })
})
