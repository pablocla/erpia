import { describe, expect, it } from "vitest"
import { PROTHEUS_LEGACY_SIMULATED_MS } from "@/lib/legacy-bridge/adapters/protheus-demo"

describe("demo-benchmark constants", () => {
  it("simula latencia legacy realista para demo comercial", () => {
    expect(PROTHEUS_LEGACY_SIMULATED_MS).toBeGreaterThanOrEqual(5_000)
    expect(PROTHEUS_LEGACY_SIMULATED_MS).toBeLessThanOrEqual(15_000)
  })
})