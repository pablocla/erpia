#!/usr/bin/env node
/**
 * ============================================================
 *  TOTVS Protheus REST — Service Explorer
 * ============================================================
 *  Lista todos los endpoints/servicios publicados en el server
 *  REST de Protheus.
 *
 *  USO:
 *    1. Copiá el archivo .env.protheus.example → .env.protheus
 *    2. Completá PROTHEUS_USER y PROTHEUS_PASS
 *    3. Ejecutá:  node scripts/protheus-rest-explorer.mjs
 *
 *  También podés pasar las credenciales por línea de comandos:
 *    node scripts/protheus-rest-explorer.mjs --user admin --pass 1234
 * ============================================================
 */

import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

// ── Configuración ────────────────────────────────────────────
const BASE_URL = "https://comat-protheus-rest.totvs.ar/rest"

// ── Helpers ──────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnvFile() {
  const envPath = resolve(__dirname, "..", ".env.protheus")
  try {
    const content = readFileSync(envPath, "utf-8")
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "")
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    // No .env.protheus file — that's OK, will use CLI args or env vars
  }
}

function parseArgs() {
  const args = process.argv.slice(2)
  const parsed = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--user" && args[i + 1]) parsed.user = args[++i]
    if (args[i] === "--pass" && args[i + 1]) parsed.pass = args[++i]
    if (args[i] === "--base-url" && args[i + 1]) parsed.baseUrl = args[++i]
    if (args[i] === "--help" || args[i] === "-h") parsed.help = true
  }
  return parsed
}

function printHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║        TOTVS Protheus REST — Service Explorer               ║
╚══════════════════════════════════════════════════════════════╝

Uso:
  node scripts/protheus-rest-explorer.mjs [opciones]

Opciones:
  --user <usuario>    Usuario de Protheus
  --pass <clave>      Contraseña de Protheus
  --base-url <url>    URL base del REST (default: ${BASE_URL})
  --help, -h          Mostrar esta ayuda

Credenciales (en orden de prioridad):
  1. Argumentos de línea de comandos (--user / --pass)
  2. Variables de entorno (PROTHEUS_USER / PROTHEUS_PASS)
  3. Archivo .env.protheus en la raíz del proyecto

Ejemplo .env.protheus:
  PROTHEUS_USER=admin
  PROTHEUS_PASS=mi_clave_secreta
`)
}

// ── Colores para la consola ──────────────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  white: "\x1b[37m",
  bgBlue: "\x1b[44m",
}

function header(text) {
  console.log(`\n${c.bgBlue}${c.white}${c.bold} ${text} ${c.reset}\n`)
}

function success(text) {
  console.log(`${c.green}✓${c.reset} ${text}`)
}

function warn(text) {
  console.log(`${c.yellow}⚠${c.reset} ${text}`)
}

function error(text) {
  console.log(`${c.red}✗${c.reset} ${text}`)
}

function info(text) {
  console.log(`${c.cyan}ℹ${c.reset} ${text}`)
}

// ── Auth: intenta múltiples métodos ──────────────────────────
async function tryOAuth2(baseUrl, user, pass) {
  const tokenUrl = `${baseUrl}/api/oauth2/v1/token`
  info(`Intentando OAuth2 en ${tokenUrl}...`)

  const body = new URLSearchParams({
    grant_type: "password",
    username: user,
    password: pass,
  })

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })

  if (res.ok) {
    const data = await res.json()
    success(`OAuth2 OK — Token: ${data.access_token?.slice(0, 20)}...`)
    return { type: "bearer", token: data.access_token }
  }

  warn(`OAuth2 respondió ${res.status}: ${res.statusText}`)
  return null
}

function buildBasicAuth(user, pass) {
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64")
}

async function tryBasicAuth(baseUrl, user, pass) {
  info("Intentando Basic Auth...")
  const authHeader = buildBasicAuth(user, pass)

  const res = await fetch(baseUrl, {
    headers: { Authorization: authHeader },
  })

  if (res.ok || res.status === 200 || res.status === 404) {
    success("Basic Auth parece funcionar")
    return { type: "basic", token: authHeader }
  }

  warn(`Basic Auth respondió ${res.status}: ${res.statusText}`)
  return null
}

async function authenticate(baseUrl, user, pass) {
  // Intento 1: OAuth2
  let auth = await tryOAuth2(baseUrl, user, pass).catch(() => null)
  if (auth) return auth

  // Intento 2: Basic Auth
  auth = await tryBasicAuth(baseUrl, user, pass).catch(() => null)
  if (auth) return auth

  // Intento 3: Sin auth (algunos endpoints pueden ser públicos)
  warn("No se pudo autenticar. Intentando sin credenciales...")
  return { type: "none", token: null }
}

function getAuthHeaders(auth) {
  if (auth.type === "bearer") return { Authorization: `Bearer ${auth.token}` }
  if (auth.type === "basic") return { Authorization: auth.token }
  return {}
}

// ── Descubrimiento de servicios ──────────────────────────────

/**
 * Protheus expone distintos endpoints para listar servicios.
 * Probamos varios patrones conocidos.
 */
const DISCOVERY_PATHS = [
  // Endpoints estándar de TOTVS REST
  { path: "", desc: "Raíz del REST" },
  { path: "/api/framework/environment", desc: "Framework Environment" },
  { path: "/api/framework/v1/services", desc: "Framework Services v1" },
  { path: "/api/framework/v1/environments", desc: "Framework Environments" },
  { path: "/api/framework/treatedError", desc: "Framework Treated Error" },
  // TReports
  { path: "/api/trep/v1/reports", desc: "TReports" },
  // TOTVS API standards
  { path: "/api/totvs-apps", desc: "TOTVS Apps" },
  { path: "/api", desc: "API Root" },
  // Swagger / OpenAPI
  { path: "/swagger/v1/swagger.json", desc: "Swagger JSON" },
  { path: "/swagger.json", desc: "Swagger Root JSON" },
  { path: "/openapi.json", desc: "OpenAPI JSON" },
  // WADL
  { path: "/application.wadl", desc: "WADL" },
  // Common TOTVS product APIs
  { path: "/api/ctb", desc: "Contabilidad (CTB)" },
  { path: "/api/fat", desc: "Facturación (FAT)" },
  { path: "/api/com", desc: "Compras (COM)" },
  { path: "/api/est", desc: "Stock (EST)" },
  { path: "/api/fin", desc: "Financiero (FIN)" },
  { path: "/api/rh", desc: "RRHH (RH)" },
  { path: "/api/fis", desc: "Fiscal (FIS)" },
  { path: "/api/crm", desc: "CRM" },
  { path: "/api/tms", desc: "TMS Logística" },
  { path: "/api/mnt", desc: "Mantenimiento (MNT)" },
]

async function probeEndpoint(baseUrl, path, authHeaders) {
  const url = `${baseUrl}${path}`
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(url, {
      headers: {
        ...authHeaders,
        Accept: "application/json",
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    const contentType = res.headers.get("content-type") || ""
    let body = null

    if (contentType.includes("json")) {
      try {
        body = await res.json()
      } catch {
        body = await res.text()
      }
    } else {
      body = await res.text()
      // Intentar parsear como JSON de todas formas
      try {
        body = JSON.parse(body)
      } catch {
        // mantener como texto
      }
    }

    return { url, status: res.status, contentType, body, ok: res.ok }
  } catch (err) {
    return { url, status: 0, error: err.message, ok: false }
  }
}

function formatBody(body, indent = 2) {
  if (body === null || body === undefined) return "(vacío)"
  if (typeof body === "string") {
    if (body.length > 500) return body.slice(0, 500) + "...(truncado)"
    return body
  }
  return JSON.stringify(body, null, indent)
}

function extractServices(body) {
  if (!body || typeof body !== "object") return []

  const services = []

  // Si es un array directo de servicios
  if (Array.isArray(body)) {
    for (const item of body) {
      if (typeof item === "string") services.push(item)
      else if (item.name || item.path || item.url || item.endpoint) {
        services.push(item.name || item.path || item.url || item.endpoint)
      }
    }
    return services
  }

  // Buscar en propiedades comunes
  const keys = ["services", "items", "apis", "endpoints", "paths", "resources", "data"]
  for (const key of keys) {
    if (body[key] && typeof body[key] === "object") {
      if (Array.isArray(body[key])) {
        for (const item of body[key]) {
          if (typeof item === "string") services.push(item)
          else if (item.name || item.path) services.push(item.name || item.path)
        }
      } else {
        // Si es un objeto (como Swagger paths), las keys son los endpoints
        services.push(...Object.keys(body[key]))
      }
    }
  }

  return services
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  loadEnvFile()
  const args = parseArgs()

  if (args.help) {
    printHelp()
    process.exit(0)
  }

  const baseUrl = args.baseUrl || process.env.PROTHEUS_BASE_URL || BASE_URL
  const user = args.user || process.env.PROTHEUS_USER
  const pass = args.pass || process.env.PROTHEUS_PASS

  console.log(`
${c.bold}${c.cyan}╔══════════════════════════════════════════════════════════════╗
║        TOTVS Protheus REST — Service Explorer               ║
╚══════════════════════════════════════════════════════════════╝${c.reset}
`)

  info(`URL base: ${c.bold}${baseUrl}${c.reset}`)

  if (!user || !pass) {
    error("Faltan credenciales!")
    console.log(`
${c.yellow}Configurá las credenciales de una de estas formas:${c.reset}

  ${c.bold}1. Archivo .env.protheus${c.reset} (en la raíz del proyecto):
     PROTHEUS_USER=tu_usuario
     PROTHEUS_PASS=tu_clave

  ${c.bold}2. Variables de entorno:${c.reset}
     $env:PROTHEUS_USER="tu_usuario"
     $env:PROTHEUS_PASS="tu_clave"

  ${c.bold}3. Línea de comandos:${c.reset}
     node scripts/protheus-rest-explorer.mjs --user tu_usuario --pass tu_clave
`)
    process.exit(1)
  }

  info(`Usuario: ${c.bold}${user}${c.reset}`)
  info(`Password: ${c.dim}${"*".repeat(pass.length)}${c.reset}`)

  // ── Autenticación ──
  header("AUTENTICACIÓN")
  const auth = await authenticate(baseUrl, user, pass)

  if (auth.type === "none") {
    warn("Continuando sin autenticación — algunos endpoints pueden fallar")
  } else {
    success(`Método de auth: ${c.bold}${auth.type.toUpperCase()}${c.reset}`)
  }

  const authHeaders = getAuthHeaders(auth)

  // ── Descubrir servicios ──
  header("DESCUBRIMIENTO DE SERVICIOS")
  info(`Probando ${DISCOVERY_PATHS.length} endpoints conocidos...\n`)

  const results = []

  for (const { path, desc } of DISCOVERY_PATHS) {
    process.stdout.write(`  ${c.dim}→${c.reset} ${desc} (${path || "/"})... `)
    const result = await probeEndpoint(baseUrl, path, authHeaders)

    if (result.ok) {
      console.log(`${c.green}${result.status} OK${c.reset}`)
      results.push({ ...result, desc })
    } else if (result.status === 401 || result.status === 403) {
      console.log(`${c.red}${result.status} No autorizado${c.reset}`)
    } else if (result.status === 404) {
      console.log(`${c.dim}404 No encontrado${c.reset}`)
    } else if (result.error) {
      console.log(`${c.red}Error: ${result.error}${c.reset}`)
    } else {
      console.log(`${c.yellow}${result.status}${c.reset}`)
      // Aún así puede tener info útil
      if (result.body && typeof result.body === "object") {
        results.push({ ...result, desc })
      }
    }
  }

  // ── Mostrar resultados ──
  if (results.length === 0) {
    header("RESULTADOS")
    warn("No se encontraron endpoints activos.")
    console.log(`
${c.yellow}Posibles causas:${c.reset}
  • Las credenciales son incorrectas
  • El servidor REST no está activo
  • La URL base es incorrecta
  • Se requiere VPN o acceso de red especial
  • El servidor usa un esquema de auth diferente

${c.cyan}Sugerencias:${c.reset}
  • Verificá que podés acceder a ${baseUrl} desde el navegador
  • Consultá con el equipo de TOTVS/Protheus los endpoints habilitados
  • Probá acceder a ${baseUrl}/api/oauth2/v1/token para verificar el auth
`)
    process.exit(1)
  }

  header("SERVICIOS ENCONTRADOS")

  let allServices = []

  for (const result of results) {
    console.log(`\n${c.bold}${c.magenta}── ${result.desc} ──${c.reset}`)
    console.log(`   ${c.dim}URL: ${result.url}${c.reset}`)
    console.log(`   ${c.dim}Status: ${result.status} | Content-Type: ${result.contentType}${c.reset}`)

    const services = extractServices(result.body)
    if (services.length > 0) {
      console.log(`   ${c.green}${services.length} servicio(s) encontrado(s):${c.reset}`)
      for (const svc of services) {
        console.log(`     ${c.cyan}•${c.reset} ${svc}`)
      }
      allServices.push(...services)
    } else {
      console.log(`   ${c.dim}Respuesta:${c.reset}`)
      const formatted = formatBody(result.body)
      for (const line of formatted.split("\n").slice(0, 30)) {
        console.log(`     ${c.dim}${line}${c.reset}`)
      }
    }
  }

  // ── Resumen ──
  if (allServices.length > 0) {
    header("RESUMEN DE SERVICIOS")
    const unique = [...new Set(allServices)].sort()
    console.log(`${c.bold}Total de servicios únicos: ${unique.length}${c.reset}\n`)
    for (let i = 0; i < unique.length; i++) {
      console.log(`  ${c.cyan}${String(i + 1).padStart(3)}.${c.reset} ${unique[i]}`)
    }
  }

  console.log(`\n${c.dim}─────────────────────────────────────────────${c.reset}`)
  success("Exploración completada")
  console.log()
}

main().catch((err) => {
  error(`Error fatal: ${err.message}`)
  console.error(err)
  process.exit(1)
})
