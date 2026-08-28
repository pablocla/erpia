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
    skus: ["pos.fiado_barrio", "core.claver"],
    mode: "any",
    mensaje: "Caja y mostrador: activá la libreta gratis o el plan POS.",
  },
  {
    prefix: "/api/caja",
    skus: ["pos.fiado_barrio", "core.claver"],
    mode: "any",
    mensaje: "La caja va con la libreta gratis o el plan POS.",
  },
  {
    prefix: "/api/ventas",
    skus: ["pos.fiado_barrio", "core.claver"],
    mode: "any",
    mensaje: "El ticket interno va con la libreta/mostrador. La factura AFIP es extra.",
  },
  {
    prefix: "/api/stock",
    skus: ["pos.fiado_barrio", "core.claver"],
    mode: "any",
    mensaje: "Stock básico va con el mostrador gratis. Activá la libreta o el plan POS.",
  },
  {
    prefix: "/api/productos",
    skus: ["pos.fiado_barrio", "core.claver"],
    mode: "any",
    mensaje: "Alta de productos va con el mostrador gratis.",
  },
  {
    prefix: "/api/oficios",
    skus: ["niche.oficios", "core.claver"],
    mode: "any",
    mensaje: "Presupuestos de oficio: activá Claver Oficios (ancla) o el plan.",
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
    skus: ["fiscal.cert_afip", "core.claver"],
    mode: "any",
    mensaje: "Factura electrónica AFIP requiere el módulo fiscal activo.",
  },
  {
    prefix: "/api/whatsapp",
    skus: ["intang.cobranzas_wa", "com.whatsapp", "channel.whatsapp", "core.claver"],
    mode: "any",
    mensaje: "El envío de WhatsApp requiere el módulo Claver Cobrá activo.",
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