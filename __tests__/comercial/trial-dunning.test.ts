import { describe, it, expect } from "vitest"
import { pickDunningWindow } from "@/lib/comercial/trial-dunning-service"

describe("pickDunningWindow", () => {
  it("3 días o menos → ventana 3", () => {
    expect(pickDunningWindow(3, false)).toBe(3)
    expect(pickDunningWindow(2, false)).toBe(3)
  })
  it("1 día → ventana 1", () => {
    expect(pickDunningWindow(1, false)).toBe(1)
  })
  it("expirado → ventana 0", () => {
    expect(pickDunningWindow(0, true)).toBe(0)
    expect(pickDunningWindow(0, false)).toBe(0)
  })
  it("más de 3 días → sin dunning", () => {
    expect(pickDunningWindow(7, false)).toBeNull()
    expect(pickDunningWindow(14, false)).toBeNull()
  })
})
