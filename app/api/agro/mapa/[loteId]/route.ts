import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { ensureIoTSeeds, listMaquinaLogs, listMaquinas, listSensors, listZonas } from "@/lib/agro/iot-stub-store"

function ndviScore(cultivo?: string | null) {
  const c = (cultivo ?? "").toLowerCase()
  if (c.includes("soja")) return 0.68
  if (c.includes("ma") || c.includes("maiz")) return 0.72
  if (c.includes("trigo")) return 0.63
  if (c.includes("girasol")) return 0.6
  return 0.57
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ loteId: string }> }
) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const { loteId } = await params
  const id = Number(loteId)
  if (!id) return NextResponse.json({ error: "loteId inválido" }, { status: 400 })

  const lote = await prisma.agroLote.findFirst({
    where: { id, ...whereEmpresa(auth.auth.empresaId), activo: true },
    select: {
      id: true,
      nombre: true,
      superficieHa: true,
      lat: true,
      lon: true,
      geoJson: true,
      cultivoActual: true,
      campana: true,
    },
  })

  if (!lote) return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 })

  // seeds para que sensores/zonas existan
  const loteIds = [id]
  ensureIoTSeeds(auth.auth.empresaId, loteIds)

  // centroide — si no hay lat/lon usamos Argentina pampeana genérica
  const lat = lote.lat ?? -34.6037
  const lon = lote.lon ?? -58.3816

  // sensores del lote con última lectura
  const sensores = listSensors(auth.auth.empresaId, id).map((s) => ({
    id: s.id,
    nombre: s.nombre,
    tipo: s.tipo,
    activo: s.activo,
    // si no tiene coordenadas propias, distribuimos alrededor del centroide
    lat: s.lat ?? lat + ((s.id % 5) - 2) * 0.002,
    lon: s.lon ?? lon + ((s.id % 7) - 3) * 0.002,
  }))

  // zonas de riego del lote
  const zonas = listZonas(auth.auth.empresaId, id).map((z) => ({
    id: z.id,
    nombre: z.nombre,
    activa: z.activa,
    tipoRiego: z.tipoRiego,
  }))

  // maquinaria con último log
  const maquinas = listMaquinas(auth.auth.empresaId).map((m) => {
    const log = listMaquinaLogs(m.id, auth.auth.empresaId, 1)[0] ?? null
    if (!log) return null
    return {
      id: m.id,
      nombre: m.nombre,
      marca: m.marca,
      operacion: log.operacion,
      velocidad: log.velocidad,
      lat: log.lat ?? lat + ((m.id % 3) - 1) * 0.003,
      lon: log.lon ?? lon + ((m.id % 4) - 2) * 0.003,
    }
  }).filter(Boolean)

  // NDVI estimado del lote
  const base = ndviScore(lote.cultivoActual)
  const ajuste = Math.min(0.06, lote.superficieHa / 5000)
  const jitter = ((id % 9) - 4) * 0.008
  const ndviMedio = clamp(base + ajuste + jitter, 0.28, 0.89)

  // GeoJSON del lote — si no existe en BD, creamos un bbox genérico alrededor del centroide
  const loteGeoJson = lote.geoJson ?? {
    type: "Feature",
    properties: { nombre: lote.nombre },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [lon - 0.01, lat - 0.008],
        [lon + 0.01, lat - 0.008],
        [lon + 0.01, lat + 0.008],
        [lon - 0.01, lat + 0.008],
        [lon - 0.01, lat - 0.008],
      ]],
    },
  }

  return NextResponse.json({
    lote: { ...lote, lat, lon, geoJson: loteGeoJson },
    sensores,
    zonas,
    maquinas,
    ndviMedio: Number(ndviMedio.toFixed(3)),
  })
}
