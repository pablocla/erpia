/**
 * AI Configuration — Hardware-Optimized for RTX 5070 Ti (16GB VRAM) + 32GB RAM
 *
 * Strategy:
 * - ALL TIERS: Qwen 2.5 7B (~4.7GB) — fits comfortably in available memory
 * - CLOUD:     Anthropic claude-sonnet-4-20250514 — fallback if Ollama unavailable
 *
 * Current setup: Single model (qwen2.5:7b) for all tiers.
 * Fast, reliable, and fits in ~5GB memory. Good quality for ERP tasks.
 */

export interface AIModelConfig {
  id: string
  ollamaTag: string
  description: string
  vramMB: number
  tokensPerSec: number
  maxContextTokens: number
  /** "realtime" | "batch" | "nightly" */
  tier: "realtime" | "batch" | "nightly"
}

export const AI_MODELS: Record<string, AIModelConfig> = {
  fast: {
    id: "fast",
    ollamaTag: "qwen2.5:7b",
    description: "Qwen 2.5 7B — clasificación, alertas, notificaciones",
    vramMB: 5000,
    tokensPerSec: 35,
    maxContextTokens: 131072,
    tier: "realtime",
  },
  primary: {
    id: "primary",
    ollamaTag: "qwen2.5:7b",
    description: "Qwen 2.5 7B — análisis estructurado, generación JSON, reportes",
    vramMB: 5000,
    tokensPerSec: 35,
    maxContextTokens: 131072,
    tier: "batch",
  },
  heavy: {
    id: "heavy",
    ollamaTag: "qwen2.5:7b",
    description: "Qwen 2.5 7B — análisis profundo",
    vramMB: 5000,
    tokensPerSec: 35,
    maxContextTokens: 131072,
    tier: "nightly",
  },
  code: {
    id: "code",
    ollamaTag: "qwen2.5:7b",
    description: "Qwen 2.5 7B — generación de queries, fórmulas, expresiones",
    vramMB: 5000,
    tokensPerSec: 35,
    maxContextTokens: 131072,
    tier: "batch",
  },
}

export interface AIConfig {
  provider: "ollama" | "anthropic" | "auto"
  ollamaBaseUrl: string
  anthropicApiKey: string | null
  anthropicModel: string
  /** Model to use for each tier */
  modelByTier: Record<"realtime" | "batch" | "nightly", string>
  /** Max concurrent requests to Ollama */
  maxConcurrency: number
  /** Timeout per request in ms */
  timeoutMs: number
  /** Enable AI features globally */
  enabled: boolean
  /** Max tokens to generate per response */
  maxTokens: number
  /** LLM temperature (0-1). Lower = more deterministic. */
  temperature: number
  /** Context cache TTL in ms */
  contextCacheTtlMs: number
  /** Max alerts to generate per run */
  maxAlertas: number
  /** Max chat history pairs (user+assistant) sent to LLM */
  chatHistoryPairs: number
}

export function getAIConfig(): AIConfig {
  return {
    provider: (process.env.AI_PROVIDER as AIConfig["provider"]) || "auto",
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || null,
    anthropicModel: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
    modelByTier: {
      realtime: process.env.AI_MODEL_REALTIME || "fast",
      batch: process.env.AI_MODEL_BATCH || "primary",
      nightly: process.env.AI_MODEL_NIGHTLY || "heavy",
    },
    maxConcurrency: Number(process.env.AI_MAX_CONCURRENCY) || 2,
    timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 120_000,
    enabled: process.env.AI_ENABLED !== "false",
    maxTokens: Number(process.env.AI_MAX_TOKENS) || 4096,
    temperature: Number(process.env.AI_TEMPERATURE) || 0.3,
    contextCacheTtlMs: Number(process.env.AI_CONTEXT_CACHE_TTL_MS) || 60_000,
    maxAlertas: Number(process.env.AI_MAX_ALERTAS) || 8,
    chatHistoryPairs: Number(process.env.AI_CHAT_HISTORY_PAIRS) || 10,
  }
}

/** Hardware report for the /api/ai/status endpoint */
export interface HardwareReport {
  gpu: string
  vramTotal: string
  vramAvailable: string
  ramTotal: string
  modelsLoaded: string[]
  recommendedModel: string
  canRunHeavy: boolean
}

export const HARDWARE_PROFILE = {
  gpu: "NVIDIA RTX 5070 Ti",
  vramGB: 16,
  ramGB: 32,
  architecture: "Blackwell",
  cudaCompute: "10.0",
  fp16Tflops: 44.7,
  notes: [
    "GDDR7 — ~30% más bandwidth que GDDR6X, mejora inferencia de modelos grandes",
    "16GB VRAM permite Qwen 14B Q5 con contexto completo de 128K tokens",
    "Para 32B Q4 se necesita partial CPU offload (~6GB en RAM del sistema)",
    "Con NVLink no disponible en consumer, un solo modelo activo a la vez",
    "Ollama auto-gestiona VRAM: descarga modelo inactivo tras 5min de idle",
  ],
}
