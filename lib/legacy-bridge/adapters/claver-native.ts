import { buildClaverDiscoveryManifest, queryClaverEntity } from "@/lib/opo/claver-adapter"
import type { ErpDataAdapter, ErpQueryResult } from "../types"

export const claverNativeAdapter: ErpDataAdapter = {
  adapterId: "claver_native",
  erpLabel: "Claver ERP (nativo)",
  priority: 0,

  supports(config) {
    return config.origen === "claver_db" || config.modoErp === "full"
  },

  async getDiscovery(baseUrl, orgName) {
    return buildClaverDiscoveryManifest(baseUrl, orgName)
  },

  async query(empresaId, input) {
    const t0 = Date.now()
    const raw = await queryClaverEntity(empresaId, input)
    return toResult(raw, Date.now() - t0)
  },
}

function toResult(
  raw: Awaited<ReturnType<typeof queryClaverEntity>>,
  latencyMs: number,
): ErpQueryResult {
  return {
    entity: raw.entity as ErpQueryResult["entity"],
    source: raw.source,
    count: raw.count,
    data: raw.data as Record<string, unknown>[],
    adapterId: "claver_native",
    latencyMs,
  }
}