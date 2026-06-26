import { describe, it, expect } from "vitest"
import { calcularPrecioPorPeso } from "@/lib/almacen-rosario/balanza-peso-service"
import { aplicarPromoCantidad } from "@/lib/almacen-rosario/promos-cantidad-service"
import { RETAIL_EXTENSION_SKUS } from "@/lib/almacen-rosario/retail-skus"

describe("retail extensions", () => {
  it("calcula precio por peso", () => {
    const r = calcularPrecioPorPeso({ precioPorKg: 1200, pesoKg: 1.25 })
    expect(r.total).toBe(1500)
  })

  it("aplica promo 2x1", () => {
    const r = aplicarPromoCantidad(4, 1000, {
      id: "t",
      nombre: "2x1",
      tipo: "lleva_paga",
      lleva: 2,
      paga: 1,
      activo: true,
    })
    expect(r.ahorro).toBe(2000)
    expect(r.cantidadCobrada).toBe(2)
  })

  it("define 10 SKUs retail nuevos", () => {
    expect(RETAIL_EXTENSION_SKUS).toHaveLength(10)
  })
})