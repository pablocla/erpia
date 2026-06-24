import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function baseByCultivo(cultivo?: string | null) {
  const c = (cultivo ?? "").toLowerCase()
  if (c.includes("soja")) return 0.68
  if (c.includes("ma") || c.includes("maiz")) return 0.72
  if (c.includes("trigo")) return 0.64
  if (c.includes("girasol")) return 0.61
  if (c.includes("cebada")) return 0.62
  if (c.includes("sorgo")) return 0.66
  return 0.57
}

function ndviEstado(ndvi: number) {
  if (ndvi >= 0.7) return "excelente"
  if (ndvi >= 0.58) return "bueno"
  if (ndvi >= 0.45) return "atencion"
  return "critico"
}

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const lotes = await prisma.agroLote.findMany({
    where: { ...whereEmpresa(auth.auth.empresaId), activo: true },
    select: {
      id: true,
      nombre: true,
      superficieHa: true,
      cultivoActual: true,
      campana: true,
      lat: true,
      lon: true,
      proveedor: { select: { nombre: true } },
    },
    orderBy: { superficieHa: "desc" },
    take: 8,
  })

  const data = lotes.map((l) => {
    // MVP: estimador NDVI deterministic basado en cultivo + tamaño + id.
    // Cuando haya credenciales Sentinel Hub, reemplazar por índice real satelital.
    const base = baseByCultivo(l.cultivoActual)
    const ajusteSuperficie = Math.min(0.05, (l.superficieHa || 0) / 4000)
    const ruidoDeterministico = ((l.id % 7) - 3) * 0.01
    const ndvi = clamp(base + ajusteSuperficie + ruidoDeterministico, 0.28, 0.88)

    return {
      loteId: l.id,
      lote: l.nombre,
      productor: l.proveedor?.nombre ?? null,
      cultivo: l.cultivoActual ?? "Sin cultivo",
      campana: l.campana,
      superficieHa: l.superficieHa,
      ndvi: Number(ndvi.toFixed(3)),
      estado: ndviEstado(ndvi),
      fuente: "estimado_mvp",
      requiereSentinelToken: true,
      coords: l.lat != null && l.lon != null ? { lat: l.lat, lon: l.lon } : null,
    }
  })

  const promedio = data.length ? data.reduce((s, d) => s + d.ndvi, 0) / data.length : 0

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    promedioNdvi: Number(promedio.toFixed(3)),
    lotes: data,
  })
}

