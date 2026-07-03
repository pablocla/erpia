import { getEmpresaNombre, getOpoConfig } from "@/lib/opo/opo-config-service"
import { resolveErpAdapter } from "./adapter-registry"
import type { ErpQueryResult, OpoQueryInput } from "./types"

export async function executeBridgeQuery(
  empresaId: number,
  input: OpoQueryInput,
): Promise<ErpQueryResult> {
  const config = await getOpoConfig(empresaId)
  if (!config.activo && config.modoErp !== "full") {
    throw new Error("Legacy Bridge no está activo para este tenant")
  }

  const adapter = resolveErpAdapter(config)
  return adapter.query(empresaId, input, config)
}

export async function getBridgeDiscovery(empresaId: number, requestOrigin: string) {
  const [config, orgName] = await Promise.all([
    getOpoConfig(empresaId),
    getEmpresaNombre(empresaId),
  ])
  const baseUrl = config.baseUrl?.trim() || requestOrigin
  const adapter = resolveErpAdapter(config)
  return {
    adapterId: adapter.adapterId,
    erpLabel: adapter.erpLabel,
    manifest: await adapter.getDiscovery(baseUrl, orgName, config),
  }
}