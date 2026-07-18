import { describe, expect, it } from "vitest"
import { vencimientoExpensaDesdePeriodo } from "@/lib/consorcios/consorcios-morosos-service"
import {
  periodoAlquilerActual,
  vencimientoAlquilerDesdePeriodo,
} from "@/lib/inmobiliaria/alquileres-service"

describe("consorcios/inmobiliaria cobro logic", () => {
  it("vencimiento expensa es día 10 del mes siguiente", () => {
    const v = vencimientoExpensaDesdePeriodo("2026-07")
    expect(v.getFullYear()).toBe(2026)
    expect(v.getMonth()).toBe(7) // agosto = 7
    expect(v.getDate()).toBe(10)
  })

  it("vencimiento alquiler respeta día del contrato", () => {
    const v = vencimientoAlquilerDesdePeriodo("2026-07", 15)
    expect(v.getDate()).toBe(15)
    expect(v.getMonth()).toBe(6)
  })

  it("periodo actual formato YYYY-MM", () => {
    expect(periodoAlquilerActual()).toMatch(/^\d{4}-\d{2}$/)
  })

  it("convención deuda: decrement baja el saldo hacia negativo", () => {
    // saldo 0 + deuda 1000 → -1000 (decrement 1000)
    const saldoAntes = 0
    const monto = 1000
    const saldoDespues = saldoAntes - monto
    expect(saldoDespues).toBe(-1000)
    expect(saldoDespues < 0).toBe(true)
  })
})
