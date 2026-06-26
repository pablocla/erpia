/**
 * Destinos post-login — Claver Cloud (analistas) vs ERP tenant (clientes)
 */

export const CLAVER_CLOUD_HOME = "/claver-cloud"

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
  nextPath?: string | null
  isAnalyst?: boolean
}): string {
  const next = opts.nextPath?.trim()
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next
  }
  if (opts.isAnalyst) return CLAVER_CLOUD_HOME
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
): Promise<string> {
  const isAnalyst = await fetchIsClaverAnalyst(token)
  return resolvePostLoginPath({ rol, nextPath, isAnalyst })
}