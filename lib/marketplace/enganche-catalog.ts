/**
 * Catálogo de productos anzuelo / enganche comercial.
 * Dolor inmediato + ticket bajo + upsell al ERP completo.
 * Referencia: docs/marketplace/12-enganches-comerciales.md
 */

import { MARKETPLACE_CATALOG } from "./marketplace-catalog"
import { MARKETPLACE_BUNDLES } from "./bundles"
import { INTANGIBLES_TOP5, INTANGIBLE_PREMIUM_7 } from "./intangible-services"

export type EngancheTier = "implementado" | "parcial" | "catalogo"
export type EngancheNicho =
  | "almacen_barrio"
  | "pyme_cobranzas"
  | "ecommerce"
  | "seguridad_ops"
  | "fiscal"
  | "marketing"
  | "horizontal"

export interface EngancheProducto {
  sku: string
  nombre: string
  lema: string
  tier: EngancheTier
  nichos: EngancheNicho[]
  precioArs: number
  upsellA: string[]
  dolorResuelve: string
}

export const ENGANCHES: EngancheProducto[] = [
  {
    sku: "pos.fiado_barrio",
    nombre: "Libreta Fiado",
    lema: "Fiá con límite. Que el otro se entere.",
    tier: "implementado",
    nichos: ["almacen_barrio"],
    precioArs: 4990,
    upsellA: ["intang.cobranzas_wa", "com.whatsapp", "fiscal.clavpay_link"],
    dolorResuelve: "Pérdida de control del fiado en papel / WhatsApp suelto",
  },
  {
    sku: "intang.cobranzas_wa",
    nombre: "Secretaria de Cobranzas WA",
    lema: "El link cobra. Vos seguís vendiendo.",
    tier: "implementado",
    nichos: ["almacen_barrio", "pyme_cobranzas"],
    precioArs: 20000,
    upsellA: ["fiscal.clavpay_link", "core.clavis"],
    dolorResuelve: "Cuentas por cobrar vencidas sin seguimiento automático",
  },
  {
    sku: "com.whatsapp",
    nombre: "WhatsApp Business ON",
    lema: "Mensajes desde el ERP, no desde el celu del dueño.",
    tier: "parcial",
    nichos: ["almacen_barrio", "pyme_cobranzas", "ecommerce"],
    precioArs: 15000,
    upsellA: ["intang.cobranzas_wa", "intang.reactivador_clientes"],
    dolorResuelve: "Canal WA desconectado del negocio",
  },
  {
    sku: "fiscal.clavpay_link",
    nombre: "ClavPay Link",
    lema: "Link de pago en cada deuda.",
    tier: "parcial",
    nichos: ["almacen_barrio", "pyme_cobranzas"],
    precioArs: 6000,
    upsellA: ["intang.cobranzas_wa", "channel.mercadopago"],
    dolorResuelve: "Cobrar sin ir a buscar el efectivo",
  },
  {
    sku: "data.reportes_prog",
    nombre: "Reporte Mañanero",
    lema: "Abrís el negocio sabiendo qué pasó ayer.",
    tier: "parcial",
    nichos: ["horizontal", "almacen_barrio"],
    precioArs: 6000,
    upsellA: ["core.clavis", "data.nps"],
    dolorResuelve: "Dueño sin visibilidad diaria de caja y stock",
  },
  {
    sku: "bridge.opo_studio",
    nombre: "OPO Studio Bridge",
    lema: "Tu Protheus, con cara de Clavis.",
    tier: "parcial",
    nichos: ["horizontal", "ecommerce"],
    precioArs: 24900,
    upsellA: ["core.clavis", "impl.parametrizacion_remota", "ops.morning_commander"],
    dolorResuelve: "ERP legacy sin capa moderna ni IA con contexto unificado",
  },
  {
    sku: "fiscal.ocr",
    nombre: "FotoFactura",
    lema: "Sacale foto al remito y cargá compras.",
    tier: "parcial",
    nichos: ["almacen_barrio", "fiscal"],
    precioArs: 9000,
    upsellA: ["core.clavis", "impl.homologacion_afip"],
    dolorResuelve: "Carga manual de facturas de proveedores",
  },
  {
    sku: "sec.backup",
    nombre: "Backup Cloud",
    lema: "Si se rompe la PC, el negocio sigue.",
    tier: "parcial",
    nichos: ["horizontal", "seguridad_ops"],
    precioArs: 20000,
    upsellA: ["sec.mfa", "core.clavis"],
    dolorResuelve: "Miedo a perder datos del negocio",
  },
  {
    sku: "sec.mfa",
    nombre: "MFA",
    lema: "Que no te roben la cuenta del sistema.",
    tier: "parcial",
    nichos: ["horizontal", "seguridad_ops"],
    precioArs: 7000,
    upsellA: ["sec.backup"],
    dolorResuelve: "Accesos compartidos sin seguridad",
  },
  {
    sku: "intang.guardian_pos",
    nombre: "Guardián de Caja POS",
    lema: "Robo hormiga detectado antes del arqueo.",
    tier: "implementado",
    nichos: ["almacen_barrio", "pyme_cobranzas"],
    precioArs: 14900,
    upsellA: ["core.clavis", "intang.liquidacion_pagos"],
    dolorResuelve: "Anulaciones y egresos sospechosos en caja",
  },
  {
    sku: "intang.liquidacion_pagos",
    nombre: "Conciliador Liquidación MP",
    lema: "Que no te roben ni un peso de comisión.",
    tier: "parcial",
    nichos: ["pyme_cobranzas", "ecommerce"],
    precioArs: 24900,
    upsellA: ["channel.mercadopago", "core.clavis"],
    dolorResuelve: "Diferencias entre ventas POS y liquidación procesadoras",
  },
  {
    sku: "intang.reactivador_clientes",
    nombre: "Despertador de Clientes",
    lema: "Oro de la basura: clientes dormidos.",
    tier: "catalogo",
    nichos: ["pyme_cobranzas", "marketing"],
    precioArs: 12900,
    upsellA: ["com.whatsapp", "mkt.referidos"],
    dolorResuelve: "Clientes que dejaron de comprar",
  },
  {
    sku: "intang.reputation_firewall",
    nombre: "Escudo Reputación",
    lema: "Una mala reseña no te cierra el negocio.",
    tier: "catalogo",
    nichos: ["marketing", "ecommerce"],
    precioArs: 14900,
    upsellA: ["data.nps", "releva.encuesta_clientes"],
    dolorResuelve: "Crisis en Google Maps / redes",
  },
  {
    sku: "intang.legal_shield",
    nombre: "Legal Shield",
    lema: "Tu abogado de bolsillo en 30 segundos.",
    tier: "catalogo",
    nichos: ["pyme_cobranzas", "horizontal"],
    precioArs: 9900,
    upsellA: ["core.clavis"],
    dolorResuelve: "Contratos y letras chicas sin revisar",
  },
  {
    sku: "intang.subs_tax_scanner",
    nombre: "Cazador de Gastos Zombies",
    lema: "Plata que se escapa sin que te des cuenta.",
    tier: "catalogo",
    nichos: ["horizontal"],
    precioArs: 3000,
    upsellA: ["core.clavis"],
    dolorResuelve: "Suscripciones olvidadas en resumen bancario",
  },
  {
    sku: "data.nps",
    nombre: "NPS Automático",
    lema: "Saber si el cliente vuelve antes de que se vaya.",
    tier: "catalogo",
    nichos: ["marketing", "ecommerce"],
    precioArs: 10000,
    upsellA: ["intang.reactivador_clientes"],
    dolorResuelve: "Sin medición de satisfacción",
  },
  {
    sku: "mkt.pixel_ads",
    nombre: "Pixel Ads",
    lema: "Sabé qué anuncio trae ventas reales.",
    tier: "catalogo",
    nichos: ["ecommerce", "marketing"],
    precioArs: 5000,
    upsellA: ["integ.tienda_nube", "integ.shopify"],
    dolorResuelve: "Publicidad a ciegas",
  },
  {
    sku: "releva.formulario_web",
    nombre: "Formulario Web",
    lema: "Pedidos y consultas sin atender el teléfono.",
    tier: "catalogo",
    nichos: ["pyme_cobranzas", "ecommerce"],
    precioArs: 4000,
    upsellA: ["com.whatsapp", "core.clavis"],
    dolorResuelve: "Leads perdidos fuera de horario",
  },
]

export interface EngancheResumen {
  totalEnganches: number
  porTier: Record<EngancheTier, number>
  porNicho: Record<EngancheNicho, number>
  implementados: EngancheProducto[]
  parciales: EngancheProducto[]
  catalogo: EngancheProducto[]
  almacenBarrio: EngancheProducto[]
  bundlesEnganche: typeof MARKETPLACE_BUNDLES
  skusMarketplaceTotal: number
  intangiblesTop5: number
  intangiblesPremium7: number
}

export function getEngancheBySku(sku: string): EngancheProducto | undefined {
  return ENGANCHES.find((e) => e.sku === sku)
}

export function getEnganchesPorNicho(nicho: EngancheNicho): EngancheProducto[] {
  return ENGANCHES.filter((e) => e.nichos.includes(nicho))
}

export function getEnganchesPorTier(tier: EngancheTier): EngancheProducto[] {
  return ENGANCHES.filter((e) => e.tier === tier)
}

/** Pools comerciales pensados como enganche compuesto */
export function getBundlesEnganche() {
  return MARKETPLACE_BUNDLES.filter(
    (b) =>
      b.destacado ||
      b.id.includes("almacen") ||
      b.id.includes("cobra") ||
      b.id.includes("intangibles") ||
      b.id.includes("premium") ||
      b.id.includes("essentials"),
  )
}

export function resumenEnganches(): EngancheResumen {
  const porTier: Record<EngancheTier, number> = {
    implementado: 0,
    parcial: 0,
    catalogo: 0,
  }
  const porNicho: Record<EngancheNicho, number> = {
    almacen_barrio: 0,
    pyme_cobranzas: 0,
    ecommerce: 0,
    seguridad_ops: 0,
    fiscal: 0,
    marketing: 0,
    horizontal: 0,
  }

  for (const e of ENGANCHES) {
    porTier[e.tier]++
    for (const n of e.nichos) porNicho[n]++
  }

  return {
    totalEnganches: ENGANCHES.length,
    porTier,
    porNicho,
    implementados: getEnganchesPorTier("implementado"),
    parciales: getEnganchesPorTier("parcial"),
    catalogo: getEnganchesPorTier("catalogo"),
    almacenBarrio: getEnganchesPorNicho("almacen_barrio"),
    bundlesEnganche: getBundlesEnganche(),
    skusMarketplaceTotal: MARKETPLACE_CATALOG.length,
    intangiblesTop5: INTANGIBLES_TOP5.length,
    intangiblesPremium7: INTANGIBLE_PREMIUM_7.length,
  }
}