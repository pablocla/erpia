/**
 * Matriz canónica de navegación por rubro / pack.
 * Fuente de verdad para sidebar allowlist (modo completo con rubro conocido),
 * top actions y coherencia shell.
 */

import type { Rubro } from "@/lib/onboarding/onboarding-ia"
import { normalizeRubroValue } from "@/lib/onboarding/onboarding-ia"
import type { ModoLite } from "@/lib/comercial/pack-calle-catalog"

/** Rutas siempre disponibles (cuenta, config liviana) */
export const NAV_SHARED_PATHS = [
  "/dashboard",
  "/dashboard/mis-tareas",
  "/dashboard/configuracion",
  "/dashboard/mi-plan",
  "/dashboard/usuarios",
  "/dashboard/empleados-digitales",
  "/dashboard/apps",
  "/dashboard/documentacion",
  "/dashboard/capacitacion",
  "/dashboard/trial-vencido",
  "/dashboard/soporte",
  "/dashboard/especialista",
  "/dashboard/alertas",
  "/dashboard/centro-alertas",
] as const

const RETAIL_CORE = [
  ...NAV_SHARED_PATHS,
  "/dashboard/pos",
  "/dashboard/caja",
  "/dashboard/productos",
  "/dashboard/clientes",
  "/dashboard/fiado",
  "/dashboard/cuentas-cobrar",
  "/dashboard/ventas",
  "/dashboard/compras",
  "/dashboard/proveedores",
  "/dashboard/remitos",
  "/dashboard/listas-precio",
  "/dashboard/notas-credito",
  "/dashboard/impuestos",
  "/dashboard/puntos-venta",
  "/dashboard/series",
  "/dashboard/mercadopago",
]

const SERVICE_CORE = [
  ...NAV_SHARED_PATHS,
  "/dashboard/clientes",
  "/dashboard/agenda",
  "/dashboard/ventas",
  "/dashboard/ventas/presupuestos",
  "/dashboard/cuentas-cobrar",
  "/dashboard/caja",
  "/dashboard/productos",
  "/dashboard/fiado",
  "/dashboard/facturacion-recurrente",
  "/dashboard/impuestos",
  "/dashboard/mercadopago",
]

/** Paths core por rubro (modo completo con oficio conocido) */
export const NAV_PATHS_BY_RUBRO: Partial<Record<Rubro, string[]>> = {
  kiosco: [...RETAIL_CORE],
  ferreteria: [...RETAIL_CORE, "/dashboard/almacen"],
  farmacia: [...RETAIL_CORE],
  supermercado: [...RETAIL_CORE, "/dashboard/almacen"],
  ropa: [...RETAIL_CORE],
  libreria: [...RETAIL_CORE],
  estacion_servicio: [...RETAIL_CORE],
  distribuidora: [
    ...RETAIL_CORE,
    "/dashboard/almacen",
    "/dashboard/ventas/pedidos",
    "/dashboard/picking",
    "/dashboard/logistica",
  ],
  bar_restaurant: [
    ...NAV_SHARED_PATHS,
    "/dashboard/hospitalidad",
    "/dashboard/hospitalidad/kds",
    "/dashboard/hospitalidad/platos",
    "/dashboard/hospitalidad/delivery",
    "/dashboard/hospitalidad/cartelera",
    "/dashboard/toma-pedidos",
    "/dashboard/pos",
    "/dashboard/caja",
    "/dashboard/productos",
    "/dashboard/clientes",
    "/dashboard/compras",
    "/dashboard/proveedores",
    "/dashboard/ventas",
    "/dashboard/cuentas-cobrar",
    "/dashboard/impuestos",
  ],
  veterinaria: [
    ...SERVICE_CORE,
    "/dashboard/historia-clinica",
    "/dashboard/veterinaria",
    "/dashboard/pos",
  ],
  clinica: [...SERVICE_CORE, "/dashboard/historia-clinica"],
  salon_belleza: [...SERVICE_CORE, "/dashboard/peluqueria", "/dashboard/pos"],
  gimnasio: [...SERVICE_CORE, "/dashboard/membresias"],
  canchas: [...SERVICE_CORE],
  agro_acopio: [
    ...NAV_SHARED_PATHS,
    "/dashboard/agro",
    "/dashboard/agro/balanza",
    "/dashboard/agro/contratos",
    "/dashboard/agro/liquidaciones",
    "/dashboard/agro/pizarra",
    "/dashboard/agro/lotes",
    "/dashboard/agro/iot",
    "/dashboard/agro/carta-porte",
    "/dashboard/agro/productor",
    "/dashboard/clientes",
    "/dashboard/proveedores",
    "/dashboard/cuentas-cobrar",
    "/dashboard/cuentas-pagar",
    "/dashboard/caja",
    "/dashboard/banco",
    "/dashboard/contabilidad",
    "/dashboard/impuestos",
  ],
  agro_cannabis: [
    ...NAV_SHARED_PATHS,
    "/dashboard/agro",
    "/dashboard/agro/cannabis",
    "/dashboard/agro/cannabis/ciclos",
    "/dashboard/agro/cannabis/insumos",
    "/dashboard/agro/cannabis/aplicaciones",
    "/dashboard/agro/cannabis/suelo",
    "/dashboard/productos",
    "/dashboard/clientes",
    "/dashboard/compras",
    "/dashboard/caja",
  ],
  prestamista: [
    ...NAV_SHARED_PATHS,
    "/dashboard/prestamos",
    "/dashboard/prestamos/pagares",
    "/dashboard/prestamos/cobranza",
    "/dashboard/clientes",
    "/dashboard/cuentas-cobrar",
    "/dashboard/caja",
    "/dashboard/banco",
  ],
  concesionaria: [
    ...NAV_SHARED_PATHS,
    "/dashboard/concesionaria",
    "/dashboard/clientes",
    "/dashboard/ventas",
    "/dashboard/caja",
    "/dashboard/cuentas-cobrar",
    "/dashboard/crm",
  ],
  importador: [
    ...NAV_SHARED_PATHS,
    "/dashboard/importacion",
    "/dashboard/compras",
    "/dashboard/proveedores",
    "/dashboard/productos",
    "/dashboard/cuentas-pagar",
    "/dashboard/caja",
  ],
  reventa_tendencias: [
    ...NAV_SHARED_PATHS,
    "/dashboard/productos",
    "/dashboard/clientes",
    "/dashboard/ventas",
    "/dashboard/caja",
  ],
  quimica: [
    ...RETAIL_CORE,
    "/dashboard/industria",
    "/dashboard/calidad",
  ],
  textil_fabrica: [
    ...RETAIL_CORE,
    "/dashboard/industria",
    "/dashboard/productos",
    "/dashboard/compras",
    "/dashboard/caja",
  ],
}

export type TopActionId = "pos" | "caja" | "afip" | "agenda" | "mesas" | "cobrar" | "fiado"

export function getTopActionsForContext(opts: {
  rubro?: string | null
  modoLite?: string | null
}): TopActionId[] {
  const modo = opts.modoLite || "completo"
  if (modo === "fiado") return ["fiado", "pos", "caja"]
  if (modo === "cobranza") return ["cobrar"]
  if (modo === "pos") return ["pos", "caja"]
  if (modo === "servicios") return ["agenda", "cobrar"]
  if (modo === "niche") return ["agenda"]

  const rubro = normalizeRubroValue(opts.rubro)
  if (rubro === "bar_restaurant") return ["mesas", "caja", "pos"]
  if (rubro === "veterinaria" || rubro === "clinica" || rubro === "salon_belleza" || rubro === "gimnasio" || rubro === "canchas") {
    return ["agenda", "cobrar", "caja"]
  }
  if (rubro === "kiosco" || rubro === "ferreteria" || rubro === "supermercado" || rubro === "farmacia") {
    return ["pos", "caja", "fiado"]
  }
  if (rubro === "otro") return ["pos", "caja", "afip"]
  return ["pos", "caja"]
}

/**
 * Allowlist de paths para sidebar cuando el rubro es un oficio conocido.
 * null = no restringir por matriz (ERP completo / otro).
 */
export function getNavAllowlistForRubro(rubroRaw: string | null | undefined): string[] | null {
  const rubro = normalizeRubroValue(rubroRaw)
  if (rubro === "otro") return null
  const paths = NAV_PATHS_BY_RUBRO[rubro]
  if (!paths?.length) return null
  return [...new Set(paths)]
}

/** ¿Este modoLite debe usar solo LITE_MENU_PATHS (no matriz rubro)? */
export function isPackLiteMode(modoLite: string | null | undefined): boolean {
  const m = (modoLite || "completo") as ModoLite
  return m !== "completo"
}

/**
 * Default de modoLite al crear empresa según rubro o producto.
 * Evita "completo" en altas nuevas (ruido de menú).
 */
export function defaultModoLiteForRubro(rubroRaw?: string | null): ModoLite {
  const rubro = normalizeRubroValue(rubroRaw)
  if (rubro === "bar_restaurant") return "pos"
  if (
    rubro === "veterinaria" ||
    rubro === "clinica" ||
    rubro === "salon_belleza" ||
    rubro === "gimnasio" ||
    rubro === "canchas"
  ) {
    return "niche"
  }
  if (rubro === "kiosco" || rubro === "ferreteria" || rubro === "supermercado") return "pos"
  // Alta genérica web: POS liviano, no ERP completo
  return "pos"
}
