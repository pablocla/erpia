import { type NextRequest, NextResponse } from "next/server"
import { aiService, getAIConfig, AI_MODELS, HARDWARE_PROFILE } from "@/lib/ai"
import { getIAConfigRubro, IA_POR_RUBRO } from "@/lib/ai"

/**
 * GET /api/ai/status — Health check + hardware report + available models
 */
export async function GET() {
  try {
    const config = getAIConfig()
    const availability = await aiService.isAvailable()
    const loadedModels = availability.provider === "ollama" ? await aiService.getLoadedModels() : []

    return NextResponse.json({
      success: true,
      ai: {
        enabled: config.enabled,
        available: availability.available,
        provider: availability.provider,
        activeModel: availability.model,
      },
      hardware: {
        ...HARDWARE_PROFILE,
        recommendedSetup: {
          realtime: AI_MODELS.fast,
          batch: AI_MODELS.primary,
          nightly: AI_MODELS.heavy,
        },
      },
      ollama: {
        baseUrl: config.ollamaBaseUrl,
        alive: availability.provider === "ollama",
        modelsLoaded: loadedModels,
        modelsConfigured: Object.values(AI_MODELS).map(m => ({
          id: m.id,
          tag: m.ollamaTag,
          vramMB: m.vramMB,
          tier: m.tier,
          description: m.description,
        })),
      },
      anthropic: {
        configured: !!config.anthropicApiKey,
        model: config.anthropicModel,
      },
      rubrosConIA: Object.keys(IA_POR_RUBRO).map(k => ({
        rubro: k,
        nombre: IA_POR_RUBRO[k].nombreRubro,
        featuresCount: IA_POR_RUBRO[k].features.length,
        top3: IA_POR_RUBRO[k].top3,
        horasAhorradasMes: IA_POR_RUBRO[k].horasAhorradasMes,
      })),
    })
  } catch (error) {
    console.error("[AI Status] Error:", error)
    return NextResponse.json({ error: "Error al obtener estado de IA" }, { status: 500 })
  }
}
