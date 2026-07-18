/**
 * Chequeo go-live (sin imprimir secretos).
 * Uso: node scripts/go-live-check.mjs
 * Lee .env.local y/o process.env
 */
import fs from "fs"
import path from "path"

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return
  const text = fs.readFileSync(file, "utf8")
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const i = t.indexOf("=")
    if (i < 0) continue
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (process.env[k] == null || process.env[k] === "") process.env[k] = v
  }
}

const root = process.cwd()
loadEnvFile(path.join(root, ".env.local"))
loadEnvFile(path.join(root, ".env"))

function isSet(v) {
  return typeof v === "string" && v.trim().length > 0
}

function isPlaceholder(v) {
  if (!isSet(v)) return true
  return /^(cambiar|tu_|APP_USR-\.\.\.|re_\.\.\.|ACxx|xxx)/i.test(v.trim())
}

const checks = [
  { key: "DATABASE_URL", required: true, group: "core" },
  { key: "JWT_SECRET", required: true, group: "core", minLen: 32 },
  { key: "NEXT_PUBLIC_APP_URL", required: true, group: "core" },
  { key: "NEXT_PUBLIC_BASE_URL", required: false, group: "core", note: "fallback a APP_URL" },
  { key: "MP_ACCESS_TOKEN", required: true, group: "billing", mockIf: (v) => !v || v.startsWith("TEST-mock") },
  { key: "MP_PUBLIC_KEY", required: true, group: "billing" },
  { key: "MP_WEBHOOK_SECRET", required: true, group: "billing" },
  { key: "RESEND_API_KEY", required: false, group: "email", note: "mails fiado" },
  { key: "RESEND_FROM_EMAIL", required: false, group: "email" },
  { key: "TWILIO_ACCOUNT_SID", required: false, group: "whatsapp", note: "Cobrá WA" },
  { key: "TWILIO_AUTH_TOKEN", required: false, group: "whatsapp" },
  { key: "TWILIO_WHATSAPP_FROM", required: false, group: "whatsapp" },
  { key: "AFIP_CUIT", required: false, group: "afip" },
  { key: "AFIP_ENTORNO", required: false, group: "afip" },
  { key: "AFIP_CERT_PROD", required: false, group: "afip", note: "solo factura real" },
]

let fail = 0
let warn = 0

console.log("=== Go-live env check ===\n")

for (const c of checks) {
  const raw = process.env[c.key]
  const set = isSet(raw) && !isPlaceholder(raw)
  const lenOk = !c.minLen || (set && raw.length >= c.minLen)
  const mock = c.mockIf ? c.mockIf(raw || "") : false

  if (c.required && (!set || !lenOk)) {
    console.log(`FAIL  ${c.key}  — falta o placeholder${c.minLen ? ` (min ${c.minLen})` : ""}`)
    fail++
    continue
  }
  if (c.required && mock) {
    console.log(`FAIL  ${c.key}  — modo MOCK (no cobra real)`)
    fail++
    continue
  }
  if (!c.required && !set) {
    console.log(`WARN  ${c.key}  — opcional${c.note ? ` (${c.note})` : ""}`)
    warn++
    continue
  }
  if (set && mock) {
    console.log(`WARN  ${c.key}  — mock/dev`)
    warn++
    continue
  }
  console.log(`OK    ${c.key}`)
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || appUrl
const httpsOk = /^https:\/\//i.test(baseUrl) || /localhost/i.test(baseUrl)
if (!httpsOk && isSet(baseUrl)) {
  console.log("WARN  URL pública no es https (prod debería ser https://...)")
  warn++
}

console.log("\n--- Resumen ---")
console.log(`FAIL: ${fail}  WARN: ${warn}`)
console.log(
  fail === 0
    ? "\nResultado: GO técnico de env (revisá WARN para WA/email/AFIP)."
    : "\nResultado: NO-GO — completá FAIL antes de vender cobrando.",
)
console.log("\nWebhook MP esperado:")
console.log(`  ${baseUrl.replace(/\/$/, "")}/api/webhooks/mercadopago`)
console.log("\nPiso comercial: $10.000/mes (Fiado ancla $0).")

process.exit(fail > 0 ? 1 : 0)
