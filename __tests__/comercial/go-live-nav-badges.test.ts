import { describe, it, expect } from "vitest"
import {
  resolveHrefGoLiveTier,
  goLiveBadgeForHref,
  shouldHideHrefForGoLive,
} from "@/lib/comercial/go-live-nav-badges"

describe("go-live-nav-badges", () => {
  it("fiado y pos son PRD (sin badge ruidoso)", () => {
    expect(resolveHrefGoLiveTier("/dashboard/fiado")).toBe("prd")
    expect(resolveHrefGoLiveTier("/dashboard/pos")).toBe("prd")
    expect(goLiveBadgeForHref("/dashboard/fiado")).toBeNull()
  })

  it("veterinaria / HC son piloto", () => {
    expect(resolveHrefGoLiveTier("/dashboard/veterinaria")).toBe("piloto")
    expect(goLiveBadgeForHref("/dashboard/historia-clinica")?.label).toBe("Piloto")
  })

  it("agro y prestamos son demo", () => {
    expect(resolveHrefGoLiveTier("/dashboard/agro/balanza")).toBe("demo")
    expect(goLiveBadgeForHref("/dashboard/prestamos")?.label).toBe("Demo")
  })

  it("no oculta prd ni piloto por default", () => {
    expect(shouldHideHrefForGoLive("/dashboard/pos")).toBe(false)
    expect(shouldHideHrefForGoLive("/dashboard/agenda")).toBe(false)
  })
})
