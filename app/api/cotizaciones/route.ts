import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  actualizarCotizaciones,
  obtenerCotizacionActual,
  historialCotizaciones,
} from "@/lib/config/cotizacion-auto-service"

export async function GET(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response

  const { searchParams } = new URL(request.url)
  const moneda = searchParams.get("moneda")

  if (moneda) {
    const dias = Number(searchParams.get("dias")) || 30
    const historial = await historialCotizaciones(moneda, dias)
    return NextResponse.json(historial)
  }

  // Retornar cotizaciones actuales de todas las monedas
  const pares = ["USD_OFICIAL", "USD_MEP", "USD_CCL", "EUR", "BRL"]
  const actuales = await Promise.all(
    pares.map(async (par) => {
      const cot = await obtenerCotizacionActual(par)
      return cot ? { monedaPar: par, compra: cot.compra, venta: cot.venta, fecha: cot.fecha, fuente: cot.fuente } : null
    }),
  )
  return NextResponse.json(actuales.filter(Boolean))
}

export async function POST(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response

  const resultado = await actualizarCotizaciones()
  return NextResponse.json(resultado)
}
