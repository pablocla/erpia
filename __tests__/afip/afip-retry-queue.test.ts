import { describe, it, expect } from "vitest"
import { afipRetryDelayMs } from "@/lib/afip/afip-retry-queue"

describe("afipRetryDelayMs", () => {
  it("backoff 1m, 5m, 15m, 1h, 2h", () => {
    expect(afipRetryDelayMs(0)).toBe(60_000)
    expect(afipRetryDelayMs(1)).toBe(5 * 60_000)
    expect(afipRetryDelayMs(2)).toBe(15 * 60_000)
    expect(afipRetryDelayMs(3)).toBe(60 * 60_000)
    expect(afipRetryDelayMs(4)).toBe(2 * 60 * 60_000)
    expect(afipRetryDelayMs(99)).toBe(2 * 60 * 60_000)
  })
})
