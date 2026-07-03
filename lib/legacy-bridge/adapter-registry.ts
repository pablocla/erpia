import { claverNativeAdapter } from "./adapters/claver-native"
import { protheusAgentAdapter } from "./adapters/protheus-agent"
import { protheusDemoAdapter } from "./adapters/protheus-demo"
import { protheusRestAdapter } from "./adapters/protheus-rest"
import type { ErpAdapterId, ErpDataAdapter } from "./types"
import type { OpoTenantConfig } from "@/lib/opo/types"

/** Adaptadores registrados — ordenados por prioridad al resolver */
export const ERP_ADAPTERS: readonly ErpDataAdapter[] = [
  claverNativeAdapter,
  protheusRestAdapter,
  protheusAgentAdapter,
  protheusDemoAdapter,
]

export function resolveErpAdapter(config: OpoTenantConfig): ErpDataAdapter {
  const sorted = [...ERP_ADAPTERS].sort((a, b) => a.priority - b.priority)
  const match = sorted.find((adapter) => adapter.supports(config))
  if (!match) {
    throw new Error("Sin adaptador ERP configurado para este tenant")
  }
  return match
}

export function getAdapterById(id: ErpAdapterId): ErpDataAdapter | undefined {
  return ERP_ADAPTERS.find((a) => a.adapterId === id)
}

export function listSupportedAdapters(config: OpoTenantConfig): ErpDataAdapter[] {
  return ERP_ADAPTERS.filter((a) => a.supports(config)).sort((a, b) => a.priority - b.priority)
}