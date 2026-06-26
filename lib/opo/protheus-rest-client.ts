import type { OpoEntityBridgeMapping, ProtheusRestService } from "./types"

const TIMEOUT_MS = 30_000
const DISCOVERY_PATH = "/tlpp/rest/list/service"

export interface ProtheusRestCredentials {
  baseUrl: string
  user: string
  password: string
}

function normalizeBase(url: string): string {
  return url.replace(/\/$/, "")
}

function authHeader(user: string, password: string): string {
  const token = Buffer.from(`${user}:${password}`).toString("base64")
  return `Basic ${token}`
}

async function protheusFetch(
  creds: ProtheusRestCredentials,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const base = normalizeBase(creds.baseUrl)
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`
  return fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: authHeader(creds.user, creds.password),
      ...(init?.headers as Record<string, string> | undefined),
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
}

export async function listProtheusServices(
  creds: ProtheusRestCredentials,
): Promise<ProtheusRestService[]> {
  const res = await protheusFetch(creds, DISCOVERY_PATH)
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Discovery REST falló (${res.status}): ${body.slice(0, 200)}`)
  }
  const json = await res.json()
  if (!Array.isArray(json)) throw new Error("Discovery no devolvió un array de servicios")
  return json as ProtheusRestService[]
}

export async function testProtheusEndpoint(
  creds: ProtheusRestCredentials,
  endpoint: string,
  method = "GET",
): Promise<{ ok: boolean; status: number; sample: unknown; ms: number }> {
  const start = Date.now()
  const res = await protheusFetch(creds, endpoint, { method })
  const ms = Date.now() - start
  const text = await res.text().catch(() => "")
  let sample: unknown = text.slice(0, 500)
  try {
    sample = JSON.parse(text)
    if (Array.isArray(sample) && sample.length > 3) {
      sample = sample.slice(0, 3)
    }
  } catch {
    // mantener texto truncado
  }
  return { ok: res.ok, status: res.status, sample, ms }
}

export function findServicesForEntity(
  services: ProtheusRestService[],
  entity: string,
): ProtheusRestService[] {
  const hints: Record<string, string[]> = {
    Customer: ["customer", "cliente", "sa1", "fin/v1/customer"],
    Product: ["product", "produto", "sb1", "acproduct"],
    Invoice: ["invoice", "factura", "sf2", "accountingentry", "nf"],
    Order: ["order", "pedido", "sc5", "salesorder"],
    Supplier: ["supplier", "proveedor", "sa2", "vendor"],
  }
  const keys = hints[entity] ?? [entity.toLowerCase()]
  return services.filter((s) =>
    keys.some((k) => s.endpoint.toLowerCase().includes(k)),
  )
}

export async function queryProtheusEntity(
  creds: ProtheusRestCredentials,
  mapping: OpoEntityBridgeMapping,
  opts?: { limit?: number; search?: string },
): Promise<Record<string, unknown>> {
  const lectura = mapping.lectura
  if (!lectura?.endpoint) {
    throw new Error(`Sin endpoint REST de lectura para ${mapping.entity}`)
  }

  const limit = Math.min(opts?.limit ?? 10, 50)
  const params = new URLSearchParams()
  if (opts?.search?.trim()) params.set("search", opts.search.trim())
  params.set("limit", String(limit))
  params.set("pageSize", String(limit))

  const qs = params.toString()
  const path = `${lectura.endpoint}${qs ? (lectura.endpoint.includes("?") ? "&" : "?") + qs : ""}`

  const result = await testProtheusEndpoint(creds, path, lectura.method)
  if (!result.ok) {
    throw new Error(`REST ${mapping.entity} respondió ${result.status}`)
  }

  const data = Array.isArray(result.sample)
    ? result.sample
    : result.sample && typeof result.sample === "object" && "items" in (result.sample as object)
      ? (result.sample as { items: unknown[] }).items
      : result.sample && typeof result.sample === "object" && "data" in (result.sample as object)
        ? (result.sample as { data: unknown[] }).data
        : [result.sample]

  return {
    entity: mapping.entity,
    source: "protheus_rest_direct",
    conector: "rest",
    nativeTable: mapping.nativeTable,
    endpoint: lectura.endpoint,
    count: Array.isArray(data) ? data.length : 1,
    data: Array.isArray(data) ? data.slice(0, limit) : data,
  }
}