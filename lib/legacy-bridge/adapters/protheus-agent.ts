import { buildProtheusDemoManifest } from "@/lib/opo/protheus-demo"
import {
  fetchRemoteDiscovery,
  isRemoteAgentConfigured,
  queryRemoteAgent,
} from "@/lib/opo/remote-agent"
import type { ErpDataAdapter, ErpQueryResult } from "../types"
import type { OpoCanonicalEntity } from "@/lib/opo/types"

export const protheusAgentAdapter: ErpDataAdapter = {
  adapterId: "protheus_edge_agent",
  erpLabel: "TOTVS Protheus (OPO Edge Agent)",
  priority: 20,

  supports(config) {
    return config.origen === "protheus" && isRemoteAgentConfigured(config)
  },

  async getDiscovery(baseUrl, _orgName, config) {
    try {
      return await fetchRemoteDiscovery(config)
    } catch {
      return buildProtheusDemoManifest(baseUrl)
    }
  },

  async query(_empresaId, input, config) {
    const t0 = Date.now()
    const raw = await queryRemoteAgent(config, input)
    const latencyMs = Date.now() - t0

    const payload = raw as {
      entity?: string
      source?: string
      count?: number
      data?: Record<string, unknown>[]
      conector?: string
    }

    return {
      entity: (payload.entity ?? input.entity) as OpoCanonicalEntity,
      source: payload.source ?? "protheus_edge_agent",
      count: payload.count ?? payload.data?.length ?? 0,
      data: payload.data ?? [],
      adapterId: "protheus_edge_agent",
      conector: payload.conector ?? config.conector,
      latencyMs,
    }
  },
}