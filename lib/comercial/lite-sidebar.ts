/**
 * Menú lateral según modo lite del comercio (fiado / cobranza / pos / completo).
 */

import type { ModoLite } from "@/lib/comercial/pack-calle-catalog"

const LITE_SHARED = ["/dashboard/mi-plan", "/dashboard/apps", "/dashboard/trial-vencido"]

/** Rutas permitidas con ancla fiado gratis aunque el trial de pago haya vencido */
export const ANCLA_FIADO_ALLOWLIST = [
  "/dashboard",
  "/dashboard/fiado",
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
    "/dashboard/empleados-digitales",
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
    "/dashboard/nicho",
    "/dashboard/apps",
    "/dashboard/clientes",
    "/dashboard/agenda",
    "/dashboard/fiado",
    "/dashboard/historia-clinica",
    "/dashboard/configuracion",
    "/dashboard/mi-plan",
  ],
  servicios: [
    "/dashboard",
    "/dashboard/ventas/presupuestos",
    "/dashboard/ventas",
    "/dashboard/cuentas-cobrar",
    "/dashboard/agenda",
    "/dashboard/clientes",
    "/dashboard/configuracion",
    "/dashboard/mi-plan",
    "/dashboard/apps",
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