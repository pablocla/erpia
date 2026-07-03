import { queryProtheusEntity } from "@/lib/opo/protheus-rest-client"
import { buildProtheusDemoManifest } from "@/lib/opo/protheus-demo"
import type { ErpDataAdapter, ErpQueryResult } from "../types"
import type { OpoTenantConfig } from "@/lib/opo/types"

function isRestDirectConfigured(config: OpoTenantConfig): boolean {
  return Boolean(
    config.restDirectUrl?.trim() &&
      config.restAuthUser?.trim() &&
      config.restAuthPassword?.trim() &&
      (config.accesoCanal === "rest_directo" || config.conector === "rest"),
  )
}

export const protheusRestAdapter: ErpDataAdapter = {
  adapterId: "protheus_rest_direct",
  erpLabel: "TOTVS Protheus (REST directo)",
  priority: 10,

  supports(config) {
    return config.origen === "protheus" && isRestDirectConfigured(config)
  },

  async getDiscovery(baseUrl) {
    return buildProtheusDemoManifest(baseUrl)
  },

  async query(_empresaId, input, config) {
    const mapping = config.entityMappings?.find((m) => m.entity === input.entity)
    if (!mapping?.lectura?.endpoint) {
      throw new Error(`Sin endpoint REST de lectura para ${input.entity}`)
    }

    const t0 = Date.now()
    const raw = await queryProtheusEntity(
      {
        baseUrl: config.restDirectUrl!,
        user: config.restAuthUser!,
        password: config.restAuthPassword!,
      },
      mapping,
      { limit: input.limit, search: input.search },
    )
    const latencyMs = Date.now() - t0

    return {
      entity: raw.entity as ErpQueryResult["entity"],
      source: raw.source as string,
      count: raw.count as number,
      data: (Array.isArray(raw.data) ? raw.data : [raw.data]) as Record<string, unknown>[],
      adapterId: "protheus_rest_direct",
      conector: raw.conector as string | undefined,
      nativeTable: raw.nativeTable as string | undefined,
      endpoint: raw.endpoint as string | undefined,
      latencyMs,
    }
  },
}