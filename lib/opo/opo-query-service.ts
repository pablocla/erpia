import { executeBridgeQuery, getBridgeDiscovery } from "@/lib/legacy-bridge/query-service"
import type { OpoQueryInput } from "./types"

export async function getOpoDiscovery(empresaId: number, requestOrigin: string) {
  const { manifest } = await getBridgeDiscovery(empresaId, requestOrigin)
  return manifest
}

export async function executeOpoQuery(empresaId: number, input: OpoQueryInput) {
  const result = await executeBridgeQuery(empresaId, input)
  const { latencyMs: _latencyMs, adapterId: _adapterId, ...payload } = result
  return payload
}