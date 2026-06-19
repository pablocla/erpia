import { describe, it, expect, vi, afterEach } from "vitest"
import { WhatsappService } from "@/lib/whatsapp/whatsapp-service"

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
  vi.restoreAllMocks()
})

describe("WhatsappService", () => {
  it("isConfigured false sin variables Twilio", () => {
    delete process.env.TWILIO_ACCOUNT_SID
    delete process.env.TWILIO_AUTH_TOKEN
    delete process.env.TWILIO_WHATSAPP_FROM
    expect(WhatsappService.isConfigured()).toBe(false)
  })

  it("sendMessage en dev mode no llama a Twilio", async () => {
    delete process.env.TWILIO_ACCOUNT_SID
    const fetchSpy = vi.spyOn(global, "fetch")
    const service = new WhatsappService()

    const result = await service.sendMessage("+5491112345678", "Hola cliente")

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(result).toMatchObject({ status: "queued", sid: "dev-mode" })
  })
})