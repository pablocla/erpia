/** Catálogo client-safe — hoja de ruta campo (cualquier rubro) */

export const HOJA_RUTA_CONTEXTOS = [
  { id: "comercial", label: "Comercial / ventas calle" },
  { id: "logistica", label: "Logística / entregas" },
  { id: "servicio", label: "Servicio técnico / visitas" },
  { id: "cobranza", label: "Cobranza / recupero" },
  { id: "implementacion", label: "Implementación / onboarding" },
  { id: "otro", label: "Otro" },
] as const

export type HojaRutaContexto = (typeof HOJA_RUTA_CONTEXTOS)[number]["id"]

export const HOJA_RUTA_ESTADOS = [
  { id: "borrador", label: "Borrador" },
  { id: "activa", label: "Activa hoy" },
  { id: "completada", label: "Completada" },
] as const

export const PARADA_ESTADOS = [
  { id: "pendiente", label: "Pendiente" },
  { id: "visitada", label: "Visitada" },
  { id: "omitida", label: "Omitida" },
] as const

export const MAPA_PIN_COLORES: Record<string, string> = {
  prospecto: "#94a3b8",
  visita: "#3b82f6",
  trial: "#f59e0b",
  cerrado: "#10b981",
  provisionado: "#8b5cf6",
  descartado: "#64748b",
  relevamiento: "#06b6d4",
  manual: "#e879f9",
  pendiente: "#a78bfa",
  visitada: "#22c55e",
  omitida: "#78716c",
}

export function buildOsmDirectionsUrl(
  paradas: { lat: number; lon: number }[],
): string | null {
  if (paradas.length < 2) return null
  const coords = paradas.map((p) => `${p.lat},${p.lon}`).join(";")
  return `https://www.openstreetmap.org/directions?route=${coords}`
}

export function buildOsmExportUrl(
  paradas: { nombre: string; lat: number; lon: number }[],
): string {
  const markers = paradas
    .map((p) => `${p.lat},${p.lon},${encodeURIComponent(p.nombre)}`)
    .join("|")
  return `https://www.openstreetmap.org/?mlat=${paradas[0]?.lat ?? -34.6}&mlon=${paradas[0]?.lon ?? -58.4}&zoom=14#map=14/${paradas[0]?.lat ?? -34.6}/${paradas[0]?.lon ?? -58.4}`
}