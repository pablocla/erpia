import { describe, it, expect, vi, afterEach } from "vitest"
import { TelegramService } from "@/lib/telegram/telegram-service"
import { buildTelegramLinkToken, verifyTelegramLinkToken } from "@/lib/telegram/telegram-vinculo"

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
  vi.restoreAllMocks()
})

describe("TelegramService", () => {
  it("isConfigured false sin token", () => {
    delete process.env.TELEGRAM_BOT_TOKEN
    expect(TelegramService.isConfigured()).toBe(false)
  })

  it("sendMessage en dev mode no llama a Telegram API", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN
    const fetchSpy = vi.spyOn(global, "fetch")
    const service = new TelegramService()

    const result = await service.sendMessage("12345", "Alerta de prueba")

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(result.ok).toBe(true)
  })
})

describe("telegram-vinculo", () => {
  it("genera y verifica token de vinculación", () => {
    process.env.TELEGRAM_LINK_SECRET = "test-secret"
    const token = buildTelegramLinkToken(1, 42)
    expect(token).toHaveLength(20)
    expect(verifyTelegramLinkToken(1, 42, token)).toBe(true)
    expect(verifyTelegramLinkToken(1, 43, token)).toBe(false)
  })
})