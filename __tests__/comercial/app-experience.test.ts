import { describe, expect, it } from "vitest"
import {
  getFiadoExperience,
  getIndustryExperience,
  getNicheExperience,
} from "@/lib/comercial/app-experience"

describe("app-experience", () => {
  it("almacén incluye pasos de fiado", () => {
    const guide = getIndustryExperience("almacen")
    expect(guide?.title).toContain("Almacén")
    expect(guide?.steps).toHaveLength(3)
    expect(guide?.primaryAction?.href).toBe("/dashboard/fiado")
  })

  it("consorcios tiene pasos de liquidación", () => {
    const guide = getNicheExperience("consorcios")
    expect(guide?.steps[0]).toContain("consorcio")
  })

  it("fiado prestamista cambia título", () => {
    const guide = getFiadoExperience("prestamista")
    expect(guide.title).toContain("préstamos")
  })
})