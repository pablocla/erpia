import { authFetch, getToken } from "@/lib/stores/auth-store"
import type { Asiento, Bank, Instrument, Investment, Valuacion } from "./seed"
import { isAllowedProtheusPath, loadRestConfig, type ProtheusRestConfig } from "./rest-config"

export type ProxyResult = {
  ok: boolean
  status: number
  ms: number
  body: unknown
  error?: string
}

export type TenantConnection = {
  empresaId: number
  empresaNombre: string
  rol: string
  canEdit: boolean
  configured: boolean
  baseUrl: string
  user: string
  hasPassword: boolean
  origen: string
  accesoCanal?: string
  loginPath?: string
  slug?: string
}

async function proxyCall(
  method: string,
  path: string,
  body?: unknown,
  demo?: ProtheusRestConfig | null,
): Promise<ProxyResult> {
  if (!isAllowedProtheusPath(path.split("?")[0] ?? path)) {
    return { ok: false, status: 400, ms: 0, body: null, error: "Path REST no permitido" }
  }

  if (getToken()) {
    const res = await authFetch("/api/protheus-invest/proxy", {
      method: "POST",
      body: JSON.stringify({ method, path, body: body ?? null }),
    })
    return (await res.json()) as ProxyResult
  }

  const cfg = demo ?? loadRestConfig()
  if (!cfg?.baseUrl) {
    return { ok: false, status: 412, ms: 0, body: null, error: "Sin REST de tenant ni demo" }
  }
  const res = await fetch("/api/public/protheus-invest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      baseUrl: cfg.baseUrl,
      user: cfg.user,
      password: cfg.password,
      method,
      path,
      body: body ?? null,
    }),
  })
  return (await res.json()) as ProxyResult
}

function itemsOf<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[]
  if (body && typeof body === "object" && Array.isArray((body as { items?: unknown }).items)) {
    return (body as { items: T[] }).items
  }
  return []
}

export async function fetchTenantConnection(): Promise<TenantConnection | null> {
  if (!getToken()) return null
  const res = await authFetch("/api/protheus-invest/connection")
  if (!res.ok) return null
  return (await res.json()) as TenantConnection
}

export async function pingProtheus(demo?: ProtheusRestConfig | null): Promise<ProxyResult> {
  const health = await proxyCall("GET", "/api/claver/v1/investments/health", undefined, demo)
  if (health.ok) return health
  return proxyCall("GET", "/tlpp/rest/list/service", undefined, demo)
}

export async function pullProtheusSnapshot(demo?: ProtheusRestConfig | null) {
  const [banksR, instR, holdR, asientosR] = await Promise.all([
    proxyCall("GET", "/api/claver/v1/investments/banks", undefined, demo),
    proxyCall("GET", "/api/claver/v1/investments/instruments", undefined, demo),
    proxyCall("GET", "/api/claver/v1/investments/holdings", undefined, demo),
    proxyCall("GET", "/api/claver/v1/investments/asientos", undefined, demo),
  ])
  if (!holdR.ok) {
    throw new Error(holdR.error || `Holdings HTTP ${holdR.status}`)
  }
  const invests = itemsOf<Investment>(holdR.body)
  const valuaciones: Valuacion[] = []
  await Promise.all(
    invests.slice(0, 40).map(async (inv) => {
      const r = await proxyCall(
        "GET",
        `/api/claver/v1/investments/holdings/${encodeURIComponent(inv.id)}/valuations`,
        undefined,
        demo,
      )
      if (r.ok) valuaciones.push(...itemsOf<Valuacion>(r.body))
    }),
  )
  return {
    banks: itemsOf<Bank>(banksR.body),
    instruments: itemsOf<Instrument>(instR.body),
    invests,
    valuaciones,
    asientos: itemsOf<Asiento>(asientosR.body),
  }
}

export async function postHolding(payload: unknown, demo?: ProtheusRestConfig | null) {
  return proxyCall("POST", "/api/claver/v1/investments/holdings", payload, demo)
}

export async function postRescue(
  id: string,
  payload: { fecha: string; total: number },
  demo?: ProtheusRestConfig | null,
) {
  return proxyCall(
    "POST",
    `/api/claver/v1/investments/holdings/${encodeURIComponent(id)}/rescue`,
    payload,
    demo,
  )
}
