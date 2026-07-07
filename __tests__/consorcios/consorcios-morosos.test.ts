import { describe, expect, it } from "vitest"
import { vencimientoExpensaDesdePeriodo } from "@/lib/consorcios/consorcios-morosos-service"

describe("consorcios-morosos-service", () => {
  it("calcula vencimiento día 10 del mes siguiente", () => {
    const v = vencimientoExpensaDesdePeriodo("2026-07")
    expect(v.getFullYear()).toBe(2026)
    expect(v.getMonth()).toBe(7) // agosto (0-indexed)
    expect(v.getDate()).toBe(10)
  })

  it("pasa diciembre a enero del año siguiente", () => {
    const v = vencimientoExpensaDesdePeriodo("2026-12")
    expect(v.getFullYear()).toBe(2027)
    expect(v.getMonth()).toBe(0)
    expect(v.getDate()).toBe(10)
  })
})