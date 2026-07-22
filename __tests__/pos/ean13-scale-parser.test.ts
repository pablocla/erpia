import { describe, it, expect } from "vitest"
import {
  parseEAN13ScaleBarcode,
  parseBalanzaEAN13,
  ean13Checksum,
  isValidEan13,
} from "@/lib/pos/ean13-scale-parser"

describe("parseEAN13ScaleBarcode", () => {
  it("debe retornar isScaleBarcode: false para códigos EAN-13 normales", () => {
    const result = parseEAN13ScaleBarcode("7791234567890")
    expect(result.isScaleBarcode).toBe(false)
  })

  it("debe descompilar código de balanza (20 + SKU 5 + monto 5 + C)", () => {
    // 20 + 00123 + 04500 ($45.00) + checksum
    const body = "200012304500"
    const c = ean13Checksum(body)
    const code = `${body}${c}`
    const result = parseEAN13ScaleBarcode(code)
    expect(result.isScaleBarcode).toBe(true)
    expect(result.productSku).toBe("00123")
    expect(result.totalPrice).toBe(45.0)
    expect(result.weightGrams).toBe(4500)
    expect(result.checksumValid).toBe(true)
  })

  it("acepta prefijo 21", () => {
    const body = "210099912500"
    const code = `${body}${ean13Checksum(body)}`
    const result = parseEAN13ScaleBarcode(code)
    expect(result.isScaleBarcode).toBe(true)
    expect(result.productSku).toBe("00999")
    expect(result.totalPrice).toBe(125)
  })

  it("modo peso interpreta gramos → kg", () => {
    const body = "200012301250"
    const code = `${body}${ean13Checksum(body)}`
    const result = parseEAN13ScaleBarcode(code, 100, "weight")
    expect(result.mode).toBe("weight")
    expect(result.weightGrams).toBe(1250)
    expect(result.weightKg).toBe(1.25)
    expect(result.isPriceMode).toBe(false)
  })

  it("parseBalanzaEAN13 expone API del megaprompt", () => {
    const body = "200012304500"
    const code = `${body}${ean13Checksum(body)}`
    const r = parseBalanzaEAN13(code)
    expect(r.isBalanza).toBe(true)
    expect(r.plu).toBe("00123")
    expect(r.monto).toBe(45)
  })

  it("isValidEan13 valida checksum", () => {
    const body = "200012304500"
    expect(isValidEan13(`${body}${ean13Checksum(body)}`)).toBe(true)
    expect(isValidEan13(`${body}0`)).toBe(false)
  })
})
