function substituteParams(obj, { limit, search }) {
  const out = {}
  for (const [k, v] of Object.entries(obj ?? {})) {
    out[k] = String(v)
      .replace("@limit", String(limit))
      .replace("@search", encodeURIComponent(search ?? ""))
  }
  return out
}

export async function queryRest(config, entityConfig, { limit = 10, search = "" }) {
  if (!config.rest.enabled) throw new Error("REST no habilitado en el agente")

  const path = entityConfig.path
  if (!path) throw new Error("Sin path REST para entidad")

  const method = (entityConfig.method ?? "GET").toUpperCase()
  const params = substituteParams(entityConfig.queryParams, { limit, search })
  const qs = new URLSearchParams(params).toString()
  const url = `${config.rest.baseUrl}${path}${qs ? `?${qs}` : ""}`

  const headers = { Accept: "application/json" }
  if (config.rest.authToken) {
    headers[config.rest.authHeader] = config.rest.authToken
  }

  const res = await fetch(url, { method, headers })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`REST ${res.status}: ${body.slice(0, 200)}`)
  }

  const json = await res.json()
  if (Array.isArray(json)) return json
  if (Array.isArray(json.items)) return json.items
  if (Array.isArray(json.data)) return json.data
  return [json]
}