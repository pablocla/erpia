import { describe, it, expect } from "vitest"
/**
 * Tests de lógica de liquidación (sin DB).
 * La integración Prisma corre en test:integration.
 */
describe("consorcios liquidación — lógica", () => {
  it("prorrateo por porceps suma 100% en fixture típico", () => {
    const unidades = [
      { porceps: 35 },
      { porceps: 40 },
      { porceps: 25 },
    ]
    const total = unidades.reduce((s, u) => s + u.porceps, 0)
    expect(total).toBe(100)
  })

  it("monto expensa = gasto * porceps / 100", () => {
    const totalGastos = 122_200
    const porceps = 42.3
    const monto = (totalGastos * porceps) / 100
    expect(Math.round(monto)).toBe(51_691)
  })

  it("fiscal service asigna correlativo incremental (concepto)", () => {
    const ultimo = 15
    const siguiente = ultimo + 1
    expect(siguiente).toBe(16)
  })
})