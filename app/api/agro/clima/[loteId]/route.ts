import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

type ForecastDay = {
  date: string
  precipitationMm: number
  eto: number
  tempMax: number
  tempMin: number
  soilTemp: number | null
}

const cache = new Map<string, { at: number; payload: unknown }>()
const TTL = 60 * 60 * 1000

export async function GET(request: NextRequest, { params }: { params: Promise<{ loteId: string }> }) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const { loteId } = await params
  const id = Number(loteId)
  if (!id) return NextResponse.json({ error: "loteId inválido" }, { status: 400 })

  const key = `${auth.auth.empresaId}:${id}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL) return NextResponse.json(hit.payload)

  const lote = await prisma.agroLote.findFirst({
    where: { id, ...whereEmpresa(auth.auth.empresaId), activo: true },
    select: { id: true, nombre: true, lat: true, lon: true },
  })

  if (!lote) return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 })

  const lat = lote.lat ?? -34.6037
  const lon = lote.lon ?? -58.3816

  const url = new URL("https://api.open-meteo.com/v1/forecast")
  url.searchParams.set("latitude", String(lat))
  url.searchParams.set("longitude", String(lon))
  url.searchParams.set("daily", "precipitation_sum,et0_fao_evapotranspiration,temperature_2m_max,temperature_2m_min,soil_temperature_0cm")
  url.searchParams.set("timezone", "America/Argentina/Buenos_Aires")
  url.searchParams.set("forecast_days", "16")

  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) return NextResponse.json({ error: "No se pudo consultar Open-Meteo" }, { status: 502 })

  const data = await res.json() as {
    daily: {
      time: string[]
      precipitation_sum: number[]
      et0_fao_evapotranspiration: number[]
      temperature_2m_max: number[]
      temperature_2m_min: number[]
      soil_temperature_0cm?: number[]
    }
  }

  const forecast: ForecastDay[] = data.daily.time.map((date, i) => ({
    date,
    precipitationMm: data.daily.precipitation_sum[i] ?? 0,
    eto: data.daily.et0_fao_evapotranspiration[i] ?? 0,
    tempMax: data.daily.temperature_2m_max[i] ?? 0,
    tempMin: data.daily.temperature_2m_min[i] ?? 0,
    soilTemp: data.daily.soil_temperature_0cm?.[i] ?? null,
  }))

  const alertas: string[] = []
  if (forecast.some((d) => d.tempMin < 0)) alertas.push("HELADA pronosticada")
  if (forecast.some((d) => d.precipitationMm > 30)) alertas.push("LLUVIA intensa > 30mm")

  const payload = {
    lote,
    forecast,
    alertas,
    etoDiario: Number((forecast.reduce((s, d) => s + d.eto, 0) / Math.max(1, forecast.length)).toFixed(2)),
    source: "open-meteo",
    generatedAt: new Date().toISOString(),
  }

  cache.set(key, { at: Date.now(), payload })
  return NextResponse.json(payload)
}
