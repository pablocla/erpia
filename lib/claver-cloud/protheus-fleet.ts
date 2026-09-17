import { prisma } from "@/lib/prisma"
import { OPO_FEATURE, getOpoConfig, patchOpoConfig } from "@/lib/opo/opo-config-service"
import { tenantRestReady, forwardToProtheus } from "@/lib/protheus-invest/forward"
import { PROTHEUS_LICENSE_SKU } from "@/lib/comercial/protheus-license"
import { cuitDigits, tenantLoginPath } from "@/lib/protheus-invest/tenant-url"

export type FleetRow = {
  empresaId: number
  nombre: string
  cuit: string
  modoLite: string | null
  restUrl: string
  restUser: string
  restReady: boolean
  origen: string
  lastPingAt: string | null
  lastPingOk: boolean | null
  licenseActive: boolean
  licenseUntil: string | null
  loginPath: string
}

function maskUrl(url: string) {
  if (!url) return ""
  try {
    const u = new URL(url)
    return `${u.protocol}//${u.host}${u.pathname.replace(/\/$/, "")}`
  } catch {
    return url.slice(0, 48)
  }
}

export async function listProtheusFleet(): Promise<FleetRow[]> {
  const [features, subs, modos] = await Promise.all([
    prisma.featureEmpresa.findMany({
      where: { featureKey: OPO_FEATURE },
      select: {
        empresaId: true,
        parametros: true,
        empresa: { select: { id: true, nombre: true, razonSocial: true, cuit: true, modoLite: true, temaConfig: true } },
      },
    }),
    prisma.suscripcionModulo.findMany({
      where: { sku: PROTHEUS_LICENSE_SKU },
      select: { empresaId: true, activo: true, vigenciaHasta: true },
    }),
    prisma.empresa.findMany({
      where: { modoLite: "protheus" },
      select: { id: true, nombre: true, razonSocial: true, cuit: true, modoLite: true, temaConfig: true },
    }),
  ])

  const byId = new Map<number, FleetRow>()

  function upsertEmpresa(e: {
    id: number
    nombre: string
    razonSocial: string
    cuit: string
    modoLite: string | null
    temaConfig?: unknown
  }) {
    if (byId.has(e.id)) return
    const tema = (e.temaConfig ?? {}) as Record<string, unknown>
    const slug =
      (typeof tema.protheusSlug === "string" && tema.protheusSlug) || cuitDigits(e.cuit) || String(e.id)
    byId.set(e.id, {
      empresaId: e.id,
      nombre: e.razonSocial || e.nombre,
      cuit: e.cuit,
      modoLite: e.modoLite,
      restUrl: "",
      restUser: "",
      restReady: false,
      origen: "claver_db",
      lastPingAt: null,
      lastPingOk: null,
      licenseActive: false,
      licenseUntil: null,
      loginPath: tenantLoginPath(slug),
    })
  }

  for (const m of modos) upsertEmpresa(m)

  for (const f of features) {
    upsertEmpresa(f.empresa)
    const p = (f.parametros ?? {}) as Record<string, unknown>
    const row = byId.get(f.empresaId)!
    const restUrl = typeof p.restDirectUrl === "string" ? p.restDirectUrl : ""
    const origen = typeof p.origen === "string" ? p.origen : row.origen
    if (origen !== "protheus" && !restUrl && f.empresa.modoLite !== "protheus") {
      continue
    }
    row.restUrl = maskUrl(restUrl)
    row.restUser = typeof p.restAuthUser === "string" ? p.restAuthUser : ""
    row.origen = origen
    row.restReady = Boolean(restUrl && p.restAuthUser && p.restAuthPassword)
    row.lastPingAt = typeof p.bridgeTestedAt === "string" ? p.bridgeTestedAt : null
    row.lastPingOk = typeof p.bridgeTestOk === "boolean" ? p.bridgeTestOk : null
  }

  for (const s of subs) {
    const row = byId.get(s.empresaId)
    if (!row) continue
    const vig = s.vigenciaHasta ? s.vigenciaHasta.getTime() >= Date.now() : true
    row.licenseActive = s.activo && vig
    row.licenseUntil = s.vigenciaHasta?.toISOString() ?? null
  }

  return [...byId.values()]
    .filter((r) => r.origen === "protheus" || r.restReady || r.modoLite === "protheus" || r.licenseActive)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
}

export async function pingProtheusTenant(empresaId: number) {
  const config = await getOpoConfig(empresaId)
  if (!tenantRestReady(config)) {
    return { ok: false, status: 412, ms: 0, error: "REST no configurado" as string | undefined }
  }
  const result = await forwardToProtheus({
    baseUrl: config.restDirectUrl!.trim(),
    user: config.restAuthUser!.trim(),
    password: config.restAuthPassword || "",
    method: "GET",
    path: "/api/claver/v1/investments/health",
  })
  await patchOpoConfig(empresaId, {
    bridgeTestedAt: new Date().toISOString(),
    bridgeTestOk: result.ok,
  })
  await prisma.sistemaLog.create({
    data: {
      empresaId,
      categoria: "protheus_ping",
      severidad: result.ok ? "info" : "warn",
      mensaje: `ping health ${result.status} ${result.ms}ms`,
      metadata: { status: result.status, ms: result.ms, ok: result.ok, error: result.error ?? null },
    },
  })
  return { ok: result.ok, status: result.status, ms: result.ms, error: result.error }
}

export async function listProtheusAudit(opts?: { empresaId?: number; take?: number }) {
  return prisma.sistemaLog.findMany({
    where: {
      categoria: { in: ["protheus_proxy", "protheus_ping"] },
      ...(opts?.empresaId ? { empresaId: opts.empresaId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 80,
    select: {
      id: true,
      empresaId: true,
      categoria: true,
      severidad: true,
      mensaje: true,
      metadata: true,
      createdAt: true,
    },
  })
}

export async function logProtheusProxy(input: {
  empresaId: number
  method: string
  path: string
  ok: boolean
  status: number
  ms: number
  error?: string
}) {
  try {
    await prisma.sistemaLog.create({
      data: {
        empresaId: input.empresaId,
        categoria: "protheus_proxy",
        severidad: input.ok ? "info" : "warn",
        mensaje: `${input.method} ${input.path} → ${input.status} (${input.ms}ms)`,
        metadata: {
          method: input.method,
          path: input.path,
          status: input.status,
          ms: input.ms,
          ok: input.ok,
          error: input.error ?? null,
        },
      },
    })
  } catch {
    /* no bloquear el proxy */
  }
}
