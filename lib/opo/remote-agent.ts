import type { OpoDiscoveryManifest, OpoQueryInput, OpoTenantConfig } from "./types"

const AGENT_TIMEOUT_MS = 30_000

export function isRemoteAgentConfigured(config: OpoTenantConfig): boolean {
  const url = config.baseUrl?.trim()
  return Boolean(url && /^https?:\/\//i.test(url))
}

function agentHeaders(config: OpoTenantConfig): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-OPO-Version": "0.1.0",
  }
  if (config.agentApiKey?.trim()) {
    headers["X-OPO-Api-Key"] = config.agentApiKey.trim()
  }
  return headers
}

export async function fetchRemoteDiscovery(
  config: OpoTenantConfig,
): Promise<OpoDiscoveryManifest> {
  const base = config.baseUrl!.replace(/\/$/, "")
  const res = await fetch(`${base}/api/opo/discovery`, {
    headers: agentHeaders(config),
    signal: AbortSignal.timeout(AGENT_TIMEOUT_MS),
  })
  if (!res.ok) {
    throw new Error(`Agente OPO no respondió discovery (${res.status})`)
  }
  return res.json() as Promise<OpoDiscoveryManifest>
}

export async function queryRemoteAgent(config: OpoTenantConfig, input: OpoQueryInput) {
  const base = config.baseUrl!.replace(/\/$/, "")
  const res = await fetch(`${base}/api/opo/query`, {
    method: "POST",
    headers: agentHeaders(config),
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(AGENT_TIMEOUT_MS),
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      (json as { message?: string }).message ??
      `Agente OPO error (${res.status})`
    throw new Error(msg)
  }

  const payload = json as { data?: Record<string, unknown> }
  if (payload.data) return payload.data
  return json
}

export async function pingRemoteAgent(config: OpoTenantConfig) {
  const base = config.baseUrl!.replace(/\/$/, "")
  const res = await fetch(`${base}/health`, {
    headers: agentHeaders(config),
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`Health check falló (${res.status})`)
  return res.json()
}