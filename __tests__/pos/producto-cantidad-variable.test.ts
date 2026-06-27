import { describe, it, expect } from "vitest"
import {
  productoRequiereCantidadVariable,
  etiquetaUnidadVariable,
} from "@/lib/pos/producto-cantidad-variable"

describe("producto-cantidad-variable", () => {
  it("detecta unidades pesables o fraccionables", () => {
    expect(productoRequiereCantidadVariable("kg")).toBe(true)
    expect(productoRequiereCantidadVariable("litro")).toBe(true)
    expect(productoRequiereCantidadVariable("metro")).toBe(true)
    expect(productoRequiereCantidadVariable("unidad")).toBe(false)
  })

  it("etiqueta unidad para numpad", () => {
    expect(etiquetaUnidadVariable("litro")).toBe("litros")
    expect(etiquetaUnidadVariable("m")).toBe("metros")
  })
})