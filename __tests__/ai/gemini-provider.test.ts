/**
 * Tests del provider Gemini en ai-service
 * No requiere API key real — fetch mockeado.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const ENV_KEYS = [
  "AI_PROVIDER",
  "AI_ENABLED",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "ANTHROPIC_API_KEY",
  "OLLAMA_BASE_URL",
] as const

describe("Gemini provider", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    ENV_KEYS.forEach(k => delete process.env[k])
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  describe("getAIConfig()", () => {
    it("lee GOOGLE_GENERATIVE_AI_API_KEY y GEMINI_MODEL", async () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key"
      process.env.GEMINI_MODEL = "gemini-flash-latest"
      process.env.AI_PROVIDER = "gemini"

      const { getAIConfig } = await import("@/lib/ai/ai-config")
      const c = getAIConfig()

      expect(c.provider).toBe("gemini")
      expect(c.geminiApiKey).toBe("test-key")
      expect(c.geminiModel).toBe("gemini-flash-latest")
    })

    it("acepta GEMINI_API_KEY como alias", async () => {
      process.env.GEMINI_API_KEY = "alias-key"

      const { getAIConfig } = await import("@/lib/ai/ai-config")
      expect(getAIConfig().geminiApiKey).toBe("alias-key")
    })
  })

  describe("aiService.isAvailable()", () => {
    it("reporta gemini cuando no hay Ollama y hay API key", async () => {
      process.env.AI_PROVIDER = "auto"
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key"
      process.env.GEMINI_MODEL = "gemini-2.0-flash"

      vi.mocked(fetch).mockRejectedValue(new Error("ollama offline"))

      const { aiService } = await import("@/lib/ai/ai-service")
      aiService.reload()

      const status = await aiService.isAvailable()
      expect(status).toEqual({
        available: true,
        provider: "gemini",
        model: "gemini-2.0-flash",
      })
    })

    it("respeta AI_PROVIDER=gemini explícito", async () => {
      process.env.AI_PROVIDER = "gemini"
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key"

      const { aiService } = await import("@/lib/ai/ai-service")
      aiService.reload()

      const status = await aiService.isAvailable()
      expect(status.provider).toBe("gemini")
      expect(status.available).toBe(true)
    })
  })

  describe("aiService.chat()", () => {
    it("llama a Gemini REST y parsea la respuesta", async () => {
      process.env.AI_PROVIDER = "gemini"
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key"
      process.env.GEMINI_MODEL = "gemini-2.0-flash"

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: "Hola desde Gemini" }] },
          }],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
        }),
      } as Response)

      const { aiService } = await import("@/lib/ai/ai-service")
      aiService.reload()

      const res = await aiService.chat([
        { role: "system", content: "Sos un asistente ERP" },
        { role: "user", content: "¿Cómo estoy?" },
      ])

      expect(res.provider).toBe("gemini")
      expect(res.content).toBe("Hola desde Gemini")
      expect(res.model).toBe("gemini-2.0-flash")
      expect(res.tokensUsed).toBe(15)

      const [url, opts] = vi.mocked(fetch).mock.calls[0]
      expect(url).toContain("gemini-2.0-flash:generateContent")
      expect((opts as RequestInit).headers).toMatchObject({
        "X-goog-api-key": "test-key",
      })

      const body = JSON.parse((opts as RequestInit).body as string)
      expect(body.systemInstruction).toEqual({ parts: [{ text: "Sos un asistente ERP" }] })
      expect(body.contents[0]).toEqual({ role: "user", parts: [{ text: "¿Cómo estoy?" }] })
    })

    it("hace fallback Ollama → Gemini cuando Ollama falla", async () => {
      process.env.AI_PROVIDER = "auto"
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key"

      // Ollama alive check
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response)
      // Ollama chat error
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false, text: async () => "error" } as Response)
      // Gemini success
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: "Fallback OK" }] } }],
        }),
      } as Response)

      const { aiService } = await import("@/lib/ai/ai-service")
      aiService.reload()

      const res = await aiService.chat([{ role: "user", content: "hola" }])
      expect(res.provider).toBe("gemini")
      expect(res.content).toBe("Fallback OK")
    })
  })
})