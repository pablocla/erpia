import { isRemoteAgentConfigured, pingRemoteAgent } from "./remote-agent"
import {
  findServicesForEntity,
  listProtheusServices,
  testProtheusEndpoint,
  type ProtheusRestCredentials,
} from "./protheus-rest-client"
import type { LegacyBridgeTestResult, OpoTenantConfig } from "./types"

export async function runLegacyBridgeTest(
  config: OpoTenantConfig,
): Promise<LegacyBridgeTestResult> {
  const testedAt = new Date().toISOString()
  const steps: LegacyBridgeTestResult["steps"] = []

  if (config.modoErp === "full" || config.origen === "clavis_db") {
    return {
      ok: true,
      steps: [{ id: "native", label: "ERP nativo Clavis — sin bridge legacy", ok: true }],
      testedAt,
    }
  }

  const canal = config.accesoCanal ?? (config.conector === "sql" ? "sql_vistas" : "rest_directo")

  if (canal === "edge_agent" || (isRemoteAgentConfigured(config) && !config.restDirectUrl)) {
    const t0 = Date.now()
    try {
      const health = await pingRemoteAgent(config)
      steps.push({
        id: "agent_ping",
        label: "Ping OPO Edge Agent",
        ok: true,
        ms: Date.now() - t0,
        detail: `Agente en ${config.baseUrl}`,
        sample: health,
      })
    } catch (err) {
      steps.push({
        id: "agent_ping",
        label: "Ping OPO Edge Agent",
        ok: false,
        ms: Date.now() - t0,
        detail: err instanceof Error ? err.message : "Sin conexión",
      })
      return { ok: false, steps, testedAt }
    }
  }

  if (canal === "sql_vistas") {
    const prefix = config.sqlViewPrefix ?? "vw_opo_"
    const modo = config.sqlModo ?? "direct"
    steps.push({
      id: "sql_views",
      label: modo === "direct" ? "Vistas SQL directas" : "Vistas SQL vía REST",
      ok: true,
      detail:
        modo === "direct"
          ? `Lectura sobre ${prefix}customer, ${prefix}product… (agente o linked server)`
          : `REST AdvPL expone vistas cuando la BD no permite CREATE VIEW`,
    })
  }

  if (config.restDirectUrl && config.restAuthUser && config.restAuthPassword) {
    const creds: ProtheusRestCredentials = {
      baseUrl: config.restDirectUrl,
      user: config.restAuthUser,
      password: config.restAuthPassword,
    }

    let servicesCount = 0
    const tDiscovery = Date.now()
    try {
      const services = await listProtheusServices(creds)
      servicesCount = services.length
      steps.push({
        id: "rest_discovery",
        label: "Discovery REST Protheus",
        ok: true,
        ms: Date.now() - tDiscovery,
        detail: `${servicesCount} servicios activos`,
      })

      const customerMapping = config.entityMappings?.find((m) => m.entity === "Customer")
      const productMapping = config.entityMappings?.find((m) => m.entity === "Product")

      for (const mapping of [customerMapping, productMapping].filter(Boolean)) {
        const m = mapping!
        if (!m.lectura?.endpoint) continue
        const tRead = Date.now()
        try {
          const read = await testProtheusEndpoint(creds, m.lectura.endpoint, m.lectura.method)
          steps.push({
            id: `read_${m.entity}`,
            label: `Lectura ${m.entity} (${m.lectura.method} ${m.lectura.endpoint})`,
            ok: read.ok,
            ms: read.ms,
            detail: read.ok ? `HTTP ${read.status}` : `HTTP ${read.status}`,
            sample: read.sample,
          })
        } catch (err) {
          steps.push({
            id: `read_${m.entity}`,
            label: `Lectura ${m.entity}`,
            ok: false,
            ms: Date.now() - tRead,
            detail: err instanceof Error ? err.message : "Error",
          })
        }
      }

      if (!customerMapping?.lectura?.endpoint) {
        const suggestions = findServicesForEntity(services, "Customer").slice(0, 3)
        steps.push({
          id: "suggest_customer",
          label: "Sugerencias endpoints Customer",
          ok: suggestions.length > 0,
          detail: suggestions.map((s) => s.endpoint).join(", ") || "Sin coincidencias",
        })
      }
    } catch (err) {
      steps.push({
        id: "rest_discovery",
        label: "Discovery REST Protheus",
        ok: false,
        ms: Date.now() - tDiscovery,
        detail: err instanceof Error ? err.message : "Error de conexión",
      })
    }

    return {
      ok: steps.every((s) => s.ok),
      steps,
      servicesCount,
      testedAt,
    }
  }

  if (canal === "sql_vistas" && !config.restDirectUrl) {
    return {
      ok: steps.every((s) => s.ok),
      steps,
      testedAt,
    }
  }

  if (steps.length === 0) {
    steps.push({
      id: "config",
      label: "Configuración incompleta",
      ok: false,
      detail: "Completá URL REST directa + credenciales, o URL del Edge Agent",
    })
  }

  return { ok: steps.every((s) => s.ok), steps, testedAt }
}