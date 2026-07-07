/**
 * Mapeo ruta API → SKU(s) requeridos para escritura (POST/PUT/PATCH/DELETE).
 * Permite ancla gratis (fiado) mientras bloquea POS/caja vencidos.
 */

export type SkuMatchMode = "any" | "all"

export interface RutaSkuRule {
  prefix: string
  skus: string[]
  mode?: SkuMatchMode
  /** Mensaje 402 personalizado */
  mensaje?: string
}

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

/** Rutas más específicas primero */
export const RUTAS_SKU_ESCRITURA: RutaSkuRule[] = [
  {
    prefix: "/api/fiado",
    skus: ["pos.fiado_barrio"],
    mensaje: "Tu libreta fiado no está activa. Activá Claver Fiado desde el panel.",
  },
  {
    prefix: "/api/pos",
    skus: ["core.claver"],
    mensaje: "Caja y POS requieren suscripción. Activá el plan desde el panel de upgrade.",
  },
  {
    prefix: "/api/caja",
    skus: ["core.claver"],
    mensaje: "La caja requiere suscripción POS activa.",
  },
  {
    prefix: "/api/ventas",
    skus: ["core.claver"],
    mensaje: "Ventas y facturación requieren suscripción POS activa.",
  },
  {
    prefix: "/api/stock",
    skus: ["core.claver"],
    mensaje: "Stock requiere suscripción POS activa.",
  },
  {
    prefix: "/api/productos",
    skus: ["core.claver"],
    mensaje: "Alta de productos requiere suscripción POS activa.",
  },
  {
    prefix: "/api/compras",
    skus: ["core.claver"],
    mensaje: "Compras requiere suscripción POS activa.",
  },
  {
    prefix: "/api/cuentas-cobrar",
    skus: ["intang.cobranzas_wa", "core.claver", "pos.fiado_barrio"],
    mode: "any",
    mensaje: "Cobranzas requiere Claver Cobrá, Fiado o POS activo.",
  },
  {
    prefix: "/api/cuentas-pagar",
    skus: ["core.claver"],
    mensaje: "Cuentas por pagar requiere suscripción POS activa.",
  },
  {
    prefix: "/api/afip",
    skus: ["core.claver"],
    mensaje: "Factura electrónica requiere suscripción POS activa.",
  },
  {
    prefix: "/api/ai",
    skus: ["core.ia"],
    mensaje: "Claver IA requiere el motor IA activo. Activá core.ia desde el marketplace o Mi plan.",
  },
]

export function reglaSkuParaRuta(pathname: string, method: string): RutaSkuRule | null {
  if (!WRITE_METHODS.has(method)) return null
  return RUTAS_SKU_ESCRITURA.find((r) => pathname.startsWith(r.prefix)) ?? null
}