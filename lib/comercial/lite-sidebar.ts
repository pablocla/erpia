/**
 * Menú lateral según modo lite del comercio (fiado / cobranza / pos / completo).
 */

import type { ModoLite } from "@/lib/comercial/pack-calle-catalog"

export const LITE_MENU_PATHS: Record<ModoLite, string[]> = {
  fiado: ["/dashboard", "/dashboard/fiado", "/dashboard/clientes", "/dashboard/configuracion"],
  cobranza: ["/dashboard", "/dashboard/cuentas-cobrar", "/dashboard/clientes", "/dashboard/configuracion"],
  pos: [
    "/dashboard",
    "/dashboard/pos",
    "/dashboard/caja",
    "/dashboard/productos",
    "/dashboard/clientes",
    "/dashboard/configuracion",
  ],
  completo: [],
  niche: [
    "/dashboard",
    "/dashboard/nicho",
    "/dashboard/apps",
    "/dashboard/clientes",
    "/dashboard/agenda",
    "/dashboard/fiado",
    "/dashboard/historia-clinica",
    "/dashboard/configuracion",
  ],
}

export function isMenuItemAllowedInModoLite(href: string, modoLite: ModoLite): boolean {
  if (modoLite === "completo") return true
  const allowed = LITE_MENU_PATHS[modoLite]
  return allowed.some((path) =>
    path === "/dashboard" ? href === "/dashboard" : href === path || href.startsWith(`${path}/`),
  )
}

export function filterMenuItemsByModoLite<T extends { href: string }>(items: T[], modoLite: ModoLite): T[] {
  return items.filter((item) => isMenuItemAllowedInModoLite(item.href, modoLite))
}