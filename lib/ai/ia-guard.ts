import { prisma } from "@/lib/prisma"
import { getAIConfig } from "./ai-config"

/**
 * Check if the IA module is active for a specific empresa.
 *
 * Two levels of kill switch:
 * 1. GLOBAL: env var AI_ENABLED=false → disables for ALL empresas
 * 2. PER-EMPRESA: ConfiguracionModulo where modulo="ia" and habilitado=false
 *
 * If the empresa has no row in ConfiguracionModulo for "ia", defaults to TRUE
 * (enabled by default, can be explicitly disabled from Configuración > Módulos).
 */
export async function isIAEnabled(empresaId: number): Promise<boolean> {
  // Global kill switch
  const config = getAIConfig()
  if (!config.enabled) return false

  // Per-empresa toggle (default true — enabled unless explicitly disabled)
  const row = await prisma.configuracionModulo.findUnique({
    where: { empresaId_modulo: { empresaId, modulo: "ia" } },
    select: { habilitado: true },
  })

  return row?.habilitado ?? true
}
