/**
 * Genera data/protheus-rest-catalog.json desde el dump del discovery REST.
 * Uso: node scripts/build-protheus-catalog.mjs
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const rawPath = path.join(root, "data/protheus-rest-services.raw.json")
const outPath = path.join(root, "data/protheus-rest-catalog.json")

// Inline minimal registry (script runs standalone)
const MODULES = [
  { id: "stock", patrones: [/\/api\/stock\//i, /trackcosts/i, /kardex/i, /warehouses/i, /mata\d+/i] },
  { id: "productos", patrones: [/\/api\/acproduct/i, /\/aclist\//i, /producttypes/i, /GroupProduct/i] },
  { id: "fin", patrones: [/\/api\/fin\//i, /\/api\/gfin\//i, /totvsRecibos/i, /receivables/i] },
  { id: "ctb", patrones: [/\/api\/ctb\//i, /accountingentry/i, /apportionment/i, /accountingtotal/i] },
  { id: "plan_cuentas", patrones: [/bindingchartofaccounts/i, /chartofaccount/i, /costcenter/i] },
  { id: "cc", patrones: [/\/api\/cc\//i, /Ecdvalidators/i, /ecfvalidators/i] },
  { id: "pc", patrones: [/\/api\/pc\//i, /purchaseorder/i, /\/api\/com\/purchase/i] },
  { id: "com", patrones: [/\/api\/com\//i, /\/api\/fat\//i] },
  { id: "ventas", patrones: [/\/api\/tgv\//i, /\/api\/crm\//i, /salesorders/i, /salesbudgets/i] },
  { id: "fiscal", patrones: [/\/api\/taf\//i, /fiscal/i, /wstaf/i, /nfe/i] },
  { id: "pcp", patrones: [/\/api\/pcp\//i, /processinspection/i, /\/api\/qip\//i] },
  { id: "rh", patrones: [/\/api\/rh\//i, /\/rh\//i, /esocial/i, /payrollLoan/i] },
  { id: "retail", patrones: [/\/api\/retail\//i] },
  { id: "framework", patrones: [/\/api\/framework\//i, /\/api\/v1\/acUser/i, /dbdataproviders/i, /privileges/i] },
  { id: "analytics", patrones: [/\/api\/ba\//i, /totvseai/i, /monitor/i, /insights/i] },
  { id: "health", patrones: [/totvsHealthPlans/i, /healthplans/i] },
  { id: "usuarios", patrones: [/\/api\/v1\/acUser/i] },
]

function classify(endpoint) {
  for (const m of MODULES) {
    if (m.patrones.some((p) => p.test(endpoint))) return m.id
  }
  return "otros"
}

function inferPurpose(endpoint, method) {
  const ep = endpoint.toLowerCase()
  const v = { GET: "Consulta", POST: "Alta/proceso", PUT: "Actualización", PATCH: "Parcial", DELETE: "Baja" }[method] ?? method
  if (ep.includes("customer")) return `${v} clientes`
  if (ep.includes("product")) return `${v} productos`
  if (ep.includes("salesorder")) return `${v} pedidos venta`
  if (ep.includes("accountingentry")) return `${v} asientos contables`
  if (ep.includes("stock") || ep.includes("warehouse")) return `${v} inventario`
  if (ep.includes("purchase")) return `${v} compras`
  if (ep.includes("fiscal") || ep.includes("taf")) return `${v} fiscal`
  if (ep.includes("rh") || ep.includes("payroll")) return `${v} RRHH`
  if (ep.includes("report")) return `${v} reportes`
  return `${v} — ${endpoint.split("/").filter(Boolean).slice(-2).join("/")}`
}

const raw = fs.readFileSync(rawPath, "utf8")
const start = raw.indexOf("[")
const services = JSON.parse(raw.slice(start, raw.lastIndexOf("]") + 1))

const enriched = services.map((s) => {
  const methods = (s.methods ?? []).map((m) => ({
    method: m.method?.trim() ?? "GET",
    description: m.description ?? "",
    proposito: inferPurpose(s.endpoint, m.method?.trim() ?? "GET"),
  }))
  const moduleId = classify(s.endpoint)
  return {
    endpoint: s.endpoint,
    type: s.type,
    doc: s.doc,
    moduleId,
    methods,
    fullUrl: `{baseUrl}${s.endpoint.startsWith("/") ? "" : "/"}${s.endpoint}`,
    propositoResumen: methods.map((m) => m.proposito).join(" · "),
  }
})

const byModule = {}
for (const e of enriched) {
  byModule[e.moduleId] = (byModule[e.moduleId] ?? 0) + 1
}

const catalog = {
  meta: {
    source: "http://10.12.35.70:8073/rest/tlpp/rest/list/service",
    generatedAt: new Date().toISOString(),
    totalServices: enriched.length,
    discoveryPath: "/tlpp/rest/list/service",
    authType: "Basic",
    baseUrlExample: "http://10.12.35.70:8073/rest",
  },
  moduleCounts: byModule,
  services: enriched,
}

fs.writeFileSync(outPath, JSON.stringify(catalog))
console.log(`Catalogo generado: ${outPath} (${enriched.length} servicios)`)
console.log("Modulos:", JSON.stringify(byModule, null, 2))