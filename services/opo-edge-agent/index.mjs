import http from "node:http"
import { loadConfig } from "./lib/config.mjs"
import { buildDiscovery, executeEntityQuery } from "./lib/router.mjs"

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on("data", (c) => chunks.push(c))
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8")
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error("JSON inválido"))
      }
    })
    req.on("error", reject)
  })
}

function checkAuth(req, config) {
  if (!config.apiKey) return true
  const header = req.headers["x-opo-api-key"]
  return header === config.apiKey
}

function send(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    "Content-Type": "application/json",
    "X-OPO-Version": "0.1.0",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-OPO-Api-Key, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  })
  res.end(body)
}

async function main() {
  const config = loadConfig()

  const server = http.createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
      return send(res, 204, {})
    }

    const host = req.headers.host ?? `localhost:${config.port}`
    const url = new URL(req.url ?? "/", `http://${host}`)
    const path = url.pathname

    if (path === "/health") {
      return send(res, 200, {
        ok: true,
        agent: "clavis-opo-edge-agent",
        routing: config.routing,
        sql: config.sql.enabled,
        rest: config.rest.enabled,
      })
    }

    if (!checkAuth(req, config)) {
      return send(res, 401, { status: "error", code: "OPO-ERR-001", message: "API key inválida" })
    }

    try {
      if (path === "/.well-known/opo.json" && req.method === "GET") {
        return send(res, 200, buildDiscovery(config, host))
      }

      if (path === "/api/opo/discovery" && req.method === "GET") {
        return send(res, 200, buildDiscovery(config, host))
      }

      if (path === "/api/opo/query" && req.method === "POST") {
        const body = await readBody(req)
        const result = await executeEntityQuery(config, body)
        return send(res, 200, { status: "success", provider: "opo-edge-agent", data: result })
      }

      const entityMatch = path.match(/^\/api\/opo\/entities\/([A-Za-z]+)$/)
      if (entityMatch && req.method === "GET") {
        const result = await executeEntityQuery(config, {
          entity: entityMatch[1],
          limit: Number(url.searchParams.get("limit") ?? "10"),
          search: url.searchParams.get("search") ?? "",
        })
        return send(res, 200, result)
      }

      return send(res, 404, { status: "error", message: "Ruta no encontrada" })
    } catch (err) {
      return send(res, 500, {
        status: "error",
        code: "OPO-ERR-004",
        message: err instanceof Error ? err.message : "Error interno",
      })
    }
  })

  server.listen(config.port, config.host, () => {
    console.log(`[OPO Edge Agent] escuchando en http://${config.host}:${config.port}`)
    console.log(`[OPO Edge Agent] routing=${config.routing} sql=${config.sql.enabled} rest=${config.rest.enabled}`)
    console.log(`[OPO Edge Agent] desde Clavis (192.168.100.2) usar baseUrl: http://192.168.100.3:${config.port}`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})