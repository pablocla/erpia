/**
 * Validador determinístico de demos por industria.
 * No depende de Gemini: checks de DB + APIs. Gemini solo resume para el analista.
 */

import { prisma } from "@/lib/prisma"
import {
  getIndustryTemplate,
  INDUSTRY_TEMPLATES,
  type IndustryTemplate,
} from "@/lib/comercial/industry-templates"
import { provisionIndustryDemo } from "@/lib/comercial/industry-demo-service"
import { partitionSkusForAutoActivate } from "@/lib/comercial/product-auto-subscribe"
import { skusParaActivar } from "@/lib/comercial/pack-calle-catalog"
import { AuthService } from "@/lib/auth/auth-service"
import bcrypt from "bcryptjs"
import { DEMO_ADMIN_PASSWORD } from "@/lib/brand"
import { getPublicAppUrl } from "@/lib/config/public-app-url"

export type CheckStatus = "pass" | "warn" | "fail"

export interface DemoHealthCheck {
  id: string
  label: string
  status: CheckStatus
  detail?: string
}

export interface DemoHealthReport {
  industryId: string
  label: string
  ok: boolean
  /** auto = listo para calle; needs_analyst = vende con caveats; failed = no demo comercial */
  verdict: "auto" | "needs_analyst" | "failed"
  empresaId?: number
  goldenPath?: string
  modoLite?: string
  skusActivados: string[]
  skusEsperados: string[]
  autoSubscribe: {
    auto: string[]
    paid: string[]
    analyst: string[]
    blocked: string[]
  }
  checks: DemoHealthCheck[]
  durationMs: number
  token?: string
  error?: string
}

/** APIs smoke por golden path (prefijo) */
const GOLDEN_API: Array<{ pathPrefix: string; api: string }> = [
  { pathPrefix: "/dashboard/fiado", api: "/api/fiado/deudores" },
  { pathPrefix: "/dashboard/membresias", api: "/api/membresias" },
  { pathPrefix: "/dashboard/historia-clinica", api: "/api/historia-clinica" },
  { pathPrefix: "/dashboard/agenda", api: "/api/agenda/turnos" },
  { pathPrefix: "/dashboard/hospitalidad", api: "/api/hospitalidad/mesas" },
  { pathPrefix: "/dashboard/pos", api: "/api/productos?take=5" },
  { pathPrefix: "/dashboard/ventas", api: "/api/ventas?take=5" },
  { pathPrefix: "/dashboard/nicho/consorcios", api: "/api/nicho/consorcios" },
  { pathPrefix: "/dashboard/nicho/taller", api: "/api/nicho/taller" },
  { pathPrefix: "/dashboard/nicho/club", api: "/api/nicho/club" },
  { pathPrefix: "/dashboard/nicho/obras", api: "/api/nicho/obras" },
  { pathPrefix: "/dashboard/nicho/gimnasio", api: "/api/membresias" },
  { pathPrefix: "/dashboard/cuentas-cobrar", api: "/api/cuentas-cobrar" },
  { pathPrefix: "/dashboard/picking", api: "/api/picking" },
  { pathPrefix: "/dashboard", api: "/api/config/empresa" },
]

function apiForGoldenPath(goldenPath: string): string {
  const sorted = [...GOLDEN_API].sort((a, b) => b.pathPrefix.length - a.pathPrefix.length)
  for (const row of sorted) {
    if (goldenPath === row.pathPrefix || goldenPath.startsWith(`${row.pathPrefix}/`)) {
      return row.api
    }
  }
  return "/api/config/empresa"
}

function expectedSkus(template: IndustryTemplate): string[] {
  if (!template.engancheId) return []
  try {
    return skusParaActivar(template.engancheId)
  } catch {
    return [template.engancheId]
  }
}

async function countSafe(
  label: string,
  fn: () => Promise<number>,
): Promise<{ label: string; n: number; err?: string }> {
  try {
    return { label, n: await fn() }
  } catch (e) {
    return { label, n: -1, err: e instanceof Error ? e.message : "error" }
  }
}

/**
 * Valida una empresa demo ya provisionada (DB + opcional HTTP).
 */
export async function validateDemoEmpresa(
  empresaId: number,
  industryId: string,
  opts?: { token?: string; skipHttp?: boolean },
): Promise<DemoHealthReport> {
  const t0 = Date.now()
  const template = getIndustryTemplate(industryId)
  const checks: DemoHealthCheck[] = []
  const skusEsperados = template ? expectedSkus(template) : []

  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { id: true, nombre: true, rubro: true, modoLite: true, email: true },
  })

  if (!empresa) {
    return {
      industryId,
      label: template?.label ?? industryId,
      ok: false,
      verdict: "failed",
      skusActivados: [],
      skusEsperados,
      autoSubscribe: { auto: [], paid: [], analyst: [], blocked: [] },
      checks: [{ id: "empresa", label: "Empresa existe", status: "fail", detail: "no encontrada" }],
      durationMs: Date.now() - t0,
      error: "Empresa no encontrada",
    }
  }

  checks.push({
    id: "empresa",
    label: "Empresa demo",
    status: "pass",
    detail: `${empresa.nombre} (#${empresa.id})`,
  })

  const subs = await prisma.suscripcionModulo.findMany({
    where: { empresaId, activo: true },
    select: { sku: true },
  })
  const skusActivados = subs.map((s) => s.sku)

  const faltan = skusEsperados.filter((s) => !skusActivados.includes(s))
  checks.push({
    id: "skus",
    label: "SKUs del enganche activos",
    status: faltan.length === 0 ? "pass" : skusActivados.length > 0 ? "warn" : "fail",
    detail:
      faltan.length === 0
        ? `${skusActivados.length} activos`
        : `Faltan: ${faltan.join(", ") || "—"}; activos: ${skusActivados.join(", ") || "ninguno"}`,
  })

  const partition = partitionSkusForAutoActivate(skusEsperados.length ? skusEsperados : skusActivados, {
    context: "industry_demo",
    engancheId: template?.engancheId,
  })

  const counts = await Promise.all([
    countSafe("clientes", () => prisma.cliente.count({ where: { empresaId } })),
    countSafe("productos", () => prisma.producto.count({ where: { empresaId } })),
    countSafe("usuarios", () => prisma.usuario.count({ where: { empresaId, activo: true } })),
  ])

  for (const c of counts) {
    if (c.err) {
      checks.push({ id: c.label, label: `Seed ${c.label}`, status: "warn", detail: c.err })
    } else if (c.label === "usuarios") {
      checks.push({
        id: c.label,
        label: "Usuario admin",
        status: c.n >= 1 ? "pass" : "fail",
        detail: `${c.n}`,
      })
    } else {
      checks.push({
        id: c.label,
        label: `Datos ${c.label}`,
        status: c.n > 0 ? "pass" : "warn",
        detail: c.n === 0 ? "sin seed (demo vacía)" : `${c.n}`,
      })
    }
  }

  const goldenPath = template?.goldenPath ?? "/dashboard"
  checks.push({
    id: "goldenPath",
    label: "Golden path",
    status: "pass",
    detail: goldenPath,
  })

  // HTTP smoke (opcional)
  if (!opts?.skipHttp && opts?.token) {
    const base = getPublicAppUrl().replace(/\/$/, "") || "http://localhost:3000"
    const apiPath = apiForGoldenPath(goldenPath)
    try {
      const res = await fetch(`${base}${apiPath}`, {
        headers: { Authorization: `Bearer ${opts.token}` },
        signal: AbortSignal.timeout(8000),
      })
      checks.push({
        id: "api_golden",
        label: `API ${apiPath}`,
        status: res.ok ? "pass" : res.status >= 500 ? "fail" : "warn",
        detail: `HTTP ${res.status}`,
      })
    } catch (e) {
      checks.push({
        id: "api_golden",
        label: `API ${apiPath}`,
        status: "warn",
        detail: e instanceof Error ? e.message : "sin respuesta (¿servidor caído?)",
      })
    }

    try {
      const res = await fetch(`${base}/api/config/empresa`, {
        headers: { Authorization: `Bearer ${opts.token}` },
        signal: AbortSignal.timeout(5000),
      })
      checks.push({
        id: "api_empresa",
        label: "API config/empresa",
        status: res.ok ? "pass" : "fail",
        detail: `HTTP ${res.status}`,
      })
    } catch (e) {
      checks.push({
        id: "api_empresa",
        label: "API config/empresa",
        status: "warn",
        detail: e instanceof Error ? e.message : "error",
      })
    }
  }

  const fails = checks.filter((c) => c.status === "fail")
  const warns = checks.filter((c) => c.status === "warn")
  let verdict: DemoHealthReport["verdict"] = "auto"
  if (fails.length > 0) verdict = "failed"
  else if (warns.length > 0 || partition.analyst.length > 0 || partition.blocked.length > 0) {
    verdict = "needs_analyst"
  }

  return {
    industryId,
    label: template?.label ?? industryId,
    ok: verdict !== "failed",
    verdict,
    empresaId,
    goldenPath,
    modoLite: empresa.modoLite ?? undefined,
    skusActivados,
    skusEsperados,
    autoSubscribe: {
      auto: partition.auto,
      paid: partition.paid,
      analyst: partition.analyst,
      blocked: partition.blocked,
    },
    checks,
    durationMs: Date.now() - t0,
    token: opts?.token,
  }
}

/**
 * Provisiona una demo aislada, valida y (opcional) no limpia — deja tenant para inspección.
 */
export async function provisionAndValidateIndustry(
  industryId: string,
  opts?: { skipHttp?: boolean; keepTenant?: boolean },
): Promise<DemoHealthReport> {
  const t0 = Date.now()
  const template = getIndustryTemplate(industryId)
  if (!template) {
    return {
      industryId,
      label: industryId,
      ok: false,
      verdict: "failed",
      skusActivados: [],
      skusEsperados: [],
      autoSubscribe: { auto: [], paid: [], analyst: [], blocked: [] },
      checks: [],
      durationMs: 0,
      error: `Industria no soportada: ${industryId}`,
    }
  }

  const demoHash = crypto.randomUUID().split("-")[0]
  const fakeCuit = `20-${demoHash}-0`
  const demoEmail = `qa-demo-${demoHash}@claver.com.ar`

  try {
    const empresa = await prisma.empresa.create({
      data: {
        nombre: `QA Demo ${template.label} ${demoHash}`,
        razonSocial: `QA Demo ${demoHash} SRL`,
        cuit: fakeCuit,
        direccion: "QA Auto Validator",
        telefono: "011-0000-0000",
        email: demoEmail,
        puntoVenta: 1,
        entorno: "homologacion",
        rubro: "otro",
      },
    })

    const provision = await provisionIndustryDemo(empresa.id, industryId)

    const hashed = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 8)
    const usuario = await prisma.usuario.create({
      data: {
        nombre: "QA Demo Admin",
        email: demoEmail,
        password: hashed,
        rol: "administrador",
        empresaId: empresa.id,
        activo: true,
      },
    })

    const auth = new AuthService()
    const token = await auth.generarToken({
      userId: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      empresaId: usuario.empresaId,
    })

    const report = await validateDemoEmpresa(empresa.id, industryId, {
      token,
      skipHttp: opts?.skipHttp,
    })

    report.goldenPath = provision.goldenPath
    report.modoLite = provision.modoLite
    report.durationMs = Date.now() - t0

    if (!opts?.keepTenant) {
      // Marcar como QA (no borrar grafo completo por FKs)
      await prisma.empresa
        .update({
          where: { id: empresa.id },
          data: {
            nombre: `[QA DEMO] ${template.label} ${demoHash}`,
            email: `qa-done-${demoHash}@claver.com.ar`,
          },
        })
        .catch(() => {})
    }

    return report
  } catch (e) {
    return {
      industryId,
      label: template.label,
      ok: false,
      verdict: "failed",
      skusActivados: [],
      skusEsperados: expectedSkus(template),
      autoSubscribe: { auto: [], paid: [], analyst: [], blocked: [] },
      checks: [
        {
          id: "provision",
          label: "Provision",
          status: "fail",
          detail: e instanceof Error ? e.message : "error",
        },
      ],
      durationMs: Date.now() - t0,
      error: e instanceof Error ? e.message : "Error al provisionar",
    }
  }
}

export async function validateFeaturedDemos(opts?: {
  industryIds?: string[]
  skipHttp?: boolean
  keepTenant?: boolean
}): Promise<{ reports: DemoHealthReport[]; summary: string }> {
  const featured =
    opts?.industryIds?.length
      ? opts.industryIds
      : INDUSTRY_TEMPLATES.filter((t) => t.featured).map((t) => t.id)

  const ids = featured.length ? featured : ["almacen", "gimnasio", "salon_belleza", "prestamista"]
  const reports: DemoHealthReport[] = []

  for (const id of ids) {
    // secuencial: evita saturar DB y rate limits
    reports.push(await provisionAndValidateIndustry(id, opts))
  }

  const auto = reports.filter((r) => r.verdict === "auto").length
  const needs = reports.filter((r) => r.verdict === "needs_analyst").length
  const failed = reports.filter((r) => r.verdict === "failed").length
  const summary = `Demos: ${reports.length} · auto=${auto} · needs_analyst=${needs} · failed=${failed}`

  return { reports, summary }
}
