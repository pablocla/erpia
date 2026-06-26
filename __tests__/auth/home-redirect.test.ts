import { describe, it, expect } from "vitest"
import {
  CLAVER_CLOUD_HOME,
  getHomePathForRol,
  resolvePostLoginPath,
} from "@/lib/auth/home-redirect"

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

  it("redirige analista_claver a Claver Cloud", () => {
    expect(getHomePathForRol("analista_claver")).toBe(CLAVER_CLOUD_HOME)
  })

  it("rol desconocido cae en dashboard", () => {
    expect(getHomePathForRol("unknown")).toBe("/dashboard")
  })
})

describe("resolvePostLoginPath", () => {
  it("respeta ?next= cuando es ruta interna", () => {
    expect(
      resolvePostLoginPath({ rol: "administrador", nextPath: "/dashboard/ventas", isAnalyst: true }),
    ).toBe("/dashboard/ventas")
  })

  it("envía analista a Cloud sin next", () => {
    expect(resolvePostLoginPath({ rol: "administrador", isAnalyst: true })).toBe(CLAVER_CLOUD_HOME)
  })

  it("envía cliente a dashboard por rol", () => {
    expect(resolvePostLoginPath({ rol: "cajero", isAnalyst: false })).toBe("/dashboard/pos")
  })

  it("ignora next inválido", () => {
    expect(
      resolvePostLoginPath({ rol: "gerente", nextPath: "//evil.com", isAnalyst: false }),
    ).toBe("/dashboard")
  })
})