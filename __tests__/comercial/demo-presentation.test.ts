import { describe, it, expect } from "vitest"
import {
  getDemoPresentationPaths,
  isPathAllowedInDemoPresentation,
  appendPresentQuery,
} from "@/lib/comercial/demo-presentation"

describe("demo-presentation", () => {
  it("incluye golden path y labels del rubro", () => {
    const paths = getDemoPresentationPaths("almacen")
    expect(paths).toContain("/dashboard/fiado")
    expect(paths).toContain("/dashboard")
  })

  it("filtra rutas fuera del foco en modo presentación", () => {
    expect(isPathAllowedInDemoPresentation("/dashboard/fiado", "almacen")).toBe(true)
    expect(isPathAllowedInDemoPresentation("/dashboard/contabilidad", "almacen")).toBe(false)
    expect(isPathAllowedInDemoPresentation("/dashboard/hospitalidad", "bar_restaurant")).toBe(true)
  })

  it("agrega query present=1 al redirect", () => {
    expect(appendPresentQuery("/dashboard/fiado", true)).toBe("/dashboard/fiado?present=1")
    expect(appendPresentQuery("/dashboard/fiado", false)).toBe("/dashboard/fiado")
  })
})