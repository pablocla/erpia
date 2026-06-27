/**
 * Enganche comercial sugerido por rubro — solo SKUs/bundles que existen hoy en marketplace.
 * Los packs "futuro" (kiosco/ferretería/panadería) quedan para pipeline manual.
 */

export const ENGANCHE_POR_RUBRO: Record<string, string> = {
  almacen: "pos.fiado_barrio",
  kiosco: "pool-almacen-rosario",
  ferreteria: "pos.core",
  carniceria: "pos.balanza_peso",
  fiambreria: "pos.balanza_peso",
  panaderia: "pos.fiado_barrio",
  indumentaria: "pos.core",
  farmacia: "pos.core",
  restaurant: "indefinido",
  otro: "indefinido",
}

/** Packs documentados pero aún sin bundle en marketplace — no auto-seleccionar */
export const ENGANCHES_SOLO_PIPELINE = new Set([
  "pool-kiosco-barrio",
  "pool-ferreteria",
  "pool-panaderia-produccion",
])

export function engancheSugeridoPorRubro(rubro: string): string {
  return ENGANCHE_POR_RUBRO[rubro] ?? "indefinido"
}