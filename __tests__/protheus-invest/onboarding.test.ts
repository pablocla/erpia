import { describe, expect, it } from "vitest"
import { ANALISTA_STEPS, TESORERO_STEPS, maxStepForPerfil } from "@/lib/protheus-invest/onboarding"

describe("onboarding Protheus", () => {
  it("el analista tiene más pasos (PRW + REST) que el tesorero", () => {
    expect(maxStepForPerfil("analista")).toBe(ANALISTA_STEPS.length)
    expect(maxStepForPerfil("tesorero")).toBe(TESORERO_STEPS.length)
    expect(ANALISTA_STEPS[0].title).toMatch(/Bajar/i)
    expect(TESORERO_STEPS.at(-1)?.title).toMatch(/cartera/i)
  })
})
