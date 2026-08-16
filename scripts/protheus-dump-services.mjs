import { readFileSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Leer credenciales
const envContent = readFileSync(resolve(__dirname, "..", ".env.protheus"), "utf-8")
const env = {}
for (const line of envContent.split("\n")) {
  const t = line.trim()
  if (!t || t.startsWith("#")) continue
  const eq = t.indexOf("=")
  if (eq === -1) continue
  env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
}

async function main() {
  // Auth
  console.log("Autenticando...")
  const tokenRes = await fetch("https://comat-protheus-rest.totvs.ar/rest/api/oauth2/v1/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "password",
      username: env.PROTHEUS_USER,
      password: env.PROTHEUS_PASS,
    }).toString(),
  })

  const tokenText = await tokenRes.text()
  console.log("Token response status:", tokenRes.status)
  console.log("Token content-type:", tokenRes.headers.get("content-type"))

  let token
  try {
    const tokenData = JSON.parse(tokenText)
    token = tokenData.access_token
    console.log("Token OK:", token.slice(0, 30) + "...")
  } catch {
    // Puede ser XML — intentar extraer el token con regex
    const match = tokenText.match(/<access_token>([^<]+)<\/access_token>/)
      || tokenText.match(/access_token["\s:>]+([^"<\s]+)/)
    if (match) {
      token = match[1]
      console.log("Token extraído de XML:", token.slice(0, 30) + "...")
    } else {
      console.log("Respuesta del token (primeros 500 chars):")
      console.log(tokenText.slice(0, 500))
      throw new Error("No se pudo obtener el token")
    }
  }

  // Fetch full service list
  console.log("\nDescargando lista de servicios...")
  const res = await fetch("https://comat-protheus-rest.totvs.ar/rest", {
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/json",
    },
  })

  const bodyText = await res.text()
  console.log("Services response status:", res.status)
  console.log("Services content-type:", res.headers.get("content-type"))

  let services
  try {
    services = JSON.parse(bodyText)
  } catch {
    console.log("La respuesta no es JSON. Primeros 1000 chars:")
    console.log(bodyText.slice(0, 1000))
    throw new Error("La lista de servicios no es JSON válido")
  }

  if (!Array.isArray(services)) {
    console.log("La respuesta no es un array. Tipo:", typeof services)
    console.log("Keys:", Object.keys(services))
    // Intentar buscar un array dentro del objeto
    const outPath = resolve(__dirname, "protheus-services-full.json")
    writeFileSync(outPath, JSON.stringify(services, null, 2), "utf-8")
    console.log("Respuesta guardada en:", outPath)
    return
  }

  // Save full JSON
  const outPath = resolve(__dirname, "protheus-services-full.json")
  writeFileSync(outPath, JSON.stringify(services, null, 2), "utf-8")
  console.log(`\nTotal de servicios: ${services.length}`)

  // Print summary table
  console.log("\n=== LISTADO COMPLETO DE SERVICIOS ===\n")
  for (let i = 0; i < services.length; i++) {
    const s = services[i]
    const methods = s.Methods ? s.Methods.map((m) => m.Name).join(", ") : "N/A"
    console.log(`${String(i + 1).padStart(4)}. [${methods.padEnd(12)}] ${s.Id}`)
  }

  console.log(`\nArchivo completo guardado en: ${outPath}`)
}

main().catch((e) => {
  console.error("Error:", e.message)
  process.exit(1)
})
