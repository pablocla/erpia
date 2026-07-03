import { describe, expect, it, vi, beforeEach } from "vitest"

vi.mock("@/lib/opo/claver-adapter", () => ({
  queryClaverEntity: vi.fn().mockResolvedValue({
    count: 12,
    data: [{ id: "1", legalName: "Cliente Demo" }],
  }),
}))

vi.mock("@/lib/legacy-bridge/query-service", () => ({
  executeBridgeQuery: vi.fn().mockResolvedValue({
    adapterId: "protheus_demo",
    count: 12,
    data: [{ id: "1", legalName: "Cliente Legacy" }],
  }),
}))

import { runLegacyVsClaverBenchmark } from "@/lib/legacy-bridge/demo-benchmark"

describe("runLegacyVsClaverBenchmark", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retorna comparativa claver vs legacy con speedup", async () => {
    const result = await runLegacyVsClaverBenchmark(1, "Customer", {
      skipLegacyDelay: true,
      legacySimulatedMs: 8000,
    })

    expect(result.entity).toBe("Customer")
    expect(result.claver.adapterId).toBe("claver_native")
    expect(result.legacy.adapterId).toBe("protheus_demo")
    expect(result.legacy.latencyMs).toBe(8000)
    expect(result.speedupFactor).toBeGreaterThan(1)
    expect(result.narrative).toContain("ms")
  })
})