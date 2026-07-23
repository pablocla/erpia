import { describe, it, expect } from "vitest"
import { dentroDeHorarioLocal } from "@/lib/empleados-digitales/horario"

describe("dentroDeHorarioLocal ED-23", () => {
  it("true dentro de 09-18", () => {
    // 12:00 UTC-3 roughly — use fixed: noon Argentina
    const noon = new Date("2026-07-22T15:00:00.000Z") // 12:00 AR
    expect(
      dentroDeHorarioLocal({ from: "09:00", to: "18:00" }, "America/Argentina/Buenos_Aires", noon),
    ).toBe(true)
  })

  it("false de madrugada", () => {
    const night = new Date("2026-07-22T06:00:00.000Z") // 03:00 AR
    expect(
      dentroDeHorarioLocal({ from: "09:00", to: "18:00" }, "America/Argentina/Buenos_Aires", night),
    ).toBe(false)
  })
})
