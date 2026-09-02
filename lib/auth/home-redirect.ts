/**
 * Destinos post-login — Claver Cloud (analistas) vs ERP tenant (clientes)
 */

import { DEMO_ADMIN_EMAIL } from "@/lib/brand"
import { parseJwtPayload } from "@/lib/auth/session-client"
import { getGoldenPathForRubro } from "@/lib/comercial/industry-templates"
import { isAdminRole } from "@/lib/auth/admin-roles"
import { resolveRubroSignup } from "@/lib/comercial/rubro-signup"

export const CLAVER_CLOUD_HOME = "/claver-cloud"

const ANALYST_ROLE = "analista_claver"

/**
 * Analistas reales → Cloud. La cuenta demo pública va al ERP para testing/demos.
 */
export function shouldRedirectAnalystToCloud(opts: {
  email?: string | null
  rol?: string | null
  isAnalyst?: boolean
}): boolean {
  if (!opts.isAnalyst) return false
  const email = opts.email?.trim().toLowerCase()
  if (email === DEMO_ADMIN_EMAIL.toLowerCase()) return false
  
  // If explicitly flagged as analyst via JWT, or role is analista_claver
  if (opts.isAnalyst || opts.rol === ANALYST_ROLE) return true
  return false
}

export function getHomePathForRol(rol: string): string {
  const map: Record<string, string> = {
    analista_claver: CLAVER_CLOUD_HOME,
    cajero: "/dashboard/pos",
    vendedor: "/dashboard/ventas",
    mozo: "/dashboard/hospitalidad",
    deposito: "/dashboard/picking",
    contador: "/dashboard/impuestos",
    administrador: "/dashboard",
    vendedor_ruta: "/vendedor",
    personal_servicio: "/dashboard/agenda",
    profesional: "/dashboard/agenda",
    gerente: "/dashboard",
    dueno: "/dashboard",
    admin: "/dashboard",
  }
  return map[rol] ?? "/dashboard"
}

/** Resuelve destino tras login (sync). Preferir `resolvePostLoginPathAsync` en cliente. */
export function resolvePostLoginPath(opts: {
  rol: string
  email?: string | null
  nextPath?: string | null
  isAnalyst?: boolean
  rubro?: string | null
}): string {
  const next = opts.nextPath?.trim()
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next
  }
  if (shouldRedirectAnalystToCloud({ email: opts.email, rol: opts.rol, isAnalyst: opts.isAnalyst })) {
    return CLAVER_CLOUD_HOME
  }
  const isDemoAccount =
    opts.email?.trim().toLowerCase() === DEMO_ADMIN_EMAIL.toLowerCase()
  if (opts.rubro && (isDemoAccount || isAdminRole(opts.rol))) {
    const door = resolveRubroSignup(opts.rubro)
    if (door) return door.landingPath
    return getGoldenPathForRubro(opts.rubro)
  }
  return getHomePathForRol(opts.rol)
}

function isPublicDemoEmail(email?: string | null): boolean {
  const e = email?.trim().toLowerCase() ?? ""
  if (!e) return false
  if (e === DEMO_ADMIN_EMAIL.toLowerCase()) return true
  return e.startsWith("demo-") && e.endsWith("@claver.com.ar")
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  ms: number,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchClaverAnalystStatus(token: string): Promise<{
  authenticated: boolean
  isAnalyst: boolean
  email?: string
}> {
  try {
    const res = await fetchWithTimeout(
      "/api/claver/analista/status",
      { headers: { Authorization: `Bearer ${token}` } },
      4000,
    )
    if (!res.ok) return { authenticated: false, isAnalyst: false }
    const data = (await res.json()) as {
      authenticated?: boolean
      isAnalyst?: boolean
      email?: string
    }
    return {
      authenticated: Boolean(data.authenticated),
      isAnalyst: Boolean(data.isAnalyst),
      email: typeof data.email === "string" ? data.email : undefined,
    }
  } catch {
    return { authenticated: false, isAnalyst: false }
  }
}

export async function fetchIsClaverAnalyst(token: string): Promise<boolean> {
  const status = await fetchClaverAnalystStatus(token)
  return status.isAnalyst
}

async function fetchEmpresaRubro(token: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      "/api/config/empresa",
      { headers: { Authorization: `Bearer ${token}` } },
      4000,
    )
    if (!res.ok) return null
    const data = (await res.json()) as { rubro?: string }
    return data.rubro ?? null
  } catch {
    return null
  }
}

export async function resolvePostLoginPathAsync(
  token: string,
  rol: string,
  nextPath?: string | null,
  email?: string | null,
): Promise<string> {
  const payload = parseJwtPayload(token)
  const resolvedEmail =
    email ?? (typeof payload?.email === "string" ? String(payload.email) : undefined)

  const next = nextPath?.trim()
  const nextIsInternal = Boolean(next && next.startsWith("/") && !next.startsWith("//"))

  // Demos públicas: nunca van a Claver Cloud; home por rol
  if (isPublicDemoEmail(resolvedEmail)) {
    if (nextIsInternal && next && !next.startsWith("/claver-cloud")) return next
    return getHomePathForRol(rol)
  }

  // nextPath interno (ej. goldenPath) — no hacer round-trips extra,
  // salvo /claver-cloud: hay que saber si el token es válido (si no, el
  // middleware redirige a /login?next=… y se arma un loop).
  if (nextIsInternal && next && !next.startsWith("/claver-cloud")) {
    return next
  }

  const status = await fetchClaverAnalystStatus(token)
  if (nextIsInternal && next?.startsWith("/claver-cloud")) {
    if (status.authenticated) return next
    return getHomePathForRol(rol)
  }

  const rubro = await fetchEmpresaRubro(token)
  return resolvePostLoginPath({
    rol,
    email: resolvedEmail,
    nextPath,
    isAnalyst: status.isAnalyst,
    rubro,
  })
}