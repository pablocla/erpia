/**
 * Catálogo comercial Clavis 2026 — Core + 8 bundles + à la carte
 * Fuente única para landing, propuestas y seed de SKUs.
 */

export const PRICING_META = {
  currency: "ARS",
  vatNote: "Precios en ARS + IVA",
  annualDiscountLabel: "2 meses gratis",
  annualDiscountPct: 17,
  extraUserMonthly: 4_900,
  extraBranchMonthly: 9_900,
} as const

export interface ClavisBundle {
  id: string
  sku: string
  name: string
  tagline: string
  valueProp: string
  integrations: string[]
  modules: string[]
  priceMonthly: number
  priceAnnual: number
  /** Add-on sobre Core; null = es la base obligatoria */
  isAddOn: boolean
  highlighted?: boolean
  badge?: string
  cta: string
  setupFee?: number
  /** Total mensual de referencia (Core + add-on) para bundles compuestos */
  totalMonthly?: number
}

export interface AlaCarteItem {
  id: string
  name: string
  tier: "A" | "B" | "C"
  priceMonthly: number
  note?: string
}

export interface ProductLine {
  id: string
  name: string
  color: string
  description: string
}

/** Plataforma base obligatoria */
export const CLAVIS_CORE: ClavisBundle = {
  id: "core",
  sku: "core.clavis",
  name: "Clavis Core",
  tagline: "Tu sistema operativo + cumplimiento fiscal",
  valueProp:
    "Compras, stock, ventas, caja y AFIP en un solo lugar. Sin software paralelo ni doble carga.",
  integrations: ["AFIP / ARCA (CAE, CAEA, IVA)", "Reportes fiscales"],
  modules: [
    "Compras y proveedores",
    "Inventario multi-depósito",
    "Ventas, remitos y caja",
    "Clientes y CxC",
    "3 usuarios incluidos",
  ],
  priceMonthly: 39_900,
  priceAnnual: 399_000,
  isAddOn: false,
  cta: "Empezar con Core",
}

export const CLAVIS_CORE_INDUSTRIA: ClavisBundle = {
  ...CLAVIS_CORE,
  id: "core-industria",
  sku: "core.clavis_industria",
  name: "Clavis Core Industria",
  tagline: "ERP base para metalmecánica y producción",
  priceMonthly: 49_900,
  priceAnnual: 499_000,
  modules: [
    ...CLAVIS_CORE.modules,
    "Rubro metalúrgico preconfigurado",
    "Centros de costo básicos",
  ],
}

/** 7 add-ons + Core = 8 paquetes comerciales */
export const CLAVIS_BUNDLES: ClavisBundle[] = [
  {
    id: "tienda-conectada",
    sku: "bundle.tienda_conectada",
    name: "Clavis Tienda Conectada",
    tagline: "Tu tienda web habla con el depósito",
    valueProp:
      "Pedidos web que bajan solos al ERP. Un solo stock para mostrador y e-commerce.",
    integrations: ["Tienda Nube", "Shopify", "WooCommerce (2 activos incluidos)"],
    modules: ["Ventas (pedidos)", "Stock", "Clientes", "Logística básica"],
    priceMonthly: 22_900,
    priceAnnual: 229_000,
    isAddOn: true,
    cta: "Conectar mi tienda",
    setupFee: 60_000,
    totalMonthly: CLAVIS_CORE.priceMonthly + 22_900,
  },
  {
    id: "marketplace-pro",
    sku: "bundle.marketplace_ml",
    name: "Clavis Marketplace Pro",
    tagline: "Mercado Libre sin quiebre de stock",
    valueProp:
      "Publicaciones, pedidos y stock sincronizados. Vendé en ML sin Excel ni doble carga.",
    integrations: ["Mercado Libre (publicaciones, pedidos, stock)"],
    modules: ["Ventas", "Stock", "CRM", "Facturación AFIP"],
    priceMonthly: 16_900,
    priceAnnual: 169_000,
    isAddOn: true,
    cta: "Activar Mercado Libre",
    setupFee: 60_000,
    totalMonthly: CLAVIS_CORE.priceMonthly + 16_900,
  },
  {
    id: "omnicanal",
    sku: "bundle.multicanal_ar",
    name: "Clavis Omnicanal Argentina",
    tagline: "Un stock, todos los canales, una factura",
    valueProp:
      "ML + tienda propia + pagos integrados. El bundle estrella para PyMEs que venden en todos lados.",
    integrations: [
      "Mercado Libre",
      "Tienda Nube",
      "Shopify o WooCommerce",
      "Mercado Pago",
    ],
    modules: [
      "Circuito comercial completo",
      "Stock único",
      "CxC y conciliación",
      "Facturación automática",
    ],
    priceMonthly: 44_900,
    priceAnnual: 449_000,
    isAddOn: true,
    highlighted: true,
    badge: "Más elegido",
    cta: "Quiero Omnicanal",
    setupFee: 120_000,
    totalMonthly: CLAVIS_CORE.priceMonthly + 44_900,
  },
  {
    id: "envios-pro",
    sku: "bundle.envios_ar",
    name: "Clavis Envíos Pro",
    tagline: "Cotizá, etiquetá y rastreá sin salir del ERP",
    valueProp:
      "Andreani, OCA y Correo Argentino en un solo panel. Sin portales externos ni copiar tracking.",
    integrations: ["Andreani", "OCA ePak", "Correo Argentino PAQ.AR"],
    modules: ["Logística", "Ventas (despacho)", "Remitos", "Tracking al cliente"],
    priceMonthly: 12_900,
    priceAnnual: 129_000,
    isAddOn: true,
    cta: "Unificar mis envíos",
    setupFee: 60_000,
    totalMonthly: CLAVIS_CORE.priceMonthly + 12_900,
  },
  {
    id: "comunica",
    sku: "bundle.comunica",
    name: "Clavis Comunica",
    tagline: "Avisos donde tu cliente realmente lee",
    valueProp:
      "WhatsApp y Telegram para confirmaciones, tracking y cobranza. Menos llamadas, más cobros.",
    integrations: ["WhatsApp Business", "Telegram", "Alertas operativas"],
    modules: ["CRM", "Cobranza", "Logística (tracking)", "Centro de alertas"],
    priceMonthly: 7_900,
    priceAnnual: 79_000,
    isAddOn: true,
    cta: "Activar mensajería",
    totalMonthly: CLAVIS_CORE.priceMonthly + 7_900,
  },
  {
    id: "industria",
    sku: "bundle.industria",
    name: "Clavis Industria",
    tagline: "De pedido de venta a orden de fabricación",
    valueProp:
      "BOM, órdenes de fabricación y MRP con trazabilidad. Para talleres y metalmecánica.",
    integrations: ["Sin integración externa obligatoria"],
    modules: [
      "Producción y OF",
      "BOM / lista de materiales",
      "MRP y centros de costo",
      "Compras vinculadas",
    ],
    priceMonthly: 24_900,
    priceAnnual: 249_000,
    isAddOn: true,
    cta: "Digitalizar mi taller",
    setupFee: 120_000,
    totalMonthly: CLAVIS_CORE_INDUSTRIA.priceMonthly + 24_900,
  },
  {
    id: "operacion-completa",
    sku: "bundle.operacion_completa",
    name: "Clavis Operación Completa",
    tagline: "Todo Tier A en un solo contrato",
    valueProp:
      "Omnicanal + envíos + comunicación. Para distribuidoras que quieren operar sin fricción.",
    integrations: [
      "Mercado Libre",
      "Tienda Nube",
      "Shopify o WooCommerce",
      "Mercado Pago",
      "Andreani + OCA + Correo Argentino",
      "WhatsApp + Telegram",
    ],
    modules: [
      "Todo el circuito comercial",
      "Logística nacional",
      "Mensajería operativa",
      "AFIP incluido",
    ],
    priceMonthly: 79_900,
    priceAnnual: 799_000,
    isAddOn: true,
    badge: "Mejor valor",
    cta: "Hablar con ventas",
    setupFee: 180_000,
    totalMonthly: CLAVIS_CORE_INDUSTRIA.priceMonthly + 79_900,
  },
]

export const ALA_CARTE: AlaCarteItem[] = [
  { id: "ml", name: "Mercado Libre", tier: "A", priceMonthly: 16_900 },
  { id: "tn", name: "Tienda Nube", tier: "A", priceMonthly: 13_900 },
  { id: "shopify", name: "Shopify", tier: "A", priceMonthly: 13_900 },
  { id: "woo", name: "WooCommerce", tier: "A", priceMonthly: 10_900 },
  { id: "mp", name: "Mercado Pago", tier: "A", priceMonthly: 9_900, note: "Incluido en Omnicanal" },
  { id: "andreani", name: "Andreani", tier: "A", priceMonthly: 6_500 },
  { id: "oca", name: "OCA ePak", tier: "A", priceMonthly: 6_500 },
  { id: "correo", name: "Correo Argentino", tier: "A", priceMonthly: 6_500 },
  { id: "carriers-pack", name: "Los 3 carriers", tier: "A", priceMonthly: 12_900, note: "Siempre mejor que por separado" },
  { id: "whatsapp", name: "WhatsApp Business", tier: "B", priceMonthly: 7_900 },
  { id: "telegram", name: "Telegram", tier: "B", priceMonthly: 2_900, note: "Gratis con Comunica" },
  { id: "automate", name: "Clavis Automate (n8n)", tier: "B", priceMonthly: 11_900, note: "10.000 eventos/mes" },
  { id: "vtex", name: "VTEX", tier: "C", priceMonthly: 24_900, note: "Early Access" },
  { id: "amazon", name: "Amazon Seller", tier: "C", priceMonthly: 22_900, note: "Early Access" },
  { id: "hubspot", name: "HubSpot / RD Station", tier: "C", priceMonthly: 18_900, note: "Early Access" },
  { id: "stripe", name: "Stripe", tier: "C", priceMonthly: 14_900, note: "Early Access" },
  { id: "usuario", name: "Usuario adicional", tier: "A", priceMonthly: PRICING_META.extraUserMonthly },
  { id: "sucursal", name: "Sucursal adicional", tier: "A", priceMonthly: PRICING_META.extraBranchMonthly },
]

/** Líneas de producto (branding) */
export const PRODUCT_LINES: ProductLine[] = [
  { id: "core", name: "Clavis Core", color: "blue", description: "ERP + fiscal base" },
  { id: "connect", name: "Clavis Connect", color: "amber", description: "Canales y marketplaces" },
  { id: "ship", name: "Clavis Ship", color: "emerald", description: "Logística nacional" },
  { id: "comunica", name: "Clavis Comunica", color: "green", description: "WhatsApp y alertas" },
  { id: "industria", name: "Clavis Industria", color: "slate", description: "Producción y MRP" },
  { id: "omnicanal", name: "Clavis Omnicanal", color: "violet", description: "Bundle estrella multicanal" },
]

/** Matriz paquetes vs integraciones (para tabla comparativa) */
export const COMPARISON_INTEGRATIONS = [
  "AFIP / Fiscal",
  "Mercado Libre",
  "Tienda Nube",
  "Shopify / Woo",
  "Mercado Pago",
  "Andreani + OCA + Correo",
  "WhatsApp",
] as const

export type ComparisonIntegration = (typeof COMPARISON_INTEGRATIONS)[number]

export const COMPARISON_MATRIX: Record<string, Record<ComparisonIntegration, boolean>> = {
  core: {
    "AFIP / Fiscal": true,
    "Mercado Libre": false,
    "Tienda Nube": false,
    "Shopify / Woo": false,
    "Mercado Pago": false,
    "Andreani + OCA + Correo": false,
    WhatsApp: false,
  },
  "tienda-conectada": {
    "AFIP / Fiscal": true,
    "Mercado Libre": false,
    "Tienda Nube": true,
    "Shopify / Woo": true,
    "Mercado Pago": false,
    "Andreani + OCA + Correo": false,
    WhatsApp: false,
  },
  "marketplace-pro": {
    "AFIP / Fiscal": true,
    "Mercado Libre": true,
    "Tienda Nube": false,
    "Shopify / Woo": false,
    "Mercado Pago": false,
    "Andreani + OCA + Correo": false,
    WhatsApp: false,
  },
  omnicanal: {
    "AFIP / Fiscal": true,
    "Mercado Libre": true,
    "Tienda Nube": true,
    "Shopify / Woo": true,
    "Mercado Pago": true,
    "Andreani + OCA + Correo": false,
    WhatsApp: false,
  },
  "envios-pro": {
    "AFIP / Fiscal": true,
    "Mercado Libre": false,
    "Tienda Nube": false,
    "Shopify / Woo": false,
    "Mercado Pago": false,
    "Andreani + OCA + Correo": true,
    WhatsApp: false,
  },
  comunica: {
    "AFIP / Fiscal": true,
    "Mercado Libre": false,
    "Tienda Nube": false,
    "Shopify / Woo": false,
    "Mercado Pago": false,
    "Andreani + OCA + Correo": false,
    WhatsApp: true,
  },
  "operacion-completa": {
    "AFIP / Fiscal": true,
    "Mercado Libre": true,
    "Tienda Nube": true,
    "Shopify / Woo": true,
    "Mercado Pago": true,
    "Andreani + OCA + Correo": true,
    WhatsApp: true,
  },
}

export const UPSELL_LADDER = [
  { month: 0, action: "Core (+ Industria si metalúrgica)", trigger: "Onboarding inicial" },
  { month: 1, action: "+ 1 canal (el que ya usa)", trigger: "Primer pedido web o ML" },
  { month: 2, action: "Empujar Omnicanal", trigger: "Segundo canal o stock desfasado" },
  { month: 3, action: "Clavis Envíos Pro", trigger: "Pedido sin guía / despacho manual" },
  { month: 4, action: "Clavis Comunica", trigger: "Consultas de tracking / cobranza" },
  { month: 6, action: "Operación Completa", trigger: "Descuento por upgrade total" },
  { month: 12, action: "Automate o Early Access", trigger: "Power users / enterprise" },
] as const

export const SALES_MESSAGES: Record<string, { headline: string; message: string }> = {
  comercio: {
    headline: "Dejá de cargar pedidos a mano",
    message:
      "Con Clavis Omnicanal, cada venta de ML o tu tienda baja sola al ERP y descuenta el mismo stock del mostrador.",
  },
  distribuidora: {
    headline: "Un depósito, todos los canales",
    message:
      "Operación Completa une mayorista B2B, e-commerce y logística nacional sin tres sistemas distintos.",
  },
  metalurgica: {
    headline: "Del pedido a la orden de fabricación",
    message:
      "Core Industria + bundle Industria: BOM, OF y MRP con trazabilidad. Sumá Omnicanal si vendés piezas online.",
  },
  solo_ml: {
    headline: "ML sin quiebre de stock",
    message:
      "Marketplace Pro es el punto de entrada ideal si hoy solo vendés en Mercado Libre.",
  },
  ecommerce: {
    headline: "Tu tienda conectada al depósito",
    message:
      "Tienda Conectada sincroniza TN, Shopify o Woo con stock real. Sin doble carga ni sorpresas de inventario.",
  },
}

export const TRUST_MESSAGES = [
  { title: "AFIP incluido siempre", desc: "CAE, CAEA y libros IVA nativos. No es un add-on negociable." },
  { title: "Integraciones Tier A en producción", desc: "ML, TN, Shopify, Woo y carriers con sync real y demo en vivo." },
  { title: "Sin permanencia forzada", desc: "Contratos mensuales simples. Anual con 2 meses gratis si preferís ahorrar." },
  { title: "Setup opcional, no obligatorio", desc: "Desde $60k para un canal hasta $180k para operación completa en 14 días." },
] as const

export const OBJECTION_HANDLERS = [
  {
    objection: "Ya tengo un sistema de facturación",
    response: "Clavis unifica fiscal + operación. Dejás de exportar a Excel y tenés stock y factura en el mismo evento.",
  },
  {
    objection: "Solo necesito Mercado Libre",
    response: "Marketplace Pro arranca en $16.900/mes sobre Core. Cuando sumes un segundo canal, Omnicanal te ahorra 23%.",
  },
  {
    objection: "Es caro vs. varios sistemas baratos",
    response: "Tres sistemas = tres cargas, tres errores de stock y horas de soporte. Un ERP cuesta menos que un empleado part-time.",
  },
  {
    objection: "No quiero pagar setup",
    response: "Podés activar self-service con guías. El setup acelera go-live en 7–14 días y evita errores de parametrización AFIP.",
  },
] as const

export function formatArs(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount)
}