import { querySql } from "./sql.mjs"
import { queryRest } from "./rest.mjs"

const ENTITIES = new Set(["Customer", "Product", "Invoice", "Order", "Supplier"])

export function resolveEntitySource(config, entityName, entityConfig) {
  if (entityConfig?.source === "sql" || entityConfig?.source === "rest") {
    return entityConfig.source
  }
  if (config.routing === "sql") return "sql"
  if (config.routing === "rest") return "rest"
  if (entityConfig?.sql) return "sql"
  if (entityConfig?.path) return "rest"
  return config.sql.enabled ? "sql" : "rest"
}

export async function executeEntityQuery(config, input) {
  const entity = input.entity
  if (!ENTITIES.has(entity)) {
    throw new Error(`Entidad no soportada: ${entity}`)
  }

  const entityConfig = config.entities[entity]
  if (!entityConfig) {
    throw new Error(`Entidad no configurada: ${entity}`)
  }

  const limit = Math.min(Number(input.limit ?? 10), 100)
  const search = input.search ?? ""
  const source = resolveEntitySource(config, entity, entityConfig)

  let data = []
  if (source === "sql") {
    data = await querySql(config, entityConfig, { limit, search })
  } else {
    data = await queryRest(config, entityConfig, { limit, search })
  }

  return {
    entity,
    source: `protheus_${source}`,
    conector: source,
    nativeTable: entityConfig.nativeTable ?? null,
    routedBy: "opo-edge-agent",
    count: data.length,
    data,
  }
}

export function buildDiscovery(config, requestHost) {
  const base = `http://${requestHost}`
  const entities = Object.entries(config.entities).map(([name, cfg]) => ({
    canonical: `opo:${name}`,
    nativeReference: cfg.nativeTable ?? name,
    confidence: cfg.source === "sql" ? 0.95 : 0.9,
    route: resolveEntitySource(config, name, cfg),
  }))

  return {
    opo_version: "0.1.0",
    system_identity: {
      erp_name: config.erpName,
      version: config.erpVersion,
      jurisdictions: ["AR", "BR"],
      organization_name: config.organizationName,
    },
    adapter_configuration: {
      base_url: base,
      authentication_type: "ApiKey",
      protocol_interface: config.routing === "hybrid" ? "HYBRID" : config.routing.toUpperCase(),
    },
    routing: {
      mode: config.routing,
      sql_enabled: config.sql.enabled,
      rest_enabled: config.rest.enabled,
      table_suffix: config.tableSuffix,
    },
    endpoints: Object.fromEntries(
      Object.keys(config.entities).map((name) => [
        `opo:${name}`,
        { path: `/api/opo/entities/${name}`, methods: ["GET"] },
      ]),
    ),
    supported_entities: entities,
  }
}