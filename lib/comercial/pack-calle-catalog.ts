/**
 * Catálogo comercial unificado — calle, relevamiento, marketplace y onboarding.
 * Fuente de verdad para: enganche → SKUs → modoLite → pantalla de entrada.
 */

import { ENGANCHES } from "@/lib/marketplace/enganche-catalog"
import { MARKETPLACE_BUNDLES } from "@/lib/marketplace/bundles"
import { ENGANCHE_POR_RUBRO } from "@/lib/ops/comercial-relevamiento-enganche"
import { NICHE_APPS } from "@/lib/niche/niche-apps-catalog"
import { MICRO_SAAS_PORTFOLIO } from "@/lib/comercial/micro-saas-portfolio"

export type ModoLite = "fiado" | "cobranza" | "pos" | "completo" | "niche" | "servicios" | "leo" | "fumigacion"

export interface PackCalle {
  id: string
  nombre: string
  lema: string
  precioArs: number
  modoLite: ModoLite
  tipo: "sku" | "pack"
  skus: string[]
  /** Ruta post-login para el comerciante */
  landingPath: string
  vendibleHoy: boolean
}

const LANDING: Record<ModoLite, string> = {
  fiado: "/dashboard/fiado",
  cobranza: "/dashboard/cuentas-cobrar",
  pos: "/dashboard/pos",
  completo: "/dashboard",
  niche: "/dashboard/nicho",
  servicios: "/dashboard/ventas/presupuestos",
  leo: "/dashboard/empleados-digitales/leo_cobranza",
  fumigacion: "/dashboard/fumigacion",
}

function packFromBundle(bundleId: string, modoLite: ModoLite, vendibleHoy = true): PackCalle | null {
  const b = MARKETPLACE_BUNDLES.find((x) => x.id === bundleId)
  if (!b) return null
  return {
    id: b.id,
    nombre: b.nombre,
    lema: b.lema,
    precioArs: b.precioPackArs,
    modoLite,
    tipo: "pack",
    skus: b.skus,
    landingPath: LANDING[modoLite],
    vendibleHoy,
  }
}

function packFromSku(sku: string, modoLite: ModoLite, vendibleHoy = true): PackCalle | null {
  const e = ENGANCHES.find((x) => x.sku === sku)
  if (!e) return null
  return {
    id: e.sku,
    nombre: e.nombre,
    lema: e.lema,
    precioArs: e.precioArs,
    modoLite,
    tipo: "sku",
    skus: [e.sku],
    landingPath: LANDING[modoLite],
    vendibleHoy,
  }
}

/** Packs y SKUs que el vendedor puede ofrecer hoy en calle */
export const PACKS_CALLE: PackCalle[] = [
  packFromSku("pos.fiado_barrio", "fiado")!,
  packFromSku("intang.cobranzas_wa", "cobranza")!,
  packFromBundle("pool-almacen-barrio", "completo")!,
  packFromBundle("pool-claver-nicho", "niche")!,
  packFromBundle("pool-propiedad", "niche", true)!, // INMO-P0: liquidación + PDF + morosos + crons
  packFromBundle("pool-monotributo", "servicios")!,
  { ...packFromBundle("pool-servicios-pro", "servicios")!, landingPath: "/dashboard/agenda" },
  { ...packFromBundle("pool-obra", "niche")!, landingPath: "/dashboard/nicho/obras" },
  packFromBundle("pool-calle-nicho", "niche")!,
  packFromBundle("pool-servicios-barrio", "niche")!,
  packFromBundle("pool-escuela-barrio", "niche")!,
  packFromBundle("pool-deportes-barrio", "niche")!,
  packFromBundle("pool-almacen-rosario", "pos")!,
  packFromBundle("pool-kiosco-barrio", "pos")!,
  packFromSku("pos.balanza_peso", "pos")!,
  {
    id: "pos.core",
    nombre: "POS + Factura",
    lema: "Mostrador con factura AFIP.",
    precioArs: 0,
    modoLite: "pos",
    tipo: "sku",
    skus: ["core.claver"],
    landingPath: LANDING.pos,
    vendibleHoy: true,
  },
].filter(Boolean) as PackCalle[]

// Portfolio freemium 11 — solo SKUs aún no listados (evita duplicar fiado/cobrá)
const _packCalleIds = new Set(PACKS_CALLE.map((p) => p.id))
for (const p of MICRO_SAAS_PORTFOLIO.filter((x) => x.vendibleCalle)) {
  if (_packCalleIds.has(p.sku)) continue
  PACKS_CALLE.push({
    id: p.sku,
    nombre: p.marca,
    lema: p.lema,
    precioArs: p.precioArs,
    modoLite: p.modoLite,
    tipo: "sku",
    skus: [p.sku, ...(p.skusAdicionales ?? [])],
    landingPath: p.dashboardPath,
    vendibleHoy: p.estado === "disponible" || p.estado === "beta",
  })
  _packCalleIds.add(p.sku)
}

const MODO_POR_ENGANCHE: Record<string, ModoLite> = {
  "pos.fiado_barrio": "fiado",
  "empleado.leo_cobranza": "leo",
  "intang.cobranzas_wa": "cobranza",
  "pool-almacen-barrio": "completo",
  "pool-almacen-rosario": "pos",
  "pool-kiosco-barrio": "pos",
  "pool-cobra-recupera": "cobranza",
  "pool-claver-nicho": "niche",
  "pool-propiedad": "niche",
  "pool-monotributo": "servicios",
  "pool-servicios-pro": "servicios",
  "pool-obra": "niche",
  "pool-calle-nicho": "niche",
  "pool-servicios-barrio": "niche",
  "pool-escuela-barrio": "niche",
  "pool-deportes-barrio": "niche",
  "pos.balanza_peso": "pos",
  "pos.core": "pos",
  "core.claver": "pos",
  ...Object.fromEntries(
    NICHE_APPS.map((a) => [a.sku, (a.engine === "libreta" ? "fiado" : "niche") as ModoLite]),
  ),
  ...Object.fromEntries(MICRO_SAAS_PORTFOLIO.map((p) => [p.sku, p.modoLite])),
}

const MODO_POR_DOLOR: Record<string, ModoLite> = {
  fiado: "fiado",
  cobranza: "cobranza",
  stock: "pos",
  factura: "pos",
  informacion: "completo",
}

/** Rubro retail → clave de parametrizacion-rubro.ts */
export const RUBRO_TO_PARAMETRIZACION: Record<string, string> = {
  almacen: "comercio",
  kiosco: "comercio",
  ferreteria: "comercio",
  farmacia: "comercio",
  indumentaria: "comercio",
  carniceria: "comercio",
  fiambreria: "comercio",
  panaderia: "gastronomia",
  restaurant: "gastronomia",
  otro: "comercio",
}

export function resolvePackCalle(engancheId: string): PackCalle | null {
  const known = PACKS_CALLE.find((p) => p.id === engancheId)
  if (known) return known

  const bundle = packFromBundle(engancheId, MODO_POR_ENGANCHE[engancheId] ?? "completo", false)
  if (bundle) return bundle

  const sku = packFromSku(engancheId, MODO_POR_ENGANCHE[engancheId] ?? "fiado", false)
  if (sku) return sku

  if (engancheId === "indefinido") return packFromSku("pos.fiado_barrio", "fiado")!

  return null
}

export function inferModoLiteFromEnganche(engancheId: string, dolorPrincipal?: string | null): ModoLite {
  return MODO_POR_ENGANCHE[engancheId] ?? MODO_POR_DOLOR[dolorPrincipal ?? ""] ?? "fiado"
}

export function engancheParaRubro(rubro: string): string {
  return ENGANCHE_POR_RUBRO[rubro] ?? "pos.fiado_barrio"
}

export function skusParaActivar(engancheId: string): string[] {
  const pack = resolvePackCalle(engancheId)
  if (pack) {
    if (engancheId === "pos.balanza_peso") return ["core.claver", ...pack.skus]
    return pack.skus
  }
  return ["pos.fiado_barrio"]
}

export function landingPathParaModoLite(modoLite: ModoLite): string {
  return LANDING[modoLite]
}

export function parametrizacionParaRubro(rubro: string): string {
  return RUBRO_TO_PARAMETRIZACION[rubro] ?? "comercio"
}