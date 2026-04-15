/**
 * Cotización Automática BNA/BCRA Service
 *
 * Fetch automático de cotizaciones desde APIs públicas argentinas.
 * Fuentes: dolarapi.com (gratis, real-time), BCRA API, BNA.
 * Persiste en CotizacionAutomatica para histórico.
 */

import { prisma } from "@/lib/prisma"

const DOLAR_API_URL = "https://dolarapi.com/v1"

interface CotizacionAPI {
  compra: number
  venta: number
  moneda: string
  nombre: string
  fechaActualizacion: string
}

export async function fetchCotizacionesDiarias() {
  const resultados: { monedaPar: string; compra: number; venta: number; fuente: string }[] = []

  try {
    // 1. Dólar oficial
    const oficial = await fetchJSON<CotizacionAPI>(`${DOLAR_API_URL}/dolares/oficial`)
    if (oficial) {
      resultados.push({
        monedaPar: "USD_OFICIAL",
        compra: oficial.compra,
        venta: oficial.venta,
        fuente: "DOLARAPI",
      })
    }

    // 2. Dólar MEP
    const mep = await fetchJSON<CotizacionAPI>(`${DOLAR_API_URL}/dolares/bolsa`)
    if (mep) {
      resultados.push({
        monedaPar: "USD_MEP",
        compra: mep.compra,
        venta: mep.venta,
        fuente: "DOLARAPI",
      })
    }

    // 3. Dólar CCL
    const ccl = await fetchJSON<CotizacionAPI>(`${DOLAR_API_URL}/dolares/contadoconliqui`)
    if (ccl) {
      resultados.push({
        monedaPar: "USD_CCL",
        compra: ccl.compra,
        venta: ccl.venta,
        fuente: "DOLARAPI",
      })
    }

    // 4. Euro
    const euro = await fetchJSON<CotizacionAPI>(`${DOLAR_API_URL}/cotizaciones/eur`)
    if (euro) {
      resultados.push({
        monedaPar: "EUR",
        compra: euro.compra,
        venta: euro.venta,
        fuente: "DOLARAPI",
      })
    }

    // 5. Real brasileño
    const brl = await fetchJSON<CotizacionAPI>(`${DOLAR_API_URL}/cotizaciones/brl`)
    if (brl) {
      resultados.push({
        monedaPar: "BRL",
        compra: brl.compra,
        venta: brl.venta,
        fuente: "DOLARAPI",
      })
    }
  } catch (_err) {
    // Si falla la API, retornamos lo que pudimos obtener
  }

  return resultados
}

/**
 * Persiste las cotizaciones del día en la DB.
 * Diseñado para cron diario.
 */
export async function actualizarCotizaciones() {
  const cotizaciones = await fetchCotizacionesDiarias()
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const guardadas: string[] = []

  for (const cot of cotizaciones) {
    await prisma.cotizacionAutomatica.upsert({
      where: {
        monedaPar_fecha_fuente: {
          monedaPar: cot.monedaPar,
          fecha: hoy,
          fuente: cot.fuente,
        },
      },
      create: {
        monedaPar: cot.monedaPar,
        compra: cot.compra,
        venta: cot.venta,
        fuente: cot.fuente,
        fecha: hoy,
      },
      update: {
        compra: cot.compra,
        venta: cot.venta,
      },
    })
    guardadas.push(cot.monedaPar)

    // También actualizar Cotizacion maestro si existe el modelo
    try {
      const monedaCode = cot.monedaPar === "USD_OFICIAL" ? "USD" : cot.monedaPar === "EUR" ? "EUR" : null
      if (monedaCode) {
        const moneda = await prisma.moneda.findFirst({ where: { codigo: monedaCode } })
        if (moneda) {
          await prisma.cotizacion.create({
            data: {
              monedaId: moneda.id,
              fecha: hoy,
              valorCompra: cot.compra,
              valorVenta: cot.venta,
              fuente: cot.fuente,
            },
          })
        }
      }
    } catch {
      // Cotizacion ya existe para hoy
    }
  }

  return { actualizadas: guardadas }
}

export async function obtenerCotizacionActual(monedaPar: string) {
  return prisma.cotizacionAutomatica.findFirst({
    where: { monedaPar },
    orderBy: { fecha: "desc" },
  })
}

export async function historialCotizaciones(monedaPar: string, dias: number = 30) {
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)

  return prisma.cotizacionAutomatica.findMany({
    where: { monedaPar, fecha: { gte: desde } },
    orderBy: { fecha: "asc" },
  })
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
