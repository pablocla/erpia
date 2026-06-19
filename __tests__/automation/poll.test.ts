import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/platform/entitlements", () => ({
  requireAutomationEntitlement: vi.fn().mockResolvedValue({ ok: true, sku: "automation.n8n_hub" }),
}))

import {
  enqueuePollEvent,
  fetchPendingPollEvents,
  acknowledgePollEvents,
  clearPollMemoryForTests,
} from "@/lib/automation/poll-buffer"

describe("poll buffer", () => {
  beforeEach(() => {
    clearPollMemoryForTests()
    vi.clearAllMocks()
  })

  it("encola y devuelve eventos pendientes", async () => {
    const envelope = {
      eventId: "e1",
      event: "VENTA_EMITIDA",
      empresaId: 1,
      timestamp: new Date().toISOString(),
      data: { total: 100 },
      signature: "sig",
    }

    await enqueuePollEvent(1, "VENTA_EMITIDA", envelope)
    const { events, hasMore } = await fetchPendingPollEvents(1, 10)

    expect(events.length).toBe(1)
    expect(events[0].eventKey).toBe("VENTA_EMITIDA")
    expect(hasMore).toBe(false)
  })

  it("ack elimina eventos de memoria", async () => {
    const envelope = {
      eventId: "e2",
      event: "STOCK_BAJO",
      empresaId: 2,
      timestamp: new Date().toISOString(),
      data: {},
      signature: "sig",
    }
    await enqueuePollEvent(2, "STOCK_BAJO", envelope)
    const pending = await fetchPendingPollEvents(2)
    const acked = await acknowledgePollEvents(2, [pending.events[0].id])
    expect(acked).toBeGreaterThan(0)

    const after = await fetchPendingPollEvents(2)
    expect(after.events.length).toBe(0)
  })
})

describe("GET /api/automation/poll", () => {
  beforeEach(() => {
    clearPollMemoryForTests()
    vi.clearAllMocks()
  })

  it("rechaza sin headers de auth", async () => {
    const { GET } = await import("@/app/api/automation/poll/route")
    const req = new NextRequest("http://localhost/api/automation/poll")
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it("devuelve eventos con API key válida", async () => {
    vi.mocked(prisma.automationConfig.findUnique).mockResolvedValue({
      id: 1,
      empresaId: 5,
      n8nApiKeyEnc: Buffer.from("test-key").toString("base64"),
    } as never)
    vi.mocked(prisma.automationPollQueue.findMany).mockResolvedValue([])

    const envelope = {
      eventId: "e3",
      event: "WEBHOOK_TEST",
      empresaId: 5,
      timestamp: new Date().toISOString(),
      data: { ping: true },
      signature: "sig",
    }
    await enqueuePollEvent(5, "WEBHOOK_TEST", envelope)

    const { GET } = await import("@/app/api/automation/poll/route")
    const req = new NextRequest("http://localhost/api/automation/poll?limit=10", {
      headers: {
        "x-nop-api-key": "test-key",
        "x-nop-empresa-id": "5",
      },
    })
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(json.count).toBe(1)
    expect(json.events[0].eventKey).toBe("WEBHOOK_TEST")
  })
})