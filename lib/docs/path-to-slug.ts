export interface DocRouteMapping {
  /** Ruta dashboard exacta o prefijo (más específico gana) */
  pathname: string
  /** Slug relativo sin extensión, ej: "funcional/sistema-pos" */
  slug: string
  /** Si true, matchea pathname.startsWith(pathname) */
  prefix?: boolean
}

export const DOC_ROUTE_MAP: DocRouteMapping[] = [
  // POS y Ventas
  { pathname: "/dashboard/pos/cierre", slug: "funcional/sistema-pos" },
  { pathname: "/dashboard/pos", slug: "funcional/sistema-pos", prefix: true },
  { pathname: "/dashboard/ventas/pedidos", slug: "funcional/sistema-pos" },
  { pathname: "/dashboard/ventas/presupuestos", slug: "funcional/sistema-pos" },
  { pathname: "/dashboard/ventas", slug: "funcional/sistema-pos", prefix: true },
  { pathname: "/dashboard/clientes", slug: "funcional/maestros-clientes", prefix: true },
  { pathname: "/dashboard/listas-precio", slug: "funcional/sistema-pos" },
  { pathname: "/dashboard/notas-credito", slug: "funcional/sistema-pos" },
  { pathname: "/dashboard/facturacion-recurrente", slug: "funcional/sistema-pos" },
  
  // Compras y Proveedores
  { pathname: "/dashboard/compras", slug: "funcional/especificacion-erp", prefix: true },
  { pathname: "/dashboard/proveedores", slug: "funcional/maestros-clientes", prefix: true },
  { pathname: "/dashboard/remitos", slug: "funcional/logistica", prefix: true },
  
  // Stock y Logística
  { pathname: "/dashboard/productos/inventario", slug: "funcional/sistema-pos" },
  { pathname: "/dashboard/productos/transferencias", slug: "funcional/logistica" },
  { pathname: "/dashboard/productos", slug: "funcional/sistema-pos", prefix: true },
  { pathname: "/dashboard/logistica", slug: "funcional/logistica", prefix: true },
  { pathname: "/dashboard/distribucion", slug: "funcional/logistica", prefix: true },
  { pathname: "/dashboard/picking", slug: "funcional/logistica", prefix: true },

  // Financiero y Contabilidad
  { pathname: "/dashboard/caja", slug: "funcional/tesoreria", prefix: true },
  { pathname: "/dashboard/banco", slug: "funcional/tesoreria", prefix: true },
  { pathname: "/dashboard/cuentas-cobrar", slug: "funcional/tesoreria", prefix: true },
  { pathname: "/dashboard/cuentas-pagar", slug: "funcional/tesoreria", prefix: true },
  { pathname: "/dashboard/cheques", slug: "funcional/tesoreria", prefix: true },
  { pathname: "/dashboard/cashflow", slug: "funcional/tesoreria", prefix: true },
  { pathname: "/dashboard/presupuesto", slug: "funcional/tesoreria", prefix: true },
  { pathname: "/dashboard/mercadopago", slug: "funcional/tesoreria", prefix: true },
  { pathname: "/dashboard/contabilidad/plan-cuentas", slug: "funcional/tesoreria" },
  { pathname: "/dashboard/contabilidad/balance", slug: "funcional/tesoreria" },
  { pathname: "/dashboard/contabilidad/periodos", slug: "funcional/tesoreria" },
  { pathname: "/dashboard/contabilidad/activos-fijos", slug: "funcional/tesoreria" },
  { pathname: "/dashboard/contabilidad/centros-costo", slug: "funcional/tesoreria" },
  { pathname: "/dashboard/contabilidad", slug: "funcional/tesoreria", prefix: true },

  // Impuestos
  { pathname: "/dashboard/impuestos/iibb", slug: "funcional/tesoreria" },
  { pathname: "/dashboard/impuestos/padron", slug: "funcional/tesoreria" },
  { pathname: "/dashboard/impuestos/tes", slug: "funcional/tesoreria" },
  { pathname: "/dashboard/impuestos/citi", slug: "funcional/tesoreria" },
  { pathname: "/dashboard/impuestos/sicore", slug: "funcional/tesoreria" },
  { pathname: "/dashboard/impuestos", slug: "funcional/tesoreria", prefix: true },
  { pathname: "/dashboard/puntos-venta", slug: "funcional/sistema-pos" },
  { pathname: "/dashboard/series", slug: "funcional/sistema-pos" },

  // Rubros específicos
  { pathname: "/dashboard/hospitalidad/platos", slug: "funcional/rubros/otros-rubros" },
  { pathname: "/dashboard/hospitalidad/kds", slug: "funcional/rubros/otros-rubros" },
  { pathname: "/dashboard/hospitalidad", slug: "funcional/rubros/otros-rubros", prefix: true },
  { pathname: "/dashboard/agenda", slug: "funcional/rubros/otros-rubros", prefix: true },
  { pathname: "/dashboard/veterinaria", slug: "funcional/rubros/veterinaria", prefix: true },
  { pathname: "/dashboard/historia-clinica", slug: "funcional/rubros/veterinaria", prefix: true },

  // IA y Onboarding
  { pathname: "/dashboard/onboarding", slug: "funcional/modulo-ia", prefix: true },
  { pathname: "/dashboard/ia", slug: "funcional/modulo-ia", prefix: true },
  
  // Automatización
  { pathname: "/dashboard/automatizacion", slug: "funcional/automation-hub", prefix: true },
  
  // Capacitación y Documentación
  { pathname: "/dashboard/capacitacion", slug: "funcional/manuales/operacion-diaria", prefix: true },
  { pathname: "/dashboard/documentacion", slug: "index", prefix: true },
]

export function resolveDocSlug(pathname: string): string {
  // Normalize by removing trailing slash if present
  const cleanPath = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname

  // 1. Match exact paths first
  const exactMatch = DOC_ROUTE_MAP.find(m => !m.prefix && m.pathname === cleanPath)
  if (exactMatch) return exactMatch.slug

  // 2. Match prefixes, sorted by longest pathname length first so that more specific prefix wins
  const prefixMatches = DOC_ROUTE_MAP.filter(m => m.prefix && cleanPath.startsWith(m.pathname))
  if (prefixMatches.length > 0) {
    prefixMatches.sort((a, b) => b.pathname.length - a.pathname.length)
    return prefixMatches[0].slug
  }

  // 3. Fallback
  return "index"
}
