/**
 * Geocodificación gratuita vía Nominatim (OpenStreetMap).
 * Política de uso: máx ~1 req/seg, User-Agent identificable.
 */

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search"
const USER_AGENT = "ClaverCloud/1.0 (campo-mapa; contacto: claver.com.ar)"

let lastRequestAt = 0

async function throttle() {
  const wait = Math.max(0, 1100 - (Date.now() - lastRequestAt))
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastRequestAt = Date.now()
}

export type GeocodeResult = {
  lat: number
  lon: number
  displayName: string
}

export function buildAddressQuery(parts: {
  direccion?: string | null
  localidad?: string | null
  negocio?: string | null
}): string | null {
  const bits = [parts.direccion, parts.localidad, "Argentina"].filter(Boolean)
  if (bits.length < 2) return null
  return bits.join(", ")
}

export async function geocodeQuery(query: string): Promise<GeocodeResult | null> {
  const q = query.trim()
  if (!q) return null

  await throttle()

  const url = new URL(NOMINATIM_BASE)
  url.searchParams.set("q", q)
  url.searchParams.set("format", "json")
  url.searchParams.set("limit", "1")
  url.searchParams.set("countrycodes", "ar")

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    next: { revalidate: 86400 },
  })

  if (!res.ok) return null

  const data = (await res.json()) as { lat: string; lon: string; display_name: string }[]
  if (!data?.length) return null

  return {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon),
    displayName: data[0].display_name,
  }
}