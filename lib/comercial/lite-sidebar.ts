/**
 * Menú lateral según modo lite del comercio (fiado / cobranza / pos / completo).
 */

import type { ModoLite } from "@/lib/comercial/pack-calle-catalog"

const LITE_SHARED = ["/dashboard/mi-plan", "/dashboard/apps", "/dashboard/trial-vencido"]

/** Rutas permitidas con ancla fiado gratis aunque el trial de pago haya vencido */
export const ANCLA_FIADO_ALLOWLIST = [
  "/dashboard",
  "/dashboard/fiado",
  "/dashboard/pos",
  "/dashboard/caja",
  "/dashboard/productos",
  "/dashboard/clientes",
  "/dashboard/cuentas-cobrar",
  "/dashboard/configuracion",
  "/dashboard/mi-plan",
  "/dashboard/apps",
  "/dashboard/trial-vencido",
] as const

export function isPathInAnclaFiadoAllowlist(pathname: string): boolean {
  return ANCLA_FIADO_ALLOWLIST.some(
    (p) => pathname === p || (p !== "/dashboard" && pathname.startsWith(`${p}/`)) || pathname === "/dashboard",
  )
}

export const LITE_MENU_PATHS: Record<ModoLite, string[]> = {
  /** ED-17: shell mínimo para vender Leo standalone */
  leo: [
    "/dashboard",
    "/dashboard/empleados-digitales",
    "/dashboard/clientes",
    "/dashboard/cuentas-cobrar",
    "/dashboard/fiado",
    "/dashboard/configuracion",
    ...LITE_SHARED,
  ],
  fiado: [
    "/dashboard",
    "/dashboard/fiado",
    "/dashboard/pos",
    "/dashboard/caja",
    "/dashboard/productos",
    "/dashboard/clientes",
    "/dashboard/cuentas-cobrar",
    "/dashboard/configuracion",
    ...LITE_SHARED,
  ],
  cobranza: [
    "/dashboard",
    "/dashboard/cuentas-cobrar",
    "/dashboard/clientes",
    "/dashboard/fiado",
    "/dashboard/empleados-digitales",
    "/dashboard/facturacion-recurrente",
    "/dashboard/ventas",
    "/dashboard/configuracion",
    ...LITE_SHARED,
  ],
  pos: [
    "/dashboard",
    "/dashboard/pos",
    "/dashboard/caja",
    "/dashboard/productos",
    "/dashboard/clientes",
    "/dashboard/fiado",
    "/dashboard/configuracion",
    ...LITE_SHARED,
  ],
  completo: [],
  niche: [
    "/dashboard",
    "/dashboard/oficios",
    "/dashboard/oficios/nuevo",
    "/dashboard/oficios/cuadrilla",
    "/dashboard/fumigacion",
    "/dashboard/ot",
    "/dashboard/ventas",
    "/dashboard/facturacion-recurrente",
    "/dashboard/afiliados",
    "/dashboard/nicho",
    "/dashboard/historia-clinica",
    "/dashboard/clientes",
    "/dashboard/cuentas-cobrar",
    "/dashboard/productos",
    "/dashboard/caja",
    "/dashboard/configuracion",
    ...LITE_SHARED,
  ],
  servicios: [
    "/dashboard",
    "/dashboard/oficios",
    "/dashboard/oficios/nuevo",
    "/dashboard/oficios/cuadrilla",
    "/dashboard/clientes",
    "/dashboard/cuentas-cobrar",
    "/dashboard/productos",
    "/dashboard/caja",
    "/dashboard/configuracion",
    ...LITE_SHARED,
  ],
  fumigacion: [
    "/dashboard",
    "/dashboard/fumigacion",
    "/dashboard/ot",
    "/dashboard/clientes",
    "/dashboard/ventas",
    "/dashboard/configuracion",
    ...LITE_SHARED,
  ],
  prestamista: [
    "/dashboard",
    "/dashboard/prestamos",
    "/dashboard/prestamos/cobranza",
    "/dashboard/prestamos/pagares",
    "/dashboard/clientes",
    "/dashboard/cuentas-cobrar",
    "/dashboard/caja",
    "/dashboard/configuracion",
    ...LITE_SHARED,
  ],
  asociacion: [
    "/dashboard",
    "/dashboard/grow",
    "/dashboard/clientes",
    "/dashboard/configuracion",
    ...LITE_SHARED,
  ],
}

export function isMenuItemAllowedInModoLite(href: string, modoLite: ModoLite): boolean {
  if (modoLite === "completo") return true
  const allowed = LITE_MENU_PATHS[modoLite]
  if (!allowed || !Array.isArray(allowed)) return true
  return allowed.some((path) =>
    path === "/dashboard" ? href === "/dashboard" : href === path || href.startsWith(`${path}/`),
  )
}

export function filterMenuItemsByModoLite<T extends { href: string }>(items: T[], modoLite: ModoLite): T[] {
  return items.filter((item) => isMenuItemAllowedInModoLite(item.href, modoLite))
}