import { describe, expect, it } from "vitest"
import {
  PACKS_ESPECIALISTAS,
  getPackEspecialista,
  margenBrutoPct,
  packPublico,
} from "@/lib/servicios-especialista/especialista-catalog"

describe("especialista-catalog", () => {
  it("el express es 1 hora y es el pack recomendado", () => {
    const express = getPackEspecialista("puesta_a_punto_express")
    expect(express?.duracionHoras).toBe(1)
    expect(express?.popular).toBe(true)
    expect(express?.maxArticulos).toBeLessThanOrEqual(80)
  })

  it("migración no promete 5.000 SKUs ni 2.5 h", () => {
    const migra = getPackEspecialista("migracion_arca_total")
    expect(migra?.duracionHoras).toBeGreaterThanOrEqual(4)
    expect(migra?.maxArticulos).toBeLessThanOrEqual(1000)
    expect(migra?.entregables.join(" ")).not.toMatch(/5\.?000/)
    expect(migra?.exclusiones.join(" ").toLowerCase()).toMatch(/clave fiscal/)
  })

  it("el mensual no promete 15 minutos", () => {
    const vip = getPackEspecialista("soporte_vip_mensual")
    expect(vip?.sla.toLowerCase()).not.toMatch(/15 min/)
    expect(vip?.exclusiones.join(" ")).toMatch(/15 minutos/)
    expect(vip?.tipo).toBe("recurrente")
  })

  it("margen bruto interno ≥ 70% y no se filtra al cliente", () => {
    for (const pack of PACKS_ESPECIALISTAS) {
      expect(margenBrutoPct(pack.precioARS, pack.costoImplementadorARS)).toBe(pack.margenEstimadoPct)
      expect(pack.margenEstimadoPct).toBeGreaterThanOrEqual(70)
      const pub = packPublico(pack)
      expect(pub).not.toHaveProperty("costoImplementadorARS")
      expect(pub).not.toHaveProperty("margenEstimadoPct")
    }
  })
})
