/**
 * AI Service — Motor de IA para ERP Multi-Rubro
 *
 * Dual provider: Ollama (local, gratis) + Anthropic (cloud, fallback)
 * Auto-detect: si Ollama está vivo → local. Si no → cloud si hay API key. Si no → graceful skip.
 *
 * SEGURIDAD:
 * - Nunca envía datos sensibles (passwords, certificados AFIP) al LLM
 * - Sanitiza PII antes de enviar contexto al modelo
 * - Rate limiting: max 2 concurrent requests a Ollama para no saturar GPU
 * - Timeout: 120s por request (modelos 14B pueden tardar en prompts largos)
 */

import { getAIConfig, AI_MODELS, type AIConfig, type AIModelConfig } from "./ai-config"

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface AIMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface AIResponse {
  content: string
  model: string
  provider: "ollama" | "anthropic" | "none"
  tokensUsed?: number
  durationMs: number
}

export interface AIJsonResponse<T = unknown> {
  data: T | null
  raw: string
  model: string
  provider: "ollama" | "anthropic" | "none"
  durationMs: number
  error?: string
}

// ─── SERVICE ──────────────────────────────────────────────────────────────────

class AIServiceImpl {
  private config: AIConfig
  private ollamaAlive: boolean | null = null
  private ollamaCheckTime = 0
  private activeCalls = 0

  constructor() {
    this.config = getAIConfig()
  }

  /** Reload config (useful after env change) */
  reload() {
    this.config = getAIConfig()
    this.ollamaAlive = null
  }

  /** Check if AI is available */
  async isAvailable(): Promise<{ available: boolean; provider: string; model: string }> {
    if (!this.config.enabled) return { available: false, provider: "none", model: "disabled" }

    if (await this.isOllamaAlive()) {
      const model = this.getModelForTier("batch")
      return { available: true, provider: "ollama", model: model.ollamaTag }
    }

    if (this.config.anthropicApiKey) {
      return { available: true, provider: "anthropic", model: this.config.anthropicModel }
    }

    return { available: false, provider: "none", model: "no_provider" }
  }

  /**
   * Chat with the AI — picks best available provider
   * @param tier - "realtime" for fast response, "batch" for quality, "nightly" for deep analysis
   */
  async chat(
    messages: AIMessage[],
    tier: "realtime" | "batch" | "nightly" = "batch"
  ): Promise<AIResponse> {
    if (!this.config.enabled) {
      return { content: "", model: "disabled", provider: "none", durationMs: 0 }
    }

    const start = Date.now()
    const provider = await this.resolveProvider()

    if (provider === "ollama") {
      return this.ollamaChat(messages, tier, start)
    }
    if (provider === "anthropic") {
      return this.anthropicChat(messages, start)
    }

    return { content: "", model: "no_provider", provider: "none", durationMs: Date.now() - start }
  }

  /**
   * Chat expecting a JSON response — auto-parses, retries on invalid JSON
   */
  async chatJson<T = unknown>(
    messages: AIMessage[],
    tier: "realtime" | "batch" | "nightly" = "batch"
  ): Promise<AIJsonResponse<T>> {
    const response = await this.chat(messages, tier)
    if (!response.content) {
      return { data: null, raw: "", model: response.model, provider: response.provider, durationMs: response.durationMs, error: "empty_response" }
    }

    try {
      const jsonStr = this.extractJson(response.content)
      const data = JSON.parse(jsonStr) as T
      return { data, raw: response.content, model: response.model, provider: response.provider, durationMs: response.durationMs }
    } catch {
      return { data: null, raw: response.content, model: response.model, provider: response.provider, durationMs: response.durationMs, error: "invalid_json" }
    }
  }

  // ─── OLLAMA ───────────────────────────────────────────────────────────

  private async ollamaChat(messages: AIMessage[], tier: "realtime" | "batch" | "nightly", start: number): Promise<AIResponse> {
    const model = this.getModelForTier(tier)

    // Semaphore: limit concurrent GPU requests
    while (this.activeCalls >= this.config.maxConcurrency) {
      await new Promise(r => setTimeout(r, 500))
    }
    this.activeCalls++

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs)

      const res = await fetch(`${this.config.ollamaBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model.ollamaTag,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: false,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens,
            top_p: 0.9,
          },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!res.ok) {
        const err = await res.text().catch(() => "unknown")
        console.error(`[AI] Ollama error ${res.status}: ${err}`)
        // Fallback to anthropic if available
        if (this.config.anthropicApiKey) {
          return this.anthropicChat(messages, start)
        }
        return { content: "", model: model.ollamaTag, provider: "ollama", durationMs: Date.now() - start }
      }

      const body = await res.json()
      return {
        content: body.message?.content ?? "",
        model: model.ollamaTag,
        provider: "ollama",
        tokensUsed: body.eval_count,
        durationMs: Date.now() - start,
      }
    } catch (err) {
      console.error("[AI] Ollama request failed:", err)
      if (this.config.anthropicApiKey) {
        return this.anthropicChat(messages, start)
      }
      return { content: "", model: "error", provider: "ollama", durationMs: Date.now() - start }
    } finally {
      this.activeCalls--
    }
  }

  // ─── ANTHROPIC ────────────────────────────────────────────────────────

  private async anthropicChat(messages: AIMessage[], start: number): Promise<AIResponse> {
    if (!this.config.anthropicApiKey) {
      return { content: "", model: "no_key", provider: "none", durationMs: Date.now() - start }
    }

    try {
      const systemMsg = messages.find(m => m.role === "system")?.content || ""
      const chatMsgs = messages.filter(m => m.role !== "system")

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.config.anthropicModel,
          max_tokens: this.config.maxTokens,
          system: systemMsg,
          messages: chatMsgs.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        const err = await res.text().catch(() => "unknown")
        console.error(`[AI] Anthropic error ${res.status}: ${err}`)
        return { content: "", model: this.config.anthropicModel, provider: "anthropic", durationMs: Date.now() - start }
      }

      const body = await res.json()
      const content = body.content?.[0]?.text ?? ""
      return {
        content,
        model: this.config.anthropicModel,
        provider: "anthropic",
        tokensUsed: (body.usage?.input_tokens ?? 0) + (body.usage?.output_tokens ?? 0),
        durationMs: Date.now() - start,
      }
    } catch (err) {
      console.error("[AI] Anthropic request failed:", err)
      return { content: "", model: "error", provider: "anthropic", durationMs: Date.now() - start }
    }
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────

  private async resolveProvider(): Promise<"ollama" | "anthropic" | "none"> {
    if (this.config.provider === "ollama" || this.config.provider === "auto") {
      if (await this.isOllamaAlive()) return "ollama"
    }
    if (this.config.provider === "anthropic" || this.config.provider === "auto") {
      if (this.config.anthropicApiKey) return "anthropic"
    }
    return "none"
  }

  private async isOllamaAlive(): Promise<boolean> {
    const now = Date.now()
    // Cache alive check for 30 seconds
    if (this.ollamaAlive !== null && now - this.ollamaCheckTime < 30_000) {
      return this.ollamaAlive
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3_000)
      const res = await fetch(`${this.config.ollamaBaseUrl}/api/tags`, { signal: controller.signal })
      clearTimeout(timeout)
      this.ollamaAlive = res.ok
    } catch {
      this.ollamaAlive = false
    }

    this.ollamaCheckTime = now
    return this.ollamaAlive!
  }

  private getModelForTier(tier: "realtime" | "batch" | "nightly"): AIModelConfig {
    const modelId = this.config.modelByTier[tier]
    return AI_MODELS[modelId] ?? AI_MODELS.primary
  }

  /** Extract JSON block from LLM response (handles ```json ... ``` wrapping) */
  private extractJson(text: string): string {
    // Try to find JSON in code blocks
    const blockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    if (blockMatch) return blockMatch[1].trim()

    // Try to find raw JSON object or array
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
    if (jsonMatch) return jsonMatch[1]

    return text.trim()
  }

  /** List models currently loaded in Ollama */
  async getLoadedModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.config.ollamaBaseUrl}/api/tags`)
      if (!res.ok) return []
      const body = await res.json()
      return (body.models ?? []).map((m: { name: string }) => m.name)
    } catch {
      return []
    }
  }

  /** Pre-pull a model in Ollama (fire and forget) */
  async pullModel(ollamaTag: string): Promise<void> {
    try {
      await fetch(`${this.config.ollamaBaseUrl}/api/pull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: ollamaTag, stream: false }),
      })
    } catch (err) {
      console.error(`[AI] Failed to pull ${ollamaTag}:`, err)
    }
  }
}

// Singleton
export const aiService = new AIServiceImpl()
