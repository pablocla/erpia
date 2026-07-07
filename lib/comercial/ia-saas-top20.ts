/**
 * Top 20 empaquetados SaaS — IA fusionada con procesos ERP de Claver.
 * Fuente de verdad para Mi plan, marketplace, vitrine y upsell post-trial.
 */

import { resolvePrecioSku } from "@/lib/comercial/ofertas-comerciales"
import { fmtPrecioArs } from "@/lib/comercial/sub-saas-catalog"

export type IaSaasTier = "infra" | "inteligencia" | "operaciones" | "cobranza" | "nicho"
export type IaSaasEstado = "disponible" | "beta" | "planned"
export type IaSaasCobro = "mensual" | "por_uso" | "incluido"

export interface IaSaasPack {
  rank: number
  id: string
  nombre: string
  lema: string
  descripcion: string
  tier: IaSaasTier
  /** SKU principal de checkout Mercado Pago */
  skuPrincipal: string
  /** SKUs que se activan juntos (incluye dependencias) */
  skus: string[]
  /** Procesos ERP / servicios que recicla */
  procesosErp: string[]
  /** Endpoints o crons que consumen Gemini */
  rutasIa: string[]
  precioArs: number
  tipoCobro?: IaSaasCobro
  estado?: IaSaasEstado
  rubros: string[]
  requiereCoreIa: boolean
  dashboardPath: string
  activarHref: string
  bundleId?: string
  destacado?: boolean
}

export interface IaSaasTierPack {
  id: string
  nombre: string
  lema: string
  packIds: string[]
  precioPackArs: number
  ahorroPct: number
}

function precioSkus(skus: string[]): number {
  return skus.reduce((sum, sku) => sum + resolvePrecioSku(sku), 0)
}

function pack(input: Omit<IaSaasPack, "precioArs" | "activarHref"> & { precioArs?: number }): IaSaasPack {
  const precio =
    input.precioArs ??
    (input.skus.length > 0 ? precioSkus(input.skus) : resolvePrecioSku(input.skuPrincipal))
  return {
    ...input,
    precioArs: precio,
    activarHref: `/login?activar=${encodeURIComponent(input.skuPrincipal)}`,
  }
}

/** Los 20 empaquetados ordenados por prioridad comercial */
export const IA_SAAS_TOP_20: IaSaasPack[] = [
  pack({
    rank: 1,
    id: "asistente-negocio",
    nombre: "Asistente del Negocio",
    lema: "Preguntale a tu ERP en español.",
    descripcion:
      "Chat con contexto de ventas, stock, caja y clientes. El dueño pregunta y la IA responde con números reales del negocio.",
    tier: "infra",
    skuPrincipal: "core.ia",
    skus: ["core.ia"],
    procesosErp: ["ventas", "stock", "caja", "clientes", "context-builder"],
    rutasIa: ["/api/ai/chat", "/api/ai/preguntar"],
    
    
    rubros: ["*"],
    requiereCoreIa: true,
    dashboardPath: "/dashboard",
    destacado: true,
  }),
  pack({
    rank: 2,
    id: "pulse-matutino",
    nombre: "Pulse Matutino KPI",
    lema: "Tres números críticos antes de abrir el local.",
    descripcion: "Métricas del día anterior y alertas urgentes al iniciar la jornada.",
    tier: "inteligencia",
    skuPrincipal: "gen.intel.pulse_diario",
    skus: ["core.ia", "gen.intel.pulse_diario"],
    procesosErp: ["ventas", "caja", "stock", "centro-alertas"],
    rutasIa: ["/api/cron/ia-diaria", "/api/ai/alertas"],
    
    rubros: ["kiosco", "almacen", "gastronomia"],
    requiereCoreIa: true,
    dashboardPath: "/dashboard",
    destacado: true,
  }),
  pack({
    rank: 3,
    id: "briefing-semanal",
    nombre: "Briefing Ejecutivo Semanal",
    lema: "Resumen de caja, ventas y stock en una página.",
    descripcion: "Email semanal generado por IA con highlights, riesgos y oportunidades.",
    tier: "inteligencia",
    skuPrincipal: "gen.intel.briefing_semanal",
    skus: ["core.ia", "gen.intel.briefing_semanal"],
    procesosErp: ["ventas", "caja", "stock", "reportes"],
    rutasIa: ["/api/ai/reporte", "/api/cron/ia-diaria"],
    
    rubros: ["gerencia", "retail", "distribuidora"],
    requiereCoreIa: true,
    dashboardPath: "/dashboard/reportes",
  }),
  pack({
    rank: 4,
    id: "alertas-inteligentes",
    nombre: "Alertas Inteligentes",
    lema: "La IA revisa tu negocio mientras dormís.",
    descripcion: "Análisis nocturno de ventas, stock, cobranza y clientes con alertas priorizadas.",
    tier: "inteligencia",
    skuPrincipal: "core.ia",
    skus: ["core.ia"],
    procesosErp: ["centro-alertas", "notificaciones", "telegram"],
    rutasIa: ["/api/ai/alertas", "/api/cron/ia-diaria"],
    
    
    rubros: ["*"],
    requiereCoreIa: true,
    dashboardPath: "/dashboard/centro-alertas",
    destacado: true,
  }),
  pack({
    rank: 5,
    id: "cobra-ia",
    nombre: "Claver Cobrá con IA",
    lema: "Morosos priorizados y mensajes listos para WhatsApp.",
    descripcion: "Analiza cuentas por cobrar, estima probabilidad de cobro y redacta mensajes personalizados.",
    tier: "cobranza",
    skuPrincipal: "intang.cobranzas_wa",
    skus: ["core.ia", "intang.cobranzas_wa"],
    procesosErp: ["cuentas-cobrar", "clientes", "whatsapp", "fiado"],
    rutasIa: ["/api/ai/cobranza", "/api/ai/whatsapp-mensajes"],
    
    rubros: ["almacen", "distribuidora", "ferreteria", "servicios", "monotributista", "contratista", "consultor"],
    requiereCoreIa: true,
    dashboardPath: "/dashboard/cuentas-cobrar",
    bundleId: "pool-ia-cobranza",
    destacado: true,
  }),
  pack({
    rank: 6,
    id: "fiado-cobro-inteligente",
    nombre: "Fiado + Cobro Inteligente",
    lema: "Libreta gratis. Avisos de deuda automáticos.",
    descripcion: "Combiná libreta digital con cobranza por WhatsApp cuando el cliente debe.",
    tier: "cobranza",
    skuPrincipal: "pos.fiado_barrio",
    skus: ["pos.fiado_barrio", "intang.cobranzas_wa"],
    procesosErp: ["fiado", "clientes", "whatsapp", "cuentas-cobrar"],
    rutasIa: ["/api/ai/cobranza", "/api/fiado"],
    
    rubros: ["kiosco", "almacen", "carniceria"],
    requiereCoreIa: false,
    tipoCobro: "mensual",
    dashboardPath: "/dashboard/fiado",
    bundleId: "pool-almacen-barrio",
    destacado: true,
  }),
  pack({
    rank: 7,
    id: "reactivador-clientes",
    nombre: "Reactivador de Clientes",
    lema: "Enterate antes de perder al cliente.",
    descripcion: "Detecta caída de frecuencia de compra y dispara campañas de win-back.",
    tier: "cobranza",
    skuPrincipal: "intang.reactivador_clientes",
    skus: ["core.ia", "intang.reactivador_clientes"],
    procesosErp: ["clientes", "ventas", "whatsapp", "crm"],
    rutasIa: ["/api/ai/agentes"],
    estado: "planned",
    rubros: ["distribuidora", "b2b"],
    requiereCoreIa: true,
    dashboardPath: "/dashboard/clientes",
  }),
  pack({
    rank: 8,
    id: "reponedor-jit",
    nombre: "Reponedor Inteligente",
    lema: "Qué comprar esta semana, sin Excel.",
    descripcion: "Predicción de reposición según ventas, estacionalidad y lead time de proveedores.",
    tier: "operaciones",
    skuPrincipal: "intang.reponedor_jit",
    skus: ["core.ia", "intang.reponedor_jit"],
    procesosErp: ["stock", "compras", "productos", "proveedores"],
    rutasIa: ["/api/ai/prediccion-compras"],
    estado: "beta",
    rubros: ["almacen", "kiosco", "ferreteria"],
    requiereCoreIa: true,
    dashboardPath: "/dashboard/compras",
    bundleId: "pool-ia-operaciones",
  }),
  pack({
    rank: 9,
    id: "stock-muerto",
    nombre: "Alerta Stock Muerto",
    lema: "Capital congelado en góndola, bajo radar.",
    descripcion: "Identifica productos sin rotación y sugiere acciones de liquidación o devolución.",
    tier: "operaciones",
    skuPrincipal: "gen.intel.dead_stock",
    skus: ["core.ia", "gen.intel.dead_stock"],
    procesosErp: ["stock", "productos", "reportes"],
    rutasIa: ["/api/cron/ia-diaria"],
    
    rubros: ["retail", "distribuidora"],
    requiereCoreIa: true,
    dashboardPath: "/dashboard/stock",
  }),
  pack({
    rank: 10,
    id: "guardian-pos",
    nombre: "Guardián POS",
    lema: "Fraude hormiga detectado antes del arqueo.",
    descripcion: "Anomalías en descuentos, anulaciones y horarios raros en caja.",
    tier: "operaciones",
    skuPrincipal: "intang.guardian_pos",
    skus: ["core.ia", "intang.guardian_pos"],
    procesosErp: ["pos", "caja", "auditoria", "notas-credito"],
    rutasIa: ["/api/ai/anomalias"],
    
    rubros: ["retail", "gastronomia"],
    requiereCoreIa: true,
    dashboardPath: "/dashboard/caja",
    bundleId: "pool-ia-operaciones",
  }),
  pack({
    rank: 11,
    id: "ocr-compras",
    nombre: "OCR Compras Inteligente",
    lema: "Foto de factura ? borrador de compra.",
    descripcion: "Gemini Vision extrae ítems de PDF/foto y pre-carga la orden de compra.",
    tier: "operaciones",
    skuPrincipal: "intang.ocr_compras",
    skus: ["core.ia", "intang.ocr_compras"],
    procesosErp: ["compras", "proveedores", "stock", "impuestos"],
    rutasIa: ["/api/compras"],
    tipoCobro: "por_uso",
    estado: "beta",
    rubros: ["almacen", "distribuidora"],
    requiereCoreIa: true,
    dashboardPath: "/dashboard/compras",
  }),
  pack({
    rank: 12,
    id: "clasificador-productos",
    nombre: "Clasificador de Productos IA",
    lema: "Alta de producto en segundos, sin errores de IVA.",
    descripcion: "Sugiere categoría, alícuota, código y detecta duplicados al cargar el catálogo.",
    tier: "operaciones",
    skuPrincipal: "core.ia",
    skus: ["core.ia"],
    procesosErp: ["productos", "stock", "afip"],
    rutasIa: ["/api/ai/clasificar-producto"],
    
    
    rubros: ["retail", "ecommerce"],
    requiereCoreIa: true,
    dashboardPath: "/dashboard/productos",
  }),
  pack({
    rank: 13,
    id: "presupuesto-voz",
    nombre: "Presupuesto por Voz",
    lema: "Dictá el presupuesto, la IA arma las líneas.",
    descripcion: "El vendedor describe el pedido y obtiene un presupuesto con productos del catálogo.",
    tier: "operaciones",
    skuPrincipal: "core.ia",
    skus: ["core.ia", "core.claver"],
    procesosErp: ["ventas", "presupuestos", "productos", "clientes"],
    rutasIa: ["/api/ai/presupuesto"],
    
    rubros: ["ferreteria", "distribuidora", "servicios"],
    requiereCoreIa: true,
    dashboardPath: "/dashboard/ventas/presupuestos",
  }),
  pack({
    rank: 14,
    id: "reportes-naturales",
    nombre: "Reportes en Lenguaje Natural",
    lema: "¿Cómo me fue este mes? — con números reales.",
    descripcion: "Preguntas en español sobre ventas, márgenes y comparaciones vs períodos anteriores.",
    tier: "inteligencia",
    skuPrincipal: "core.ia",
    skus: ["core.ia"],
    procesosErp: ["ventas", "reportes", "contabilidad"],
    rutasIa: ["/api/ai/preguntar", "/api/ai/reporte"],
    
    
    rubros: ["gerencia", "*"],
    requiereCoreIa: true,
    dashboardPath: "/dashboard/reportes",
    bundleId: "pool-ia-gerencia",
  }),
  pack({
    rank: 15,
    id: "forecast-caja",
    nombre: "Forecast de Caja 90 días",
    lema: "¿Llego a fin de mes con la plata?",
    descripcion: "Proyección de liquidez cruzando CxC, CxP, compras y gastos recurrentes.",
    tier: "inteligencia",
    skuPrincipal: "gen.intel.forecast_caja",
    skus: ["core.ia", "gen.intel.forecast_caja"],
    procesosErp: ["banco", "cuentas-cobrar", "cuentas-pagar", "tesoreria"],
    rutasIa: ["/api/ai/proyeccion"],
    
    rubros: ["pyme", "gerencia"],
    requiereCoreIa: true,
    dashboardPath: "/dashboard/banco",
    bundleId: "pool-ia-gerencia",
  }),
  pack({
    rank: 16,
    id: "claver-contenido",
    nombre: "Claver Contenido",
    lema: "30 posts para tu rubro en un clic.",
    descripcion: "Grillas de Instagram/WhatsApp generadas según productos y temporada.",
    tier: "inteligencia",
    skuPrincipal: "gen.content.redes_rubro",
    skus: ["core.ia", "gen.content.redes_rubro"],
    procesosErp: ["marketing", "productos", "ecommerce"],
    rutasIa: ["/api/ai/agentes", "/api/cron/generative"],
    estado: "beta",
    rubros: ["retail", "gastronomia", "servicios"],
    requiereCoreIa: true,
    dashboardPath: "/dashboard/apps",
    destacado: true,
  }),
  pack({
    rank: 17,
    id: "turnobot",
    nombre: "TurnoBot WhatsApp",
    lema: "Agenda turnos y cobrá la seña por chat.",
    descripcion: "Bot conversacional para peluquerías, estética y consultorios con link de pago.",
    tier: "nicho",
    skuPrincipal: "gen.turnobot",
    skus: ["core.ia", "gen.turnobot", "com.whatsapp"],
    procesosErp: ["agenda", "clientes", "mercadopago"],
    rutasIa: ["/api/cron/generative", "/api/webhooks/whatsapp"],
    estado: "beta",
    rubros: ["peluqueria", "estetica", "salud"],
    requiereCoreIa: true,
    dashboardPath: "/dashboard/agenda",
    bundleId: "pool-ia-nicho-servicios",
  }),
  pack({
    rank: 18,
    id: "menu-dinamico",
    nombre: "Menú Dinámico Chef",
    lema: "Subió el insumo ? recalculá platos y QR.",
    descripcion: "Actualiza costos de recetas y precios del menú QR cuando cambian los insumos.",
    tier: "nicho",
    skuPrincipal: "gen.menu-dinamico",
    skus: ["core.ia", "gen.menu-dinamico"],
    procesosErp: ["hospitalidad", "platos", "stock", "compras"],
    rutasIa: ["/api/cron/generative"],
    estado: "beta",
    rubros: ["gastronomia", "rotiseria"],
    requiereCoreIa: true,
    dashboardPath: "/dashboard/hospitalidad/platos",
    bundleId: "pool-ia-nicho-gastro",
  }),
  pack({
    rank: 19,
    id: "vet-voice",
    nombre: "Vet Voice",
    lema: "Dictá la consulta ? historia clínica + caja.",
    descripcion: "Separa diagnóstico médico de ítems comerciales mientras el veterinario atiende.",
    tier: "nicho",
    skuPrincipal: "gen.vet-voice",
    skus: ["core.ia", "gen.vet-voice"],
    procesosErp: ["historia-clinica", "veterinaria", "pos", "stock"],
    rutasIa: ["/api/cron/generative", "/api/historia-clinica"],
    estado: "planned",
    rubros: ["veterinaria"],
    requiereCoreIa: true,
    dashboardPath: "/dashboard/historia-clinica",
    bundleId: "pool-ia-nicho-servicios",
  }),
  pack({
    rank: 20,
    id: "agentes-autopilot",
    nombre: "Pack Agentes Autopilot",
    lema: "Marketing, cobranza y stock en piloto automático.",
    descripcion: "Ejecuta agentes nocturnos: cobranzas, stock, marketing, reportes y más.",
    tier: "infra",
    skuPrincipal: "core.ia",
    skus: ["core.ia"],
    procesosErp: ["agentes", "cron", "alertas", "whatsapp"],
    rutasIa: ["/api/cron/agentes", "/api/ai/agentes/batch"],
    
    
    rubros: ["*"],
    requiereCoreIa: true,
    dashboardPath: "/dashboard/apps",
    bundleId: "pool-ia-autopilot",
    destacado: true,
  }),
]

export const IA_SAAS_TIER_PACKS: IaSaasTierPack[] = [
  {
    id: "pool-ia-starter",
    nombre: "IA Starter",
    lema: "Motor + pulse + alertas para arrancar.",
    packIds: ["asistente-negocio", "pulse-matutino", "alertas-inteligentes"],
    precioPackArs: 19900,
    ahorroPct: 20,
  },
  {
    id: "pool-ia-gerencia",
    nombre: "IA Gerencia",
    lema: "Reportes, forecast y briefing para el dueño.",
    packIds: ["reportes-naturales", "forecast-caja", "briefing-semanal"],
    precioPackArs: 54900,
    ahorroPct: 18,
  },
  {
    id: "pool-ia-cobranza",
    nombre: "IA Cobranza",
    lema: "Recuperá deuda sin llamar uno por uno.",
    packIds: ["cobra-ia", "fiado-cobro-inteligente"],
    precioPackArs: 39900,
    ahorroPct: 15,
  },
  {
    id: "pool-ia-operaciones",
    nombre: "IA Operaciones",
    lema: "Stock, compras y caja bajo control.",
    packIds: ["reponedor-jit", "stock-muerto", "guardian-pos", "clasificador-productos"],
    precioPackArs: 44900,
    ahorroPct: 22,
  },
  {
    id: "pool-ia-autopilot",
    nombre: "IA Autopilot",
    lema: "Agentes nocturnos + motor completo.",
    packIds: ["agentes-autopilot", "alertas-inteligentes", "asistente-negocio"],
    precioPackArs: 29900,
    ahorroPct: 25,
  },
]

const BY_ID = Object.fromEntries(IA_SAAS_TOP_20.map((p) => [p.id, p])) as Record<string, IaSaasPack>
const BY_SKU = new Map<string, IaSaasPack>()
for (const p of IA_SAAS_TOP_20) {
  if (!BY_SKU.has(p.skuPrincipal)) BY_SKU.set(p.skuPrincipal, p)
}

export function getIaSaasPack(id: string): IaSaasPack | null {
  return BY_ID[id] ?? null
}

export function getIaSaasBySku(sku: string): IaSaasPack | null {
  return BY_SKU.get(sku) ?? null
}

export function iaSaasDestacados(): IaSaasPack[] {
  return IA_SAAS_TOP_20.filter((p) => p.destacado)
}

export function iaSaasPorTier(tier: IaSaasTier): IaSaasPack[] {
  return IA_SAAS_TOP_20.filter((p) => p.tier === tier)
}

export function iaSaasPorRubro(rubro: string): IaSaasPack[] {
  const r = rubro.toLowerCase()
  return IA_SAAS_TOP_20.filter(
    (p) => p.rubros.includes("*") || p.rubros.some((x) => r.includes(x) || x.includes(r)),
  )
}

export function iaSaasDisponibles(): IaSaasPack[] {
  return IA_SAAS_TOP_20.filter((p) => p.estado !== "planned")
}

export function skusDelTierPack(tierPackId: string): string[] {
  const tier = IA_SAAS_TIER_PACKS.find((t) => t.id === tierPackId)
  if (!tier) return []
  const skus = new Set<string>()
  for (const packId of tier.packIds) {
    const p = getIaSaasPack(packId)
    if (p) p.skus.forEach((s) => skus.add(s))
  }
  return [...skus]
}

export function resumenComercialTop20() {
  const disponibles = iaSaasDisponibles().length
  const precioDesde = Math.min(...IA_SAAS_TOP_20.filter((p) => p.precioArs > 0).map((p) => p.precioArs))
  return {
    total: IA_SAAS_TOP_20.length,
    disponibles,
    tiers: IA_SAAS_TIER_PACKS.length,
    precioDesdeFmt: fmtPrecioArs(precioDesde === Infinity ? 0 : precioDesde),
  }
}

export { fmtPrecioArs }






