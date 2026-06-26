/**
 * Registro unificado de productos horizontales (enganches + add-ons).
 */

import { ENGANCHES, type EngancheTier } from "@/lib/marketplace/enganche-catalog"
import { MARKETPLACE_BUNDLES } from "@/lib/marketplace/bundles"
import { INTANGIBLE_PREMIUM_7 } from "@/lib/marketplace/intangible-premium-7"
import { RETAIL_EXTENSION_SKUS, RETAIL_SKU_META } from "@/lib/almacen-rosario/retail-skus"

export interface ProductoHorizontal {
  sku: string
  nombre: string
  lema: string
  tier: EngancheTier | "pack"
  horizontal: true
  precioArs: number
  dependeDe: string[]
  navPaths: string[]
  featureKey?: string
}

const PREMIUM_NAV: Record<string, string[]> = {
  "intang.liquidacion_pagos": ["/dashboard/apps/premium", "/dashboard/mercadopago"],
  "intang.recuperador_fiscal": ["/dashboard/apps/premium", "/dashboard/impuestos"],
  "intang.guardian_pos": ["/dashboard/apps/premium", "/dashboard/pos"],
  "intang.reactivador_clientes": ["/dashboard/apps/premium", "/dashboard/crm"],
  "intang.reponedor_jit": ["/dashboard/apps/premium", "/dashboard/compras"],
  "intang.ocr_compras": ["/dashboard/apps/premium", "/dashboard/compras"],
  "intang.ruteador_entregas": ["/dashboard/apps/premium"],
}

function depsForSku(sku: string): string[] {
  const premium = INTANGIBLE_PREMIUM_7.find((s) => s.sku === sku)
  if (premium?.dependeDe?.length) return premium.dependeDe
  if (sku === "intang.cobranzas_wa") return ["com.whatsapp"]
  return []
}

function tierForPremiumSku(sku: string): EngancheTier {
  const eng = ENGANCHES.find((e) => e.sku === sku)
  if (eng) return eng.tier
  const meta = INTANGIBLE_PREMIUM_7.find((s) => s.sku === sku)
  if (meta?.status === "disponible") return "implementado"
  if (meta?.status === "planned") return "catalogo"
  return "parcial"
}

function fromEnganche(e: (typeof ENGANCHES)[0], navPaths: string[]): ProductoHorizontal {
  return {
    sku: e.sku,
    nombre: e.nombre,
    lema: e.lema,
    tier: e.tier,
    horizontal: true,
    precioArs: e.precioArs,
    dependeDe: depsForSku(e.sku),
    navPaths,
  }
}

function fromPremium(sku: string): ProductoHorizontal | null {
  const meta = INTANGIBLE_PREMIUM_7.find((s) => s.sku === sku)
  if (!meta) return null
  const eng = ENGANCHES.find((e) => e.sku === sku)
  return {
    sku: meta.sku,
    nombre: eng?.nombre ?? meta.nombre,
    lema: eng?.lema ?? meta.lema,
    tier: tierForPremiumSku(meta.sku),
    horizontal: true,
    precioArs: meta.precioArs,
    dependeDe: depsForSku(meta.sku),
    navPaths: PREMIUM_NAV[meta.sku] ?? ["/dashboard/apps/premium"],
  }
}

const ALMACEN_ROSARIO_NAV = ["/dashboard/almacen", "/dashboard/pos"]

const ENGANCHE_SKUS = new Set(ENGANCHES.map((e) => e.sku))

export const PRODUCTOS_HORIZONTALES: ProductoHorizontal[] = [
  fromEnganche(ENGANCHES.find((e) => e.sku === "pos.fiado_barrio")!, ["/dashboard/fiado", "/dashboard/pos"]),
  fromEnganche(ENGANCHES.find((e) => e.sku === "intang.cobranzas_wa")!, ["/dashboard/cuentas-cobrar"]),
  fromEnganche(ENGANCHES.find((e) => e.sku === "com.whatsapp")!, []),
  fromEnganche(ENGANCHES.find((e) => e.sku === "fiscal.clavpay_link")!, ["/dashboard/mercadopago"]),
  fromEnganche(ENGANCHES.find((e) => e.sku === "data.reportes_prog")!, []),
  {
    ...fromEnganche(ENGANCHES.find((e) => e.sku === "bridge.opo_studio")!, ["/dashboard/apps/opo"]),
    featureKey: "bridge_opo_studio",
  },
  fromEnganche(ENGANCHES.find((e) => e.sku === "sec.backup")!, []),
  fromEnganche(ENGANCHES.find((e) => e.sku === "sec.mfa")!, []),
  fromEnganche(ENGANCHES.find((e) => e.sku === "intang.guardian_pos")!, PREMIUM_NAV["intang.guardian_pos"]),
  fromEnganche(ENGANCHES.find((e) => e.sku === "intang.liquidacion_pagos")!, PREMIUM_NAV["intang.liquidacion_pagos"]),
  fromEnganche(ENGANCHES.find((e) => e.sku === "intang.reactivador_clientes")!, PREMIUM_NAV["intang.reactivador_clientes"]),
  {
    sku: "pos.margen_guard",
    nombre: "Guardián de Margen POS",
    lema: "Que el costo no te coma el margen.",
    tier: "implementado",
    horizontal: true,
    precioArs: 3990,
    dependeDe: ["core.pos"],
    navPaths: ALMACEN_ROSARIO_NAV,
  },
  {
    sku: "pos.zero_waste",
    nombre: "Zero Waste Bot",
    lema: "Vendé antes de tirar.",
    tier: "implementado",
    horizontal: true,
    precioArs: 5990,
    dependeDe: ["core.pos"],
    navPaths: ALMACEN_ROSARIO_NAV,
  },
  {
    sku: "pos.stock_cero_alert",
    nombre: "Alerta Stock Cero",
    lema: "Vendé sin frenar, avisá al dueño.",
    tier: "implementado",
    horizontal: true,
    precioArs: 2990,
    dependeDe: ["core.pos"],
    navPaths: ALMACEN_ROSARIO_NAV,
  },
  {
    sku: "pos.promos_pago",
    nombre: "Copiloto Promos Pago",
    lema: "MODO y BSF sin memorizar.",
    tier: "implementado",
    horizontal: true,
    precioArs: 2990,
    dependeDe: ["core.pos"],
    navPaths: ALMACEN_ROSARIO_NAV,
  },
  {
    sku: "pos.lista_distribuidora",
    nombre: "Importador Listas",
    lema: "Excel de distribuidora → precios POS.",
    tier: "parcial",
    horizontal: true,
    precioArs: 4990,
    dependeDe: ["core.pos"],
    navPaths: ALMACEN_ROSARIO_NAV,
  },
  {
    sku: "pos.panico_vecinal",
    nombre: "Pánico Vecinal",
    lema: "Botón silencioso en el POS.",
    tier: "implementado",
    horizontal: true,
    precioArs: 1990,
    dependeDe: ["core.pos", "com.whatsapp"],
    navPaths: ALMACEN_ROSARIO_NAV,
  },
  {
    sku: "pos.envases_gaseosas",
    nombre: "Envases de Gaseosas",
    lema: "Cajones retornables con depósito.",
    tier: "implementado",
    horizontal: true,
    precioArs: 2490,
    dependeDe: ["core.pos"],
    navPaths: ALMACEN_ROSARIO_NAV,
  },
  {
    sku: "pos.vale_dinero",
    nombre: "Vale de Dinero",
    lema: "Ticket canjeable en caja.",
    tier: "implementado",
    horizontal: true,
    precioArs: 1990,
    dependeDe: ["core.pos"],
    navPaths: ALMACEN_ROSARIO_NAV,
  },
  ...RETAIL_EXTENSION_SKUS.map((sku) => ({
    sku,
    nombre: RETAIL_SKU_META[sku].nombre,
    lema: RETAIL_SKU_META[sku].lema,
    tier: "implementado" as const,
    horizontal: true as const,
    precioArs: RETAIL_SKU_META[sku].precioArs,
    dependeDe: ["core.pos"],
    navPaths: ALMACEN_ROSARIO_NAV,
  })),
  ...INTANGIBLE_PREMIUM_7.filter((s) => !ENGANCHE_SKUS.has(s.sku))
    .map((s) => fromPremium(s.sku))
    .filter((p): p is ProductoHorizontal => p !== null),
]

export interface ProductoPack {
  id: string
  nombre: string
  lema: string
  skus: string[]
  precioPackArs: number
}

export const PACKS_HORIZONTALES: ProductoPack[] = MARKETPLACE_BUNDLES.filter(
  (b) =>
    b.id === "pool-almacen-barrio" ||
    b.id === "pool-cobra-recupera" ||
    b.id === "pool-essentials" ||
    b.id === "pool-premium-erp-7" ||
    b.id === "pool-almacen-rosario" ||
    b.id === "pool-digitalizacion-legacy",
).map((b) => ({
  id: b.id,
  nombre: b.nombre,
  lema: b.lema,
  skus: b.skus,
  precioPackArs: b.precioPackArs,
}))

export function getProductoHorizontal(sku: string): ProductoHorizontal | undefined {
  return PRODUCTOS_HORIZONTALES.find((p) => p.sku === sku)
}

export function getPackHorizontal(packId: string): ProductoPack | undefined {
  return PACKS_HORIZONTALES.find((p) => p.id === packId)
}