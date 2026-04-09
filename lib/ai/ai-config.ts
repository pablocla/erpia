/**
 * AI Configuration — Hardware-Optimized for RTX 5070 Ti (16GB VRAM) + 32GB RAM
 *
 * Strategy:
 * - PRIMARY: Qwen 3.5 27B (~16GB VRAM) — high quality analysis, JSON generation, chat
 * - FAST:    Qwen 3.5 27B (~16GB VRAM) — same model for all tiers (single model setup)
 * - HEAVY:   Qwen 3.5 27B (~16GB VRAM) — deep analysis
 * - CLOUD:   Anthropic claude-sonnet-4-20250514 — fallback if Ollama unavailable / critical tasks
 *
 * Current setup: Single model (qwen3.5:27b) for all tiers.
 * The 27B model fits in 16GB VRAM and provides excellent quality for ERP tasks.
 * For better realtime speed, add mistral:7b-instruct-v0.3-q4_K_M later.
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
    ollamaTag: "qwen3.5:27b",
    description: "Qwen 3.5 27B — clasificación, alertas, notificaciones",
    vramMB: 16000,
    tokensPerSec: 10,
    maxContextTokens: 131072,
    tier: "realtime",
  },
  primary: {
    id: "primary",
    ollamaTag: "qwen3.5:27b",
    description: "Qwen 3.5 27B — análisis estructurado, generación JSON, reportes",
    vramMB: 16000,
    tokensPerSec: 10,
    maxContextTokens: 131072,
    tier: "batch",
  },
  heavy: {
    id: "heavy",
    ollamaTag: "qwen3.5:27b",
    description: "Qwen 3.5 27B — análisis profundo",
    vramMB: 16000,
    tokensPerSec: 10,
    maxContextTokens: 131072,
    tier: "nightly",
  },
  code: {
    id: "code",
    ollamaTag: "qwen3.5:27b",
    description: "Qwen 3.5 27B — generación de queries, fórmulas, expresiones",
    vramMB: 16000,
    tokensPerSec: 10,
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
