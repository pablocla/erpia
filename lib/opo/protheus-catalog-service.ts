import fs from "fs"
import path from "path"
import {
  classifyProtheusEndpoint,
  getModuleMeta,
  inferEndpointPurpose,
  PROTHEUS_MODULE_REGISTRY,
} from "./protheus-module-registry"
import { listProtheusServices, type ProtheusRestCredentials } from "./protheus-rest-client"
import type { ProtheusRestService } from "./types"

export interface EnrichedProtheusService {
  endpoint: string
  type: string
  doc: string
  moduleId: string
  methods: { method: string; description: string; proposito: string }[]
  fullUrl: string
  propositoResumen: string
}

export interface ProtheusCatalogMeta {
  source: string
  generatedAt: string
  totalServices: number
  discoveryPath: string
  authType: string
  baseUrlExample: string
  liveRefreshedAt?: string
}

export interface ProtheusCatalogBundle {
  meta: ProtheusCatalogMeta
  moduleCounts: Record<string, number>
  modules: ReturnType<typeof getModuleSummary>[]
  services: EnrichedProtheusService[]
}

const CATALOG_PATH = path.join(process.cwd(), "data/protheus-rest-catalog.json")

let cachedBundle: ProtheusCatalogBundle | null = null

function enrichService(s: ProtheusRestService): EnrichedProtheusService {
  const moduleId = classifyProtheusEndpoint(s.endpoint)
  const methods = (s.methods ?? []).map((m) => {
    const method = m.method?.trim() ?? "GET"
    return {
      method,
      description: m.description ?? "",
      proposito: inferEndpointPurpose(s.endpoint, method),
    }
  })
  return {
    endpoint: s.endpoint,
    type: s.type,
    doc: s.doc,
    moduleId,
    methods,
    fullUrl: `{baseUrl}${s.endpoint.startsWith("/") ? "" : "/"}${s.endpoint}`,
    propositoResumen: methods.map((m) => `${m.method}: ${m.proposito}`).join(" · "),
  }
}

function getModuleSummary() {
  return PROTHEUS_MODULE_REGISTRY.map((m) => ({
    id: m.id,
    nombre: m.nombre,
    siglaProtheus: m.siglaProtheus,
    descripcion: m.descripcion,
    paraQueSirve: m.paraQueSirve,
    opoEntities: m.opoEntities,
    clavisApps: m.clavisApps,
    monetizacion: m.monetizacion,
  }))
}

export function loadProtheusCatalog(): ProtheusCatalogBundle {
  if (cachedBundle) return cachedBundle

  if (!fs.existsSync(CATALOG_PATH)) {
    return {
      meta: {
        source: "sin-cargar",
        generatedAt: new Date().toISOString(),
        totalServices: 0,
        discoveryPath: "/tlpp/rest/list/service",
        authType: "Basic",
        baseUrlExample: "http://10.12.35.70:8073/rest",
      },
      moduleCounts: {},
      modules: getModuleSummary(),
      services: [],
    }
  }

  const raw = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8")) as {
    meta: ProtheusCatalogMeta
    moduleCounts: Record<string, number>
    services: EnrichedProtheusService[]
  }

  cachedBundle = {
    meta: raw.meta,
    moduleCounts: raw.moduleCounts,
    modules: getModuleSummary(),
    services: raw.services,
  }
  return cachedBundle
}

export function searchProtheusCatalog(opts: {
  q?: string
  moduleId?: string
  method?: string
  page?: number
  pageSize?: number
}) {
  const catalog = loadProtheusCatalog()
  const q = opts.q?.trim().toLowerCase()
  const page = Math.max(1, opts.page ?? 1)
  const pageSize = Math.min(100, Math.max(10, opts.pageSize ?? 50))

  let filtered = catalog.services

  if (opts.moduleId && opts.moduleId !== "all") {
    filtered = filtered.filter((s) => s.moduleId === opts.moduleId)
  }

  if (opts.method) {
    filtered = filtered.filter((s) =>
      s.methods.some((m) => m.method.toUpperCase() === opts.method!.toUpperCase()),
    )
  }

  if (q) {
    filtered = filtered.filter(
      (s) =>
        s.endpoint.toLowerCase().includes(q) ||
        s.propositoResumen.toLowerCase().includes(q) ||
        s.moduleId.includes(q),
    )
  }

  const total = filtered.length
  const start = (page - 1) * pageSize
  const items = filtered.slice(start, start + pageSize)

  return {
    meta: catalog.meta,
    moduleCounts: catalog.moduleCounts,
    modules: catalog.modules,
    pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
    items: items.map((s) => ({
      ...s,
      module: getModuleMeta(s.moduleId),
    })),
  }
}

export async function refreshProtheusCatalogLive(creds: ProtheusRestCredentials) {
  const services = await listProtheusServices(creds)
  const enriched = services.map(enrichService)

  const byModule: Record<string, number> = {}
  for (const e of enriched) {
    byModule[e.moduleId] = (byModule[e.moduleId] ?? 0) + 1
  }

  const bundle = {
    meta: {
      source: creds.baseUrl + "/tlpp/rest/list/service",
      generatedAt: new Date().toISOString(),
      liveRefreshedAt: new Date().toISOString(),
      totalServices: enriched.length,
      discoveryPath: "/tlpp/rest/list/service",
      authType: "Basic",
      baseUrlExample: creds.baseUrl,
    },
    moduleCounts: byModule,
    services: enriched,
  }

  fs.mkdirSync(path.dirname(CATALOG_PATH), { recursive: true })
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(bundle))
  cachedBundle = {
    ...bundle,
    modules: getModuleSummary(),
  }

  return cachedBundle
}