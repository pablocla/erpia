/**
 * Rama Servicios Intangibles — Top 5 priorizado por impacto bolsillo + ansiedad.
 * Referencia: docs/marketplace/09-servicios-intangibles-top5.md
 */

export interface IntangibleServiceMeta {
  sku: string
  rank: 1 | 2 | 3 | 4 | 5
  nombre: string
  lema: string
  audiencia: "B2B" | "B2C" | "B2B/B2C"
  stickiness: string
  stackTecnico: string[]
  prioridadBuild: "ahora" | "proximo" | "fase2"
}

export const INTANGIBLES_TOP5: IntangibleServiceMeta[] = [
  {
    sku: "intang.cobranzas_wa",
    rank: 1,
    nombre: "Secretaria de Cobranzas WA",
    lema: "El link cobra. Vos seguís vendiendo.",
    audiencia: "B2B",
    stickiness: "Recupera caja día 1 — ROI inmediato en pesos.",
    stackTecnico: ["ERP cuentaCobrar", "reglaAlerta", "WhatsApp", "MercadoPago", "cron ia-diaria"],
    prioridadBuild: "ahora",
  },
  {
    sku: "intang.reputation_firewall",
    rank: 2,
    nombre: "Escudo Reputación",
    lema: "Que una mala reseña no te cierre el negocio.",
    audiencia: "B2B/B2C",
    stickiness: "Seguro de reputación 24/7 — paz mental.",
    stackTecnico: ["Google Business API", "LLM respuesta", "SMS Twilio", "n8n"],
    prioridadBuild: "proximo",
  },
  {
    sku: "intang.legal_shield",
    rank: 3,
    nombre: "Legal Shield",
    lema: "Tu abogado de bolsillo en 30 segundos.",
    audiencia: "B2B/B2C",
    stickiness: "Evitás una estafa → dependencia permanente.",
    stackTecnico: ["Email ingest legal@", "Gemini PDF", "semáforo cláusulas"],
    prioridadBuild: "proximo",
  },
  {
    sku: "intang.subs_tax_scanner",
    rank: 4,
    nombre: "Cazador de Gastos Zombies",
    lema: "Recuperá plata que se te escapa sin que te des cuenta.",
    audiencia: "B2C",
    stickiness: "Ahorro neto mensual visible en panel.",
    stackTecnico: ["OCR resumen", "Gemini clasificación", "catálogo suscripciones"],
    prioridadBuild: "fase2",
  },
  {
    sku: "intang.reactivador_clientes",
    rank: 5,
    nombre: "Despertador de Clientes",
    lema: "Oro de la basura: clientes que no compran hace meses.",
    audiencia: "B2B",
    stickiness: "Se paga solo — panel ROI gasto vs ventas recuperadas.",
    stackTecnico: ["CRM segmentación", "WhatsApp/SMS", "cupones", "atribución ventas"],
    prioridadBuild: "proximo",
  },
]

export function getIntangibleBySku(sku: string): IntangibleServiceMeta | undefined {
  return INTANGIBLES_TOP5.find((s) => s.sku === sku)
}

export function getIntangiblePrioridadAhora(): IntangibleServiceMeta {
  return INTANGIBLES_TOP5[0]
}

export {
  INTANGIBLE_PREMIUM_7,
  PREMIUM_7_BUNDLE_ID,
  getPremiumIntangibleBySku,
  getPremiumIntangiblesDisponibles,
  type IntangiblePremiumMeta,
  type MonetizacionPremium,
} from "./intangible-premium-7"