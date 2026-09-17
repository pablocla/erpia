import type { OpoTenantConfig } from "@/lib/opo/types"
import { isAllowedProtheusPath } from "./rest-config"

export type ForwardResult = {
  ok: boolean
  status: number
  ms: number
  body: unknown
  error?: string
}

export function tenantRestReady(config: Pick<OpoTenantConfig, "restDirectUrl" | "restAuthUser" | "restAuthPassword">) {
  return Boolean(
    config.restDirectUrl?.trim() && config.restAuthUser?.trim() && config.restAuthPassword?.trim(),
  )
}

export function maskOpoSecrets<T extends { restAuthPassword?: string; agentApiKey?: string; sqlPassword?: string }>(
  config: T,
) {
  return {
    ...config,
    restAuthPassword: config.restAuthPassword ? "••••••••" : "",
    agentApiKey: config.agentApiKey ? "••••••••" : config.agentApiKey,
    sqlPassword: config.sqlPassword ? "••••••••" : "",
  }
}

export async function forwardToProtheus(input: {
  baseUrl: string
  user: string
  password: string
  method: string
  path: string
  body?: unknown
}): Promise<ForwardResult> {
  const method = input.method.toUpperCase()
  const path = input.path.trim()
  const baseUrl = input.baseUrl.trim().replace(/\/$/, "")

  if (!["GET", "POST"].includes(method)) {
    return { ok: false, status: 405, ms: 0, body: null, error: "Método no permitido" }
  }
  if (!isAllowedProtheusPath(path.split("?")[0] ?? path)) {
    return { ok: false, status: 400, ms: 0, body: null, error: `Path no permitido: ${path}` }
  }
  if (!/^https?:\/\//i.test(baseUrl)) {
    return { ok: false, status: 400, ms: 0, body: null, error: "baseUrl debe ser http(s)://host:puerto/rest" }
  }

  const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`
  const headers: Record<string, string> = { Accept: "application/json" }
  if (input.user) {
    headers.Authorization = `Basic ${Buffer.from(`${input.user}:${input.password}`).toString("base64")}`
  }
  if (method === "POST") headers["Content-Type"] = "application/json"

  const t0 = Date.now()
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: method === "POST" && input.body != null ? JSON.stringify(input.body) : undefined,
      signal: AbortSignal.timeout(20_000),
    })
    const ms = Date.now() - t0
    const text = await res.text()
    let body: unknown = text.slice(0, 8000)
    try {
      body = JSON.parse(text)
    } catch {
      /* keep text */
    }
    return {
      ok: res.ok,
      status: res.status,
      ms,
      body,
      error: res.ok ? undefined : `Protheus HTTP ${res.status}`,
    }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      ms: Date.now() - t0,
      body: null,
      error: err instanceof Error ? err.message : "No se alcanzó el AppServer",
    }
  }
}

export function credentialsFromOpo(config: OpoTenantConfig) {
  return {
    baseUrl: config.restDirectUrl?.trim() || "",
    user: config.restAuthUser?.trim() || "",
    password: config.restAuthPassword || "",
  }
}
