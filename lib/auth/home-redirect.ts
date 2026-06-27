/**
 * Destinos post-login — Claver Cloud (analistas) vs ERP tenant (clientes)
 */

import { DEMO_ADMIN_EMAIL } from "@/lib/brand"
import { parseJwtPayload } from "@/lib/auth/session-client"

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
  if (opts.rol === ANALYST_ROLE) return true
  return true
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
}): string {
  const next = opts.nextPath?.trim()
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next
  }
  if (shouldRedirectAnalystToCloud({ email: opts.email, rol: opts.rol, isAnalyst: opts.isAnalyst })) {
    return CLAVER_CLOUD_HOME
  }
  return getHomePathForRol(opts.rol)
}

export async function fetchIsClaverAnalyst(token: string): Promise<boolean> {
  try {
    const res = await fetch("/api/claver/analista/status", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return false
    const data = (await res.json()) as { isAnalyst?: boolean }
    return Boolean(data.isAnalyst)
  } catch {
    return false
  }
}

export async function resolvePostLoginPathAsync(
  token: string,
  rol: string,
  nextPath?: string | null,
  email?: string | null,
): Promise<string> {
  const isAnalyst = await fetchIsClaverAnalyst(token)
  const payload = parseJwtPayload(token)
  const resolvedEmail =
    email ?? (typeof payload?.email === "string" ? String(payload.email) : undefined)
  return resolvePostLoginPath({ rol, email: resolvedEmail, nextPath, isAnalyst })
}