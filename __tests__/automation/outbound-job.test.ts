import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { buildSignedEnvelope } from "@/lib/automation/sign-payload"

describe("executeOutboundWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it("registra ejecución ok en fetch exitoso", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "ok",
    } as Response)
    vi.mocked(prisma.automationExecution.create).mockResolvedValue({ id: 1n } as never)

    const envelope = buildSignedEnvelope(1, "WEBHOOK_TEST", { ping: true }, "secret-key-32chars-minimum-test!!")
    const { executeOutboundWebhook } = await import("@/lib/automation/outbound-job")

    await executeOutboundWebhook({
      empresaId: 1,
      eventKey: "WEBHOOK_TEST",
      webhookUrl: "https://n8n.test/hook",
      envelope,
    })

    expect(prisma.automationExecution.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "ok", direction: "outbound" }),
      })
    )
  })

  it("lanza error si HTTP no es ok (para retry BullMQ)", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "error",
    } as Response)
    vi.mocked(prisma.automationExecution.create).mockResolvedValue({ id: 1n } as never)

    const envelope = buildSignedEnvelope(1, "WEBHOOK_TEST", {}, "secret-key-32chars-minimum-test!!")
    const { executeOutboundWebhook } = await import("@/lib/automation/outbound-job")

    await expect(
      executeOutboundWebhook({
        empresaId: 1,
        eventKey: "WEBHOOK_TEST",
        webhookUrl: "https://n8n.test/hook",
        envelope,
      })
    ).rejects.toThrow("HTTP 500")
  })
})