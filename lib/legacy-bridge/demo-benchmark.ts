import { queryClaverEntity } from "@/lib/opo/claver-adapter"
import { PROTHEUS_LEGACY_SIMULATED_MS } from "./adapters/protheus-demo"
import { executeBridgeQuery } from "./query-service"
import type { LegacyVsClaverBenchmark, OpoCanonicalEntity } from "./types"

export interface BenchmarkOptions {
  /** Si true, no espera la latencia simulada de legacy (útil en tests) */
  skipLegacyDelay?: boolean
  legacySimulatedMs?: number
}

/**
 * Demo comercial: Protheus WebApp lento vs Claver Edge UI rápido.
 * El lado "legacy" usa latencia simulada + datos del adaptador activo del tenant.
 */
export async function runLegacyVsClaverBenchmark(
  empresaId: number,
  entity: OpoCanonicalEntity = "Customer",
  opts?: BenchmarkOptions,
): Promise<LegacyVsClaverBenchmark> {
  const legacyMs = opts?.legacySimulatedMs ?? PROTHEUS_LEGACY_SIMULATED_MS

  const claverT0 = Date.now()
  const claverRaw = await queryClaverEntity(empresaId, { entity, limit: 5 })
  const claverLatency = Date.now() - claverT0

  if (!opts?.skipLegacyDelay) {
    await delay(Math.min(legacyMs, 1_500))
  }

  const legacyResult = await executeBridgeQuery(empresaId, { entity, limit: 5 })

  const speedup = claverLatency > 0 ? Math.round(legacyMs / claverLatency) : legacyMs

  return {
    entity,
    legacy: {
      label: "Protheus WebApp (simulado)",
      adapterId: legacyResult.adapterId,
      latencyMs: legacyMs,
      count: legacyResult.count,
      sample: legacyResult.data.slice(0, 2),
    },
    claver: {
      label: "Claver Edge UI",
      adapterId: "claver_native",
      latencyMs: claverLatency,
      count: claverRaw.count,
      sample: (claverRaw.data as Record<string, unknown>[]).slice(0, 2),
    },
    speedupFactor: speedup,
    narrative: `Claver respondió en ${claverLatency}ms vs ~${legacyMs}ms del WebApp legacy (${speedup}× más rápido)`,
    measuredAt: new Date().toISOString(),
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}