import {
  PROTHEUS_INTROSPECTION_ENDPOINTS,
  PROTHEUS_SX_TABLES,
} from "./protheus-sx-meta"
import { testProtheusEndpoint, type ProtheusRestCredentials } from "./protheus-rest-client"
import {
  getDefaultProtheusSqlCreds,
  runProtheusSqlIntrospection,
  type ProtheusSqlCredentials,
} from "./protheus-sql-introspection"
import type { IntrospectionCanal, IntrospectionStepResult } from "./types"

export function getDefaultProtheusCreds(): ProtheusRestCredentials | null {
  const baseUrl = process.env.PROTHEUS_REST_URL?.trim()
  const user = process.env.PROTHEUS_REST_USER?.trim()
  const password = process.env.PROTHEUS_REST_PASSWORD?.trim()
  if (!baseUrl || !user || !password) return null
  return { baseUrl, user, password }
}

export { getDefaultProtheusSqlCreds }

export async function runProtheusRestIntrospection(
  creds: ProtheusRestCredentials,
  endpointIds?: string[],
): Promise<{ steps: IntrospectionStepResult[]; ok: boolean }> {
  const selected = endpointIds?.length
    ? PROTHEUS_INTROSPECTION_ENDPOINTS.filter((e) => endpointIds.includes(e.id))
    : PROTHEUS_INTROSPECTION_ENDPOINTS

  const steps: IntrospectionStepResult[] = []

  for (const ep of selected) {
    try {
      const result = await testProtheusEndpoint(creds, ep.path, ep.method)
      steps.push({
        id: ep.id,
        label: ep.label,
        path: ep.path,
        method: ep.method,
        ok: result.ok,
        status: result.status,
        ms: result.ms,
        sample: result.sample,
      })
    } catch (err) {
      steps.push({
        id: ep.id,
        label: ep.label,
        path: ep.path,
        method: ep.method,
        ok: false,
        status: 0,
        ms: 0,
        error: err instanceof Error ? err.message : "Error",
      })
    }
  }

  return { steps, ok: steps.some((s) => s.ok) }
}

/** @deprecated use runProtheusRestIntrospection */
export async function runProtheusIntrospection(
  creds: ProtheusRestCredentials,
  endpointIds?: string[],
) {
  const result = await runProtheusRestIntrospection(creds, endpointIds)
  return { sxTables: PROTHEUS_SX_TABLES, ...result }
}

export async function runFullProtheusIntrospection(opts: {
  canal: IntrospectionCanal
  rest?: ProtheusRestCredentials
  sql?: ProtheusSqlCredentials
  endpointIds?: string[]
}) {
  const steps: IntrospectionStepResult[] = []
  const tables: string[] = []

  if (opts.canal === "rest" || opts.canal === "hybrid") {
    if (!opts.rest?.baseUrl || !opts.rest.user || !opts.rest.password) {
      steps.push({
        id: "rest_config",
        label: "REST — configuración",
        path: "rest",
        method: "REST",
        ok: false,
        status: 0,
        ms: 0,
        error: "Faltan URL REST, usuario o contraseña",
      })
    } else {
      const rest = await runProtheusRestIntrospection(opts.rest, opts.endpointIds)
      steps.push(...rest.steps)
      const tablesStep = rest.steps.find((s) => s.id === "tables" || s.id === "dictionary")
      if (tablesStep?.sample) {
        tables.push(...extractTableNamesFromSample(tablesStep.sample))
      }
    }
  }

  if (opts.canal === "sql" || opts.canal === "hybrid") {
    if (!opts.sql?.server || !opts.sql.database || !opts.sql.user || !opts.sql.password) {
      steps.push({
        id: "sql_config",
        label: "SQL — configuración",
        path: "sql",
        method: "SQL",
        ok: false,
        status: 0,
        ms: 0,
        error: "Faltan servidor SQL, base, usuario o contraseña",
      })
    } else {
      const sql = await runProtheusSqlIntrospection(opts.sql)
      steps.push(...sql.steps)
      tables.push(...sql.tables)
    }
  }

  const uniqueTables = [...new Set(tables)].sort()

  return {
    sxTables: PROTHEUS_SX_TABLES,
    steps,
    ok: steps.some((s) => s.ok),
    discoveredTables: uniqueTables,
    canal: opts.canal,
  }
}

export function extractTableNamesFromSample(sample: unknown): string[] {
  if (!sample) return []
  const names = new Set<string>()

  const visit = (obj: unknown) => {
    if (!obj || typeof obj !== "object") return
    if (Array.isArray(obj)) {
      obj.forEach(visit)
      return
    }
    const rec = obj as Record<string, unknown>
    for (const [k, v] of Object.entries(rec)) {
      const kl = k.toLowerCase()
      if (
        (kl.includes("table") || kl.includes("tabla") || kl === "name" || kl === "id") &&
        typeof v === "string" &&
        /^[A-Z]{2,3}\d?$/i.test(v.trim())
      ) {
        names.add(v.trim().toUpperCase())
      }
      if (typeof v === "object") visit(v)
    }
  }

  visit(sample)
  return [...names].sort()
}