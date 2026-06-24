import { describe, it, expect } from "vitest"
import { toNumber, formatARS } from "@/lib/format/currency"

describe("format/currency", () => {
  it("toNumber convierte string Decimal de Prisma", () => {
    expect(toNumber("4200.50")).toBe(4200.5)
    expect(toNumber("8500")).toBe(8500)
  })

  it("toNumber acepta number y null", () => {
    expect(toNumber(15000)).toBe(15000)
    expect(toNumber(null)).toBe(0)
    expect(toNumber(undefined, 99)).toBe(99)
  })

  it("formatARS no lanza con string", () => {
    expect(formatARS("8500")).toMatch(/\$|ARS/)
  })
})