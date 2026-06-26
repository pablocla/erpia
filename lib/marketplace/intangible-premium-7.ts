/**
 * Servicios intangibles Premium — inspirados en SAP, NetSuite, Salesforce, Odoo.
 * Referencia: docs/marketplace/13-servicios-intangibles-premium-7.md
 */

export type MonetizacionPremium =
  | "recurrente"
  | "por_uso"
  | "exito_pct"
  | "recurrente_o_exito"

export interface IntangiblePremiumMeta {
  sku: string
  rank: 1 | 2 | 3 | 4 | 5 | 6 | 7
  nombre: string
  lema: string
  inspiradoEn: string
  dolor: string
  solucion: string
  monetizacion: MonetizacionPremium
  monetizacionDetalle: string
  precioArs: number
  precioPorUsoArs?: number
  audiencia: "B2B" | "B2C" | "B2B/B2C"
  autoCertLevel: "GLOBAL_AUTO" | "REGION_AUTO" | "SEMI_AUTO" | "HUMAN_GATE"
  status: "disponible" | "beta" | "planned"
  prioridadBuild: "ahora" | "proximo" | "fase2"
  stackTecnico: string[]
  dependeDe?: string[]
}

export const INTANGIBLE_PREMIUM_7: IntangiblePremiumMeta[] = [
  {
    sku: "intang.liquidacion_pagos",
    rank: 1,
    nombre: "Conciliador Liquidación MP y Tarjetas",
    lema: "Que no te roben ni un peso de comisión.",
    inspiradoEn: "NetSuite Treasury · SAP Cash Management",
    dolor:
      "Las Pymes pierden entre 1% y 5% de facturación en comisiones fantasmas, adelantos mal liquidados, contracargos y retenciones duplicadas.",
    solucion:
      "Conciliador en segundo plano que cruza ventas POS con liquidaciones de MercadoPago, Prisma y MODO; alerta por WhatsApp sobre discrepancias o dinero retenido.",
    monetizacion: "recurrente_o_exito",
    monetizacionDetalle: "$24.900/mes o 8% del dinero recuperado",
    precioArs: 24900,
    audiencia: "B2B",
    autoCertLevel: "SEMI_AUTO",
    status: "beta",
    prioridadBuild: "ahora",
    stackTecnico: ["movimientoCaja", "mercadoPagoTransaccion", "cron", "WhatsApp", "alertas"],
    dependeDe: ["channel.mercadopago"],
  },
  {
    sku: "intang.recuperador_fiscal",
    rank: 2,
    nombre: "Auditor Tributario y Recuperador de Retenciones",
    lema: "Percepciones que el contador olvida = plata tirada.",
    inspiradoEn: "TaxEngine ERPs · AFIP Mis Retenciones",
    dolor:
      "Percepciones sufridas de IVA/IIBB no computadas y pagos a proveedores apócrifos sin bloqueo.",
    solucion:
      "Bot con clave fiscal que extrae padrón de retenciones, cruza con compras del ERP, pre-carga crédito fiscal y bloquea pagos a proveedores apócrifos.",
    monetizacion: "recurrente",
    monetizacionDetalle: "$18.900/mes — ROI visible en panel de ahorro acumulado",
    precioArs: 18900,
    audiencia: "B2B",
    autoCertLevel: "SEMI_AUTO",
    status: "beta",
    prioridadBuild: "proximo",
    stackTecnico: ["AFIP padrones", "compras", "notas crédito", "proveedores", "ParametroFiscal"],
  },
  {
    sku: "intang.guardian_pos",
    rank: 3,
    nombre: "Guardián de Caja y Auditor de Fraude POS",
    lema: "Robo hormiga detectado antes del arqueo.",
    inspiradoEn: "Odoo Retail Security · Square Risk",
    dolor:
      "Anulaciones dudosas, descuentos manuales excesivos y aperturas de caja sin venta.",
    solucion:
      "Analizador en tiempo real de logs POS: reporte diario de riesgo por WhatsApp al dueño con score ALTO/MEDIO/BAJO.",
    monetizacion: "recurrente",
    monetizacionDetalle: "$14.900/mes — módulo seguridad premium comercios",
    precioArs: 14900,
    audiencia: "B2B",
    autoCertLevel: "REGION_AUTO",
    status: "disponible",
    prioridadBuild: "ahora",
    stackTecnico: ["movimientoCaja", "notaCredito", "anular-venta-pos", "auditoria", "WhatsApp"],
    dependeDe: ["core.pos"],
  },
  {
    sku: "intang.reactivador_clientes",
    rank: 4,
    nombre: "Reactivador y Optimizador B2B",
    lema: "El vendedor se entera antes de perder el cliente.",
    inspiradoEn: "Salesforce Einstein · Zoho CRM",
    dolor:
      "En distribuidoras, si un cliente baja 20% el volumen o espacia pedidos, nadie actúa a tiempo.",
    solucion:
      "IA que analiza frecuencia histórica y dispara alertas de retención u ofertas por WhatsApp ante desvíos de compra.",
    monetizacion: "recurrente",
    monetizacionDetalle: "$12.900/mes o comisión por venta reactivada",
    precioArs: 12900,
    audiencia: "B2B",
    autoCertLevel: "REGION_AUTO",
    status: "disponible",
    prioridadBuild: "proximo",
    stackTecnico: ["CRM", "pedidos", "WhatsApp", "cupones", "KPIs"],
    dependeDe: ["com.whatsapp"],
  },
  {
    sku: "intang.reponedor_jit",
    rank: 5,
    nombre: "Reponedor Inteligente Just-In-Time",
    lema: "Ni quiebre ni capital muerto en depósito.",
    inspiradoEn: "SAP IBP · NetSuite Demand Planning",
    dolor:
      "Stock sobrante inmoviliza capital; quiebres pierden ventas.",
    solucion:
      "Algoritmo de velocidad de venta + lead time + estacionalidad → propuestas de OC óptimas y mails de cotización pre-redactados.",
    monetizacion: "recurrente",
    monetizacionDetalle: "$16.900/mes",
    precioArs: 16900,
    audiencia: "B2B",
    autoCertLevel: "REGION_AUTO",
    status: "beta",
    prioridadBuild: "proximo",
    stackTecnico: ["stock", "ordenCompra", "proveedores", "alertas stock bajo", "IA email"],
  },
  {
    sku: "intang.ocr_compras",
    rank: 6,
    nombre: "Importador Inteligente de Facturas de Proveedores",
    lema: "La foto reemplaza tres horas de carga manual.",
    inspiradoEn: "Odoo Documents · SAP Concur",
    dolor:
      "Cargar ítems de facturas de compra consume horas y genera errores de IVA y precios.",
    solucion:
      "Mail compras@claver.com o upload PDF/XML: Gemini Vision extrae datos y pre-carga la compra mapeando productos del proveedor.",
    monetizacion: "por_uso",
    monetizacionDetalle: "$9.900/mes (100 docs) o $99 por PDF extra",
    precioArs: 9900,
    precioPorUsoArs: 99,
    audiencia: "B2B",
    autoCertLevel: "SEMI_AUTO",
    status: "beta",
    prioridadBuild: "ahora",
    stackTecnico: ["Gemini Vision", "compras", "proveedores", "email ingest", "UsageEvent"],
    dependeDe: ["fiscal.ocr"],
  },
  {
    sku: "intang.ruteador_entregas",
    rank: 7,
    nombre: "Ruteador Logístico y Notificador de Entregas",
    lema: "El cliente deja de llamar. El chofer deja de dar vueltas.",
    inspiradoEn: "Bringg · Odoo Delivery",
    dolor:
      "Consultas constantes de horario de entrega y rutas ineficientes de reparto.",
    solucion:
      "Agrupador geográfico con ruta óptima y WhatsApp automático al cliente cuando el chofer inicia recorrido con link de seguimiento.",
    monetizacion: "recurrente",
    monetizacionDetalle: "$19.900/mes",
    precioArs: 19900,
    audiencia: "B2B",
    autoCertLevel: "REGION_AUTO",
    status: "planned",
    prioridadBuild: "fase2",
    stackTecnico: ["logistica", "hojaRuta", "GPS", "WhatsApp", "POD"],
    dependeDe: ["com.whatsapp"],
  },
]

export function getPremiumIntangibleBySku(sku: string): IntangiblePremiumMeta | undefined {
  return INTANGIBLE_PREMIUM_7.find((s) => s.sku === sku)
}

export function getPremiumIntangiblesDisponibles(): IntangiblePremiumMeta[] {
  return INTANGIBLE_PREMIUM_7.filter((s) => s.status !== "planned")
}

export const PREMIUM_7_BUNDLE_ID = "pool-premium-erp-7"