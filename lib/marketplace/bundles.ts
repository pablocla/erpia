/** Pools comerciales — bundles de SKUs para vitrine y checkout */

export interface MarketplaceBundle {
  id: string
  nombre: string
  lema: string
  descripcion: string
  skus: string[]
  precioPackArs: number
  ahorroPct: number
  tipoCobro: "mensual" | "one_shot" | "mixto"
  destacado?: boolean
}

export const MARKETPLACE_BUNDLES: MarketplaceBundle[] = [
  {
    id: "pool-essentials",
    nombre: "AutoPool Essentials",
    lema: "Protegé, enterate y arrancá.",
    descripcion: "Backup + 2FA + reporte matutino. Horizontal, cualquier rubro.",
    skus: ["sec.backup", "sec.mfa", "data.reportes_prog"],
    precioPackArs: 7990,
    ahorroPct: 15,
    tipoCobro: "mensual",
    destacado: true,
  },
  {
    id: "pool-conecta-ar",
    nombre: "Conecta Argentina",
    lema: "Un stock, todos los canales locales.",
    descripcion: "Tienda Nube + Mercado Libre + WhatsApp.",
    skus: ["integ.tienda_nube", "integ.mercado_libre", "com.whatsapp"],
    precioPackArs: 34900,
    ahorroPct: 20,
    tipoCobro: "mensual",
    destacado: true,
  },
  {
    id: "pool-conecta-global",
    nombre: "Conecta Global",
    lema: "Shopify y Woo, mismo depósito.",
    descripcion: "Integraciones ecommerce internacionales.",
    skus: ["integ.shopify", "integ.woocommerce", "mkt.pixel_ads"],
    precioPackArs: 29900,
    ahorroPct: 18,
    tipoCobro: "mensual",
  },
  {
    id: "pool-mide",
    nombre: "Mide + Releva",
    lema: "Los números y la voz del cliente.",
    descripcion: "NPS + encuestas + formulario web.",
    skus: ["data.nps", "releva.encuesta_clientes", "releva.formulario_web"],
    precioPackArs: 7990,
    ahorroPct: 12,
    tipoCobro: "mensual",
  },
  {
    id: "pool-impl-odoo",
    nombre: "Salí de Odoo",
    lema: "Migración completa sin visita.",
    descripcion: "Migración Odoo + bridge + AFIP Ready.",
    skus: ["impl.migracion_odoo", "integ.odoo", "impl.homologacion_afip"],
    precioPackArs: 89900,
    ahorroPct: 10,
    tipoCobro: "one_shot",
    destacado: true,
  },
  {
    id: "pool-impl-ecommerce",
    nombre: "Traé tu tienda",
    lema: "TN o Shopify, facturando en una semana.",
    descripcion: "Migración + integración + pixel ads.",
    skus: ["impl.migracion_tienda_nube", "integ.tienda_nube", "mkt.pixel_ads"],
    precioPackArs: 49900,
    ahorroPct: 12,
    tipoCobro: "mixto",
  },
  {
    id: "pool-intangibles-top5",
    nombre: "Intangibles Top 5",
    lema: "Bolsillo y paz mental en un pack.",
    descripcion:
      "Cobranzas WA + reputación + legal + gastos zombies + reactivador. Lo mejor de lo mejor.",
    skus: [
      "intang.cobranzas_wa",
      "intang.reputation_firewall",
      "intang.legal_shield",
      "intang.subs_tax_scanner",
      "intang.reactivador_clientes",
    ],
    precioPackArs: 44900,
    ahorroPct: 25,
    tipoCobro: "mensual",
    destacado: true,
  },
  {
    id: "pool-almacen-barrio",
    nombre: "Almacén de Barrio",
    lema: "Fiá, avisá y cobrá el viernes.",
    descripcion: "Libreta Fiado + Cobranzas WA + WhatsApp ON.",
    skus: ["pos.fiado_barrio", "intang.cobranzas_wa", "com.whatsapp"],
    precioPackArs: 34900,
    ahorroPct: 18,
    tipoCobro: "mensual",
    destacado: true,
  },
  {
    id: "pool-cobra-recupera",
    nombre: "Cobra y Recupera",
    lema: "Plata que entraba y plata que volvía.",
    descripcion: "Secretaria cobranzas + despertador clientes dormidos.",
    skus: ["intang.cobranzas_wa", "intang.reactivador_clientes", "com.whatsapp"],
    precioPackArs: 39900,
    ahorroPct: 18,
    tipoCobro: "mensual",
    destacado: true,
  },
  {
    id: "pool-premium-erp-7",
    nombre: "Premium ERP 7",
    lema: "Lo que SAP cobra millones, en pesos argentinos.",
    descripcion:
      "Conciliador pagos + fiscal + guardián POS + reactivador B2B + reponedor JIT + OCR compras + ruteador entregas.",
    skus: [
      "intang.liquidacion_pagos",
      "intang.recuperador_fiscal",
      "intang.guardian_pos",
      "intang.reactivador_clientes",
      "intang.reponedor_jit",
      "intang.ocr_compras",
      "intang.ruteador_entregas",
    ],
    precioPackArs: 89900,
    ahorroPct: 22,
    tipoCobro: "mensual",
    destacado: true,
  },
  {
    id: "pool-digitalizacion-legacy",
    nombre: "Digitalización Legacy",
    lema: "Protheus con cara nueva, sin reemplazar de golpe.",
    descripcion: "OPO Studio Bridge + parametrización remota para conectar legacy vía REST o SQL.",
    skus: ["bridge.opo_studio", "impl.parametrizacion_remota"],
    precioPackArs: 59900,
    ahorroPct: 15,
    tipoCobro: "mixto",
    destacado: true,
  },
  {
    id: "pool-almacen-rosario",
    nombre: "Almacén Rosario",
    lema: "Margen, merma y caja para el barrio.",
    descripcion:
      "18 módulos retail visibles: margen, merma, envases, vales, recargas, balanza, promos 2×1, pedido distribuidora, arqueo ciego + fiado y guardián POS.",
    skus: [
      "pos.margen_guard",
      "pos.zero_waste",
      "pos.stock_cero_alert",
      "pos.promos_pago",
      "pos.lista_distribuidora",
      "pos.panico_vecinal",
      "pos.envases_gaseosas",
      "pos.vale_dinero",
      "pos.recargas_servicios",
      "pos.balanza_peso",
      "pos.promos_cantidad",
      "pos.ticket_regalo",
      "pos.pedido_distribuidora",
      "pos.mermas_roturas",
      "pos.arqueo_ciego",
      "pos.lista_mayorista_pos",
      "pos.cheques_cartera",
      "pos.inventario_express",
      "pos.fiado_barrio",
      "intang.guardian_pos",
    ],
    precioPackArs: 34900,
    ahorroPct: 28,
    tipoCobro: "mensual",
    destacado: true,
  },
]

export function getBundle(id: string): MarketplaceBundle | undefined {
  return MARKETPLACE_BUNDLES.find((b) => b.id === id)
}