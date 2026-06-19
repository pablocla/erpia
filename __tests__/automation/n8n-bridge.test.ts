import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/platform/entitlements", () => ({
  requireAutomationEntitlement: vi.fn().mockResolvedValue({ ok: true, sku: "automation.n8n_hub" }),
  trackAutomationUsage: vi.fn().mockResolvedValue(undefined),
}))

describe("emitToN8n", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn()
  })

  it("omite envío si automation inactivo", async () => {
    vi.mocked(prisma.automationConfig.findUnique).mockResolvedValue({
      id: 1,
      empresaId: 1,
      activo: false,
      webhookSecret: "sec",
      eventMaps: [],
    } as never)
    vi.mocked(prisma.automationExecution.create).mockResolvedValue({ id: 1n } as never)

    const { emitToN8n } = await import("@/lib/automation/n8n-bridge")
    const result = await emitToN8n(1, "VENTA_EMITIDA", { total: 500 })
    expect(result.sent).toBe(false)
    expect(result.reason).toBe("automation_inactive")
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("encola POST cuando mapa activo", async () => {
    vi.mocked(prisma.automationConfig.findUnique).mockResolvedValue({
      id: 1,
      empresaId: 1,
      activo: true,
      webhookSecret: "sec",
      eventMaps: [
        {
          eventKey: "WEBHOOK_TEST",
          n8nWebhookUrl: "https://n8n.test/webhook",
          activo: true,
        },
      ],
    } as never)
    vi.mocked(prisma.automationExecution.create).mockResolvedValue({ id: 1n } as never)
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "ok",
    } as Response)

    const { emitToN8n } = await import("@/lib/automation/n8n-bridge")
    const result = await emitToN8n(1, "WEBHOOK_TEST", { ping: true })
    expect(result.sent).toBe(true)

    await new Promise((r) => setTimeout(r, 50))
    expect(global.fetch).toHaveBeenCalledWith(
      "https://n8n.test/webhook",
      expect.objectContaining({ method: "POST" })
    )
  })
})