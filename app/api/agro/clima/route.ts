import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

interface OpenMeteoDaily {
  time: string[]
  precipitation_sum: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  et0_fao_evapotranspiration?: number[]
}

interface OpenMeteoResponse {
  latitude: number
  longitude: number
  timezone: string
  daily: OpenMeteoDaily
}

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const lotes = await prisma.agroLote.findMany({
    where: { ...whereEmpresa(auth.auth.empresaId), activo: true },
    select: { id: true, nombre: true, lat: true, lon: true, superficieHa: true },
    orderBy: { superficieHa: "desc" },
    take: 3,
  })

  const targets = lotes.length > 0
    ? lotes.filter((l) => l.lat != null && l.lon != null)
    : [{ id: 0, nombre: "Referencia local", lat: -34.6037, lon: -58.3816, superficieHa: 0 }]

  const resultados = await Promise.all(
    targets.map(async (lote) => {
      if (lote.lat == null || lote.lon == null) {
        return {
          loteId: lote.id,
          lote: lote.nombre,
          hasCoords: false,
          forecast: [],
        }
      }

      const url = new URL("https://api.open-meteo.com/v1/forecast")
      url.searchParams.set("latitude", String(lote.lat))
      url.searchParams.set("longitude", String(lote.lon))
      url.searchParams.set("daily", "precipitation_sum,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration")
      url.searchParams.set("timezone", "America/Argentina/Buenos_Aires")
      url.searchParams.set("forecast_days", "5")

      try {
        const res = await fetch(url, { next: { revalidate: 900 } })
        if (!res.ok) throw new Error("open-meteo-unavailable")
        const data = (await res.json()) as OpenMeteoResponse

        const forecast = data.daily.time.map((date, idx) => ({
          date,
          lluviaMm: data.daily.precipitation_sum[idx] ?? 0,
          tMax: data.daily.temperature_2m_max[idx] ?? 0,
          tMin: data.daily.temperature_2m_min[idx] ?? 0,
          et0: data.daily.et0_fao_evapotranspiration?.[idx] ?? null,
        }))

        const lluvia5d = forecast.reduce((sum, d) => sum + d.lluviaMm, 0)

        return {
          loteId: lote.id,
          lote: lote.nombre,
          hasCoords: true,
          coords: { lat: lote.lat, lon: lote.lon },
          lluvia5d,
          forecast,
          fuente: "open-meteo",
        }
      } catch {
        return {
          loteId: lote.id,
          lote: lote.nombre,
          hasCoords: true,
          coords: { lat: lote.lat, lon: lote.lon },
          lluvia5d: null,
          forecast: [],
          fuente: "fallback",
        }
      }
    }),
  )

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    lotes: resultados,
  })
}

