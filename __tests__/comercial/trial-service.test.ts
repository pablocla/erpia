import { describe, it, expect } from "vitest"
import { formatTrialCountdown } from "@/lib/comercial/trial-service"

describe("trial-service", () => {
  it("formatTrialCountdown singular y plural", () => {
    expect(formatTrialCountdown(0)).toBe("Trial vencido")
    expect(formatTrialCountdown(1)).toBe("1 día restante")
    expect(formatTrialCountdown(14)).toBe("14 días restantes")
  })
})