import { prisma } from "@/lib/prisma"
import { buildAddressQuery, geocodeQuery } from "@/lib/maps/nominatim-geocode"
import { listComercialLeads } from "@/lib/ops/comercial-pipeline-service"
import { listRelevamientos } from "@/lib/ops/comercial-relevamiento-service"

function db() {
  return prisma as any
}

export type MapaPin = {
  id: string
  tipo: "lead" | "relevamiento" | "parada"
  refId: number
  nombre: string
  subtitulo: string | null
  direccion: string | null
  localidad: string | null
  rubro: string | null
  etapa: string
  lat: number
  lon: number
  telefono: string | null
}

async function ensureCoords(
  table: "comercialPipelineLead" | "comercialRelevamientoVisita",
  id: number,
  parts: { direccion?: string | null; localidad?: string | null; negocio?: string },
  existing?: { lat: number | null; lon: number | null },
): Promise<{ lat: number; lon: number } | null> {
  if (existing?.lat != null && existing?.lon != null) {
    return { lat: existing.lat, lon: existing.lon }
  }
  const query = buildAddressQuery({ ...parts, negocio: parts.negocio })
  if (!query) return null

  const geo = await geocodeQuery(query)
  if (!geo) return null

  await db()[table].update({
    where: { id },
    data: { lat: geo.lat, lon: geo.lon, geocodedAt: new Date() },
  })

  return { lat: geo.lat, lon: geo.lon }
}

export async function getMapaCampoPins(opts?: {
  rubro?: string
  maxGeocode?: number
}): Promise<{ pins: MapaPin[]; sinCoordenadas: number }> {
  const maxGeo = opts?.maxGeocode ?? 8
  let geocoded = 0
  let sinCoordenadas = 0
  const pins: MapaPin[] = []

  const [leads, relevamientos] = await Promise.all([
    listComercialLeads(),
    listRelevamientos(100),
  ])

  for (const lead of leads) {
    if (opts?.rubro && lead.rubro && lead.rubro !== opts.rubro) continue
    if (lead.etapa === "descartado") continue

    let lat = lead.lat
    let lon = lead.lon

    if ((lat == null || lon == null) && geocoded < maxGeo) {
      const row = await db().comercialPipelineLead.findUnique({
        where: { id: lead.id },
        select: { lat: true, lon: true, negocio: true, localidad: true },
      })
      const coords = await ensureCoords(
        "comercialPipelineLead",
        lead.id,
        { direccion: null, localidad: lead.localidad, negocio: lead.negocio ?? lead.nombre },
        row,
      )
      if (coords) {
        lat = coords.lat
        lon = coords.lon
        geocoded++
      }
    }

    if (lat == null || lon == null) {
      sinCoordenadas++
      continue
    }

    pins.push({
      id: `lead-${lead.id}`,
      tipo: "lead",
      refId: lead.id,
      nombre: lead.negocio ?? lead.nombre,
      subtitulo: lead.nombre,
      direccion: null,
      localidad: lead.localidad,
      rubro: lead.rubro,
      etapa: lead.etapa,
      lat,
      lon,
      telefono: lead.telefono,
    })
  }

  for (const rel of relevamientos) {
    if (opts?.rubro && rel.rubro && rel.rubro !== opts.rubro) continue

    let lat = rel.lat
    let lon = rel.lon

    if ((lat == null || lon == null) && geocoded < maxGeo) {
      const row = await db().comercialRelevamientoVisita.findUnique({
        where: { id: rel.id },
        select: { lat: true, lon: true, direccion: true, localidad: true, negocio: true },
      })
      const coords = await ensureCoords(
        "comercialRelevamientoVisita",
        rel.id,
        { direccion: rel.direccion, localidad: rel.localidad, negocio: rel.negocio },
        row,
      )
      if (coords) {
        lat = coords.lat
        lon = coords.lon
        geocoded++
      }
    }

    if (lat == null || lon == null) {
      sinCoordenadas++
      continue
    }

    pins.push({
      id: `rel-${rel.id}`,
      tipo: "relevamiento",
      refId: rel.id,
      nombre: rel.negocio,
      subtitulo: rel.nombreContacto,
      direccion: rel.direccion,
      localidad: rel.localidad,
      rubro: rel.rubro,
      etapa: "relevamiento",
      lat,
      lon,
      telefono: rel.telefono,
    })
  }

  return { pins, sinCoordenadas }
}