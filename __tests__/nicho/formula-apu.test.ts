import { describe, it, expect } from "vitest"
import { evaluarExpresion } from "@/lib/nicho/formula-calculo-service"
import { calcularPrecioApu, APU_SEED } from "@/lib/nicho/apu-service"

describe("formula-calculo-service", () => {
  it("evalúa superficie pared", () => {
    const r = evaluarExpresion({ expresion: "largo * alto", valores: { largo: 4, alto: 2.5 } })
    expect(r).toBe(10)
  })

  it("evalúa fórmula Hazen-Williams seed", () => {
    const r = evaluarExpresion({
      expresion: "0.278 * C * D^2.63 * S^0.54",
      valores: { C: 120, D: 0.15, S: 0.04 },
    })
    expect(r).toBeGreaterThan(0)
  })
})

describe("apu-service", () => {
  it("calcula precio pared ladrillo seed", () => {
    const item = APU_SEED[0]
    const total = calcularPrecioApu(item.componentes)
    expect(total).toBeGreaterThan(50_000)
  })
})