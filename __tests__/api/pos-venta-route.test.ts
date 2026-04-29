import { describe, it, expect } from "vitest"
import { calcularLinea, tipoCbteDesde } from "@/app/api/pos/venta/route"

describe("POS venta route helpers", () => {
  it("calcula correctamente neto, IVA y total sin descuento", () => {
    const result = calcularLinea(100, 2, 21, 0)
    expect(result.total).toBe(200)
    expect(result.neto).toBeCloseTo(165.29, 2)
    expect(result.iva).toBeCloseTo(34.71, 2)
  })

  it("aplica descuento global correctamente", () => {
    const result = calcularLinea(100, 2, 21, 10)
    expect(result.total).toBe(180)
    expect(result.neto).toBeCloseTo(148.76, 2)
    expect(result.iva).toBeCloseTo(31.24, 2)
  })

  it("mappea los tipos de comprobante a código AFIP", () => {
    expect(tipoCbteDesde("A")).toBe(1)
    expect(tipoCbteDesde("B")).toBe(6)
    expect(tipoCbteDesde("C")).toBe(11)
    expect(tipoCbteDesde("ticket")).toBe(6)
    expect(tipoCbteDesde("X")).toBe(6)
  })
})
