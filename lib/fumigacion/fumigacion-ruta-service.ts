/**
 * Hoja de ruta de fumigadores — visitas del día con mapa gratis (OSM + Nominatim).
 */

import { prisma } from "@/lib/prisma"
import { buildAddressQuery, geocodeQuery } from "@/lib/maps/nominatim-geocode"
import { buildOsmDirectionsUrl } from "@/lib/maps/hoja-ruta-catalog"
import { labelPlaga, labelTipoServicio } from "@/lib/fumigacion/constants"

import { buildRouteGoogleMapsUrl } from "@/lib/maps/mobile-directions"

export type FumigacionParada = {
  id: string
  orden: number
  ordenServicioId: number
  numero: string
  titulo: string | null
  estado: string
  clienteId: number
  clienteNombre: string
  telefono: string | null
  direccion: string | null
  direccionComplemento: string | null
  lat: number | null
  lon: number | null
  tecnicoAsignado: string | null
  fechaPrometida: string | null
  plaga: string | null
  plagaLabel: string
  tipoServicio: string | null
  tipoServicioLabel: string
  sitio: string | null
  ordenRuta?: number | null
  observacionesVisita?: string | null
  montoCobrado?: number | null
  estadoPago?: string | null
  fechaVencimientoCertificado?: string | null
}

export type FumigacionRutaDia = {
  fecha: string
  paradas: FumigacionParada[]
  conCoordenadas: number
  sinCoordenadas: number
  routeLine: { lat: number; lon: number }[]
  osmDirectionsUrl: string | null
  googleMapsDirectionsUrl: string | null
}

/** Cache en proceso para no golpear Nominatim en cada refresh de la misma sesión */
const geoCache = new Map<string, { lat: number; lon: number }>()

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function parseMeta(metadata: unknown): {
  plaga?: string
  tipoServicio?: string
  sitio?: string
  direccionSitio?: string
  ordenRuta?: number
  observacionesVisita?: string
  montoCobrado?: number
  estadoPago?: string
  fechaVencimientoCertificado?: string
} {
  if (!metadata || typeof metadata !== "object") return {}
  const m = metadata as Record<string, unknown>
  return {
    plaga: typeof m.plaga === "string" ? m.plaga : undefined,
    tipoServicio: typeof m.tipoServicio === "string" ? m.tipoServicio : undefined,
    sitio: typeof m.sitio === "string" ? m.sitio : undefined,
    direccionSitio: typeof m.direccionSitio === "string" ? m.direccionSitio : undefined,
    ordenRuta: typeof m.ordenRuta === "number" ? m.ordenRuta : undefined,
    observacionesVisita: typeof m.observacionesVisita === "string" ? m.observacionesVisita : undefined,
    montoCobrado: typeof m.montoCobrado === "number" ? m.montoCobrado : undefined,
    estadoPago: typeof m.estadoPago === "string" ? m.estadoPago : undefined,
    fechaVencimientoCertificado: typeof m.fechaVencimientoCertificado === "string" ? m.fechaVencimientoCertificado : undefined,
  }
}

function clienteCoords(cliente: Record<string, unknown>): { lat: number | null; lon: number | null } {
  const lat = typeof cliente.lat === "number" ? cliente.lat : null
  const lon = typeof cliente.lon === "number" ? cliente.lon : null
  return { lat, lon }
}

async function ensureCoords(
  clienteId: number,
  direccion: string,
  existing: { lat: number | null; lon: number | null },
): Promise<{ lat: number; lon: number } | null> {
  if (existing.lat != null && existing.lon != null) {
    return { lat: existing.lat, lon: existing.lon }
  }

  const cacheKey = direccion.toLowerCase().trim()
  const cached = geoCache.get(cacheKey)
  if (cached) return cached

  const query = buildAddressQuery({ direccion, localidad: "Argentina" })
  if (!query) return null

  const geo = await geocodeQuery(query)
  if (!geo) return null

  const coords = { lat: geo.lat, lon: geo.lon }
  geoCache.set(cacheKey, coords)

  try {
    await (prisma.cliente as any).update({
      where: { id: clienteId },
      data: { lat: geo.lat, lon: geo.lon, geocodedAt: new Date() },
    })
  } catch {
    // Columnas lat/lon aún no migradas — coords solo en memoria
  }

  return coords
}

export function sortParadasByProximity(paradas: FumigacionParada[]): FumigacionParada[] {
  const result: FumigacionParada[] = []
  const remaining = [...paradas]

  let currentIdx = remaining.findIndex((p) => p.lat != null && p.lon != null)
  if (currentIdx === -1) return paradas

  let current = remaining.splice(currentIdx, 1)[0]
  result.push(current)

  while (remaining.length > 0) {
    if (current.lat == null || current.lon == null) {
      result.push(...remaining)
      break
    }

    let nearestIdx = -1
    let minDist = Infinity

    for (let i = 0; i < remaining.length; i++) {
      const p = remaining[i]
      if (p.lat != null && p.lon != null) {
        const dLat = p.lat - current.lat
        const dLon = p.lon - current.lon
        const dist = dLat * dLat + dLon * dLon
        if (dist < minDist) {
          minDist = dist
          nearestIdx = i
        }
      }
    }

    if (nearestIdx !== -1) {
      current = remaining.splice(nearestIdx, 1)[0]
      result.push(current)
    } else {
      result.push(...remaining)
      break
    }
  }

  return result.map((p, idx) => ({ ...p, orden: idx + 1 }))
}

/**
 * Visitas del día: OT con fechaPrometida = fecha, o abiertas creadas hoy.
 * Geocodifica direcciones de clientes (máx. maxGeocode por request, gratis via Nominatim).
 */
export async function getRutaFumigacionDia(
  empresaId: number,
  opts?: { fecha?: Date; maxGeocode?: number; tecnico?: string; diaSemana?: string; optimizarProximidad?: boolean },
): Promise<FumigacionRutaDia> {
  const fecha = opts?.fecha ?? new Date()
  const maxGeo = opts?.maxGeocode ?? 12
  const desde = startOfDay(fecha)
  const hasta = endOfDay(fecha)
  const fechaIso = desde.toISOString().slice(0, 10)

  const whereBase: Record<string, unknown> = {
    empresaId,
    activo: true,
    estado: { notIn: ["CANCELADO"] },
  }
  if (opts?.tecnico) {
    whereBase.tecnicoAsignado = { contains: opts.tecnico, mode: "insensitive" }
  }

  let ordenes = await prisma.ordenServicio.findMany({
    where: {
      ...whereBase,
      fechaPrometida: { gte: desde, lte: hasta },
    },
    include: {
      cliente: {
        select: {
          id: true,
          nombre: true,
          telefono: true,
          direccion: true,
          direccionComplemento: true,
        },
      },
    },
    orderBy: [{ fechaPrometida: "asc" }, { id: "asc" }],
  })

  if (ordenes.length === 0) {
    ordenes = await prisma.ordenServicio.findMany({
      where: {
        ...whereBase,
        estado: { in: ["PENDIENTE", "EN_PROCESO", "PRESUPUESTADO"] },
        fechaCreacion: { gte: desde, lte: hasta },
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            direccion: true,
            direccionComplemento: true,
          },
        },
      },
      orderBy: [{ fechaCreacion: "asc" }, { id: "asc" }],
    })
  }

  // Intentar cargar lat/lon si las columnas existen
  const clienteIds = [...new Set(ordenes.map((o) => o.clienteId))]
  const coordsByCliente = new Map<number, { lat: number | null; lon: number | null }>()
  if (clienteIds.length > 0) {
    try {
      const rows = (await (prisma.cliente as any).findMany({
        where: { id: { in: clienteIds }, empresaId },
        select: { id: true, lat: true, lon: true },
      })) as { id: number; lat: number | null; lon: number | null }[]
      for (const r of rows) {
        coordsByCliente.set(r.id, { lat: r.lat, lon: r.lon })
      }
    } catch {
      /* sin columnas aún */
    }
  }

  let geocoded = 0
  let sinCoordenadas = 0
  let paradas: FumigacionParada[] = []

  for (let i = 0; i < ordenes.length; i++) {
    const ot = ordenes[i]
    const cliente = ot.cliente
    const meta = parseMeta(ot.metadata)
    const direccion =
      meta.direccionSitio ||
      [cliente.direccion, cliente.direccionComplemento].filter(Boolean).join(", ") ||
      null

    const stored = coordsByCliente.get(cliente.id) ?? clienteCoords(cliente as unknown as Record<string, unknown>)
    let lat = stored.lat
    let lon = stored.lon

    if ((lat == null || lon == null) && direccion && geocoded < maxGeo) {
      const coords = await ensureCoords(cliente.id, direccion, { lat, lon })
      if (coords) {
        lat = coords.lat
        lon = coords.lon
        geocoded++
      }
    }

    if (lat == null || lon == null) sinCoordenadas++

    paradas.push({
      id: `ot-${ot.id}`,
      orden: i + 1,
      ordenServicioId: ot.id,
      numero: ot.numero,
      titulo: ot.titulo,
      estado: ot.estado,
      clienteId: cliente.id,
      clienteNombre: cliente.nombre,
      telefono: cliente.telefono,
      direccion,
      direccionComplemento: cliente.direccionComplemento,
      lat,
      lon,
      tecnicoAsignado: ot.tecnicoAsignado,
      fechaPrometida: ot.fechaPrometida?.toISOString() ?? null,
      plaga: meta.plaga ?? null,
      plagaLabel: labelPlaga(meta.plaga),
      tipoServicio: meta.tipoServicio ?? null,
      tipoServicioLabel: labelTipoServicio(meta.tipoServicio),
      sitio: meta.sitio ?? null,
      ordenRuta: meta.ordenRuta ?? null,
      observacionesVisita: meta.observacionesVisita ?? null,
      montoCobrado: meta.montoCobrado ?? null,
      estadoPago: meta.estadoPago ?? null,
      fechaVencimientoCertificado: meta.fechaVencimientoCertificado ?? null,
    })
  }

  // Si se solicita optimización por cercanía
  if (opts?.optimizarProximidad) {
    paradas = sortParadasByProximity(paradas)
  } else {
    // Si hay ordenes guardados en metadata, ordenar según eso
    paradas.sort((a, b) => {
      if (a.ordenRuta != null && b.ordenRuta != null) return a.ordenRuta - b.ordenRuta
      if (a.ordenRuta != null) return -1
      if (b.ordenRuta != null) return 1
      return 0
    })
  }

  // Re-indexar orden secuencial 1..N
  paradas.forEach((p, idx) => {
    p.orden = idx + 1
  })

  const routeLine = paradas
    .filter((p): p is FumigacionParada & { lat: number; lon: number } => p.lat != null && p.lon != null)
    .map((p) => ({ lat: p.lat, lon: p.lon, direccion: p.direccion }))

  return {
    fecha: fechaIso,
    paradas,
    conCoordenadas: routeLine.length,
    sinCoordenadas,
    routeLine: routeLine.map((r) => ({ lat: r.lat, lon: r.lon })),
    osmDirectionsUrl: buildOsmDirectionsUrl(routeLine),
    googleMapsDirectionsUrl: buildRouteGoogleMapsUrl(routeLine),
  }
}
