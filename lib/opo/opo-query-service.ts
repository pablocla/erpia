import { queryClavisEntity, buildClavisDiscoveryManifest } from "./clavis-adapter"
import {
  buildProtheusDemoManifest,
  PROTHEUS_DEMO_CUSTOMERS,
  PROTHEUS_DEMO_INVOICES,
  PROTHEUS_DEMO_PRODUCTS,
} from "./protheus-demo"
import { getEmpresaNombre, getOpoConfig } from "./opo-config-service"
import { queryProtheusEntity } from "./protheus-rest-client"
import { fetchRemoteDiscovery, isRemoteAgentConfigured, queryRemoteAgent } from "./remote-agent"
import type { OpoCanonicalEntity, OpoQueryInput } from "./types"

function isRestDirectConfigured(config: Awaited<ReturnType<typeof getOpoConfig>>): boolean {
  return Boolean(
    config.restDirectUrl?.trim() &&
      config.restAuthUser?.trim() &&
      config.restAuthPassword?.trim() &&
      (config.accesoCanal === "rest_directo" || config.conector === "rest"),
  )
}

function filterDemo<T extends Record<string, unknown>>(rows: T[], search?: string) {
  if (!search?.trim()) return rows
  const q = search.toLowerCase()
  return rows.filter((row) =>
    Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(q)),
  )
}

export async function getOpoDiscovery(empresaId: number, requestOrigin: string) {
  const [config, orgName] = await Promise.all([getOpoConfig(empresaId), getEmpresaNombre(empresaId)])
  const baseUrl = config.baseUrl?.trim() || requestOrigin

  if (config.origen === "protheus") {
    if (isRemoteAgentConfigured(config)) {
      try {
        return await fetchRemoteDiscovery(config)
      } catch {
        return buildProtheusDemoManifest(baseUrl)
      }
    }
    return buildProtheusDemoManifest(baseUrl)
  }
  return buildClavisDiscoveryManifest(baseUrl, orgName)
}

export async function executeOpoQuery(empresaId: number, input: OpoQueryInput) {
  const config = await getOpoConfig(empresaId)
  if (!config.activo) {
    throw new Error("OPO Studio no está activo para este tenant")
  }

  if (config.origen === "clavis_db") {
    return queryClavisEntity(empresaId, input)
  }

  if (isRestDirectConfigured(config)) {
    const mapping = config.entityMappings?.find((m) => m.entity === input.entity)
    if (mapping?.lectura?.endpoint) {
      return queryProtheusEntity(
        {
          baseUrl: config.restDirectUrl!,
          user: config.restAuthUser!,
          password: config.restAuthPassword!,
        },
        mapping,
        { limit: input.limit, search: input.search },
      )
    }
  }

  if (isRemoteAgentConfigured(config)) {
    return queryRemoteAgent(config, input)
  }

  const limit = Math.min(input.limit ?? 10, 50)
  const entity = input.entity as OpoCanonicalEntity

  const demoData: Record<OpoCanonicalEntity, Record<string, unknown>[]> = {
    Customer: filterDemo(PROTHEUS_DEMO_CUSTOMERS, input.search).slice(0, limit),
    Product: filterDemo(PROTHEUS_DEMO_PRODUCTS, input.search).slice(0, limit),
    Invoice: filterDemo(PROTHEUS_DEMO_INVOICES, input.search).slice(0, limit),
    Order: [],
    Supplier: [],
  }

  return {
    entity,
    source: "protheus_demo",
    conector: config.conector,
    count: demoData[entity]?.length ?? 0,
    data: demoData[entity] ?? [],
    note:
      config.conector === "sql"
        ? `Vista SQL sugerida: ${config.sqlViewPrefix ?? "vw_opo_"}${entity.toLowerCase()}`
        : undefined,
  }
}