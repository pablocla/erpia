import { prisma } from "@/lib/prisma"
import { buildAddressQuery, geocodeQuery } from "@/lib/maps/nominatim-geocode"
import type { HojaRutaContexto } from "@/lib/maps/hoja-ruta-catalog"

function db() {
  return prisma as any
}

export type ParadaInput = {
  nombre: string
  direccion?: string
  localidad?: string
  telefono?: string
  rubro?: string
  lat?: number
  lon?: number
  origenTipo?: string
  origenId?: number
  notas?: string
}

export type HojaRutaInput = {
  titulo: string
  fecha: string
  contexto?: HojaRutaContexto
  rubro?: string
  notas?: string
  paradas: ParadaInput[]
}

async function resolveCoords(p: ParadaInput): Promise<{ lat: number | null; lon: number | null }> {
  if (p.lat != null && p.lon != null) return { lat: p.lat, lon: p.lon }
  const query = buildAddressQuery({ direccion: p.direccion, localidad: p.localidad, negocio: p.nombre })
  if (!query) return { lat: null, lon: null }
  const geo = await geocodeQuery(query)
  return geo ? { lat: geo.lat, lon: geo.lon } : { lat: null, lon: null }
}

export async function listHojasRuta(limit = 30) {
  const rows = await db().comercialHojaRuta.findMany({
    orderBy: { fecha: "desc" },
    take: limit,
    include: { paradas: { orderBy: { orden: "asc" } } },
  })
  return rows.map(mapHoja)
}

export async function getHojaRuta(id: number) {
  const row = await db().comercialHojaRuta.findUnique({
    where: { id },
    include: { paradas: { orderBy: { orden: "asc" } } },
  })
  return row ? mapHoja(row) : null
}

function mapHoja(row: Record<string, unknown>) {
  const paradas = (row.paradas as Record<string, unknown>[]) ?? []
  return {
    id: row.id as number,
    titulo: row.titulo as string,
    fecha: new Date(row.fecha as string).toISOString().slice(0, 10),
    contexto: row.contexto as string,
    rubro: (row.rubro as string | null) ?? null,
    estado: row.estado as string,
    notas: (row.notas as string | null) ?? null,
    operador: row.operador as string,
    paradas: paradas.map((p) => ({
      id: p.id as number,
      orden: p.orden as number,
      nombre: p.nombre as string,
      direccion: (p.direccion as string | null) ?? null,
      localidad: (p.localidad as string | null) ?? null,
      lat: (p.lat as number | null) ?? null,
      lon: (p.lon as number | null) ?? null,
      telefono: (p.telefono as string | null) ?? null,
      rubro: (p.rubro as string | null) ?? null,
      origenTipo: (p.origenTipo as string | null) ?? null,
      origenId: (p.origenId as number | null) ?? null,
      estado: p.estado as string,
      notas: (p.notas as string | null) ?? null,
    })),
  }
}

export async function createHojaRuta(input: HojaRutaInput, operador: string) {
  const hoja = await db().comercialHojaRuta.create({
    data: {
      titulo: input.titulo.trim(),
      fecha: new Date(input.fecha),
      contexto: input.contexto ?? "comercial",
      rubro: input.rubro?.trim() || null,
      estado: "activa",
      notas: input.notas?.trim() || null,
      operador: operador.trim().toLowerCase(),
    },
  })

  for (let i = 0; i < input.paradas.length; i++) {
    const p = input.paradas[i]
    const coords = await resolveCoords(p)
    await db().comercialHojaRutaParada.create({
      data: {
        hojaRutaId: hoja.id,
        orden: i + 1,
        nombre: p.nombre.trim(),
        direccion: p.direccion?.trim() || null,
        localidad: p.localidad?.trim() || null,
        telefono: p.telefono?.trim() || null,
        rubro: p.rubro?.trim() || null,
        lat: coords.lat,
        lon: coords.lon,
        origenTipo: p.origenTipo || null,
        origenId: p.origenId ?? null,
        estado: "pendiente",
        notas: p.notas?.trim() || null,
      },
    })
  }

  return getHojaRuta(hoja.id)
}

export async function updateParadaEstado(paradaId: number, estado: string) {
  await db().comercialHojaRutaParada.update({
    where: { id: paradaId },
    data: { estado },
  })
  return getHojaRuta(
    (
      await db().comercialHojaRutaParada.findUnique({
        where: { id: paradaId },
        select: { hojaRutaId: true },
      })
    )?.hojaRutaId ?? 0,
  )
}

export async function updateHojaRutaEstado(hojaId: number, estado: string) {
  await db().comercialHojaRuta.update({
    where: { id: hojaId },
    data: { estado },
  })
  return getHojaRuta(hojaId)
}

export async function getHojaRutaMapaPins(hojaId: number) {
  const hoja = await getHojaRuta(hojaId)
  if (!hoja) return []
  return hoja.paradas
    .filter((p) => p.lat != null && p.lon != null)
    .map((p) => ({
      id: `parada-${p.id}`,
      tipo: "parada" as const,
      refId: p.id,
      nombre: `${p.orden}. ${p.nombre}`,
      subtitulo: p.estado,
      direccion: p.direccion,
      localidad: p.localidad,
      rubro: p.rubro,
      etapa: p.estado,
      lat: p.lat!,
      lon: p.lon!,
      telefono: p.telefono,
      orden: p.orden,
    }))
}