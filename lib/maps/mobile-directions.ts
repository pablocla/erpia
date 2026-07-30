/**
/**
 * Helper reutilizable para abrir direcciones en aplicaciones de mapas móviles
 * (Google Maps, Waze, Apple Maps).
 */

export interface LocationTarget {
  lat?: number | null
  lon?: number | null
  direccion?: string | null
}

/**
 * Genera la URL de Google Maps para llegar a un destino (coords o texto).
 * Funciona universalmente en Android, iOS y Web.
 */
export function buildGoogleMapsUrl(target: LocationTarget): string | null {
  const { lat, lon, direccion } = target
  if (lat != null && lon != null && !isNaN(lat) && !isNaN(lon)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
  }
  if (direccion && direccion.trim().length > 0) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(direccion.trim())}`
  }
  return null
}

/**
 * Genera la URL para iniciar navegación en Waze.
 */
export function buildWazeUrl(target: LocationTarget): string | null {
  const { lat, lon, direccion } = target
  if (lat != null && lon != null && !isNaN(lat) && !isNaN(lon)) {
    return `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`
  }
  if (direccion && direccion.trim().length > 0) {
    return `https://waze.com/ul?q=${encodeURIComponent(direccion.trim())}&navigate=yes`
  }
  return null
}

/**
 * Genera la URL para Apple Maps (iOS / macOS).
 */
export function buildAppleMapsUrl(target: LocationTarget): string | null {
  const { lat, lon, direccion } = target
  if (lat != null && lon != null && !isNaN(lat) && !isNaN(lon)) {
    return `https://maps.apple.com/?daddr=${lat},${lon}`
  }
  if (direccion && direccion.trim().length > 0) {
    return `https://maps.apple.com/?daddr=${encodeURIComponent(direccion.trim())}`
  }
  return null
}

/**
 * Arma la URL de ruta completa con múltiples paradas (waypoints) para Google Maps.
 */
export function buildRouteGoogleMapsUrl(paradas: LocationTarget[]): string | null {
  const valid = paradas
    .map((p) => {
      if (p.lat != null && p.lon != null && !isNaN(p.lat) && !isNaN(p.lon)) {
        return `${p.lat},${p.lon}`
      }
      if (p.direccion && p.direccion.trim().length > 0) {
        return encodeURIComponent(p.direccion.trim())
      }
      return null
    })
    .filter((loc): loc is string => loc !== null)

  if (valid.length === 0) return null
  if (valid.length === 1) return `https://www.google.com/maps/dir/?api=1&destination=${valid[0]}`

  const origin = valid[0]
  const destination = valid[valid.length - 1]
  const waypoints = valid.slice(1, valid.length - 1).join("|")

  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`
  if (waypoints) {
    url += `&waypoints=${waypoints}`
  }
  return url
}
