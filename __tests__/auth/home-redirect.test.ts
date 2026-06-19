import { describe, it, expect } from "vitest"
import { getHomePathForRol } from "@/lib/auth/home-redirect"

describe("getHomePathForRol", () => {
  it("redirige cajero al POS", () => {
    expect(getHomePathForRol("cajero")).toBe("/dashboard/pos")
  })

  it("redirige contador a impuestos", () => {
    expect(getHomePathForRol("contador")).toBe("/dashboard/impuestos")
  })

  it("redirige vendedor ruta a app móvil", () => {
    expect(getHomePathForRol("vendedor_ruta")).toBe("/vendedor")
  })

  it("rol desconocido cae en dashboard", () => {
    expect(getHomePathForRol("unknown")).toBe("/dashboard")
  })
})