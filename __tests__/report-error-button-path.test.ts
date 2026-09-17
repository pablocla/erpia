import { describe, expect, it } from "vitest"
import { isMarketingLandingPath } from "@/components/report-error-button"

describe("isMarketingLandingPath", () => {
  it("no trata el dashboard Protheus como landing", () => {
    expect(isMarketingLandingPath("/dashboard/protheus")).toBe(false)
    expect(isMarketingLandingPath("/dashboard")).toBe(false)
    expect(isMarketingLandingPath("/claver-cloud")).toBe(false)
  })

  it("oculta el FAB en landings públicas", () => {
    expect(isMarketingLandingPath("/")).toBe(true)
    expect(isMarketingLandingPath("/claver/protheus")).toBe(true)
    expect(isMarketingLandingPath("/login")).toBe(true)
  })
})
