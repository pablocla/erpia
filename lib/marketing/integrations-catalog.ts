/**
 * Catálogo comercial de integraciones — copy de venta para landings Claver / Claverp.
 */

import { INTEGRATION_CATALOG, getNovedades, CATEGORIA_LABELS } from "@/lib/integrations/catalog"

export { INTEGRATION_CATALOG, getNovedades, CATEGORIA_LABELS }

export const INTEGRATIONS_HERO = {
  badge: "Novedad 2026",
  titulo: "Más de 30 conexiones nativas",
  subtitulo: "Shopify, Tienda Nube, Mercado Libre, Stripe, WhatsApp Business y logística argentina — sin Zapier obligatorio.",
  cta: "Ver todas las integraciones",
  ctaHref: "/claver/claverp/conexiones",
}

export const INTEGRATIONS_STATS = [
  { value: "30+", label: "Integraciones en catálogo" },
  { value: "12", label: "Novedades este trimestre" },
  { value: "0", label: "Middlewares obligatorios" },
  { value: "AR", label: "Foco Argentina + Latam" },
] as const

/** Copy corto para cards comerciales */
export function getIntegracionesComerciales(limit?: number) {
  return INTEGRATION_CATALOG
    .sort((a, b) => b.prioridad - a.prioridad)
    .slice(0, limit ?? INTEGRATION_CATALOG.length)
    .map((e) => ({
      id: e.id,
      nombre: e.nombre,
      emoji: e.emoji,
      categoria: CATEGORIA_LABELS[e.categoria] ?? e.categoria,
      descripcion: e.descripcionComercial,
      badge: e.badge,
      novedad: e.novedad ?? false,
      disponible: e.disponible,
    }))
}

export function getNovedadesComerciales() {
  return getNovedades().map((e) => ({
    id: e.id,
    nombre: e.nombre,
    emoji: e.emoji,
    descripcion: e.descripcionComercial,
    badge: e.badge ?? "Nuevo",
    categoria: CATEGORIA_LABELS[e.categoria],
  }))
}