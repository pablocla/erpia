/**
 * Cotización Service — Exchange rate management & multi-currency conversion
 *
 * Provides CRUD for exchange rates, conversion functions, and optional BNA API fetch.
 */

import { prisma } from "@/lib/prisma"

export interface CotizacionInput {
  monedaId: number
  fecha: string
  tipo?: string
  valorArs: number
  fuente?: string
}

export class CotizacionService {
  /**
   * Register/update an exchange rate
   */
  async registrar(input: CotizacionInput) {
    return prisma.cotizacion.upsert({
      where: {
        monedaId_fecha_tipo: {
          monedaId: input.monedaId,
          fecha: new Date(input.fecha),
          tipo: input.tipo ?? "oficial",
        },
      },
      update: { valorArs: input.valorArs, fuente: input.fuente ?? null },
      create: {
        monedaId: input.monedaId,
        fecha: new Date(input.fecha),
        tipo: input.tipo ?? "oficial",
        valorArs: input.valorArs,
        fuente: input.fuente ?? "manual",
      },
    })
  }

  /**
   * Get the latest exchange rate for a currency + type
   * Falls back to most recent date available
   */
  async obtenerCotizacion(monedaId: number, tipo = "oficial", fecha?: Date): Promise<number | null> {
    const targetDate = fecha ?? new Date()

    // Try exact date first
    const exact = await prisma.cotizacion.findUnique({
      where: { monedaId_fecha_tipo: { monedaId, fecha: targetDate, tipo } },
    })
    if (exact) return Number(exact.valorArs)

    // Fallback to most recent before target date
    const recent = await prisma.cotizacion.findFirst({
      where: { monedaId, tipo, fecha: { lte: targetDate } },
      orderBy: { fecha: "desc" },
    })
    return recent ? Number(recent.valorArs) : null
  }

  /**
   * Convert amount from foreign currency to ARS
   */
  async convertirARS(monto: number, monedaId: number, tipo = "oficial", fecha?: Date): Promise<{ montoARS: number; cotizacion: number }> {
    // Check if currency is base (ARS)
    const moneda = await prisma.moneda.findUnique({ where: { id: monedaId } })
    if (!moneda) throw new Error("Moneda no encontrada")
    if (moneda.esBase) return { montoARS: monto, cotizacion: 1 }

    const cotizacion = await this.obtenerCotizacion(monedaId, tipo, fecha)
    if (!cotizacion) throw new Error(`Sin cotización para ${moneda.codigo} tipo ${tipo}`)

    return { montoARS: monto * cotizacion, cotizacion }
  }

  /**
   * Convert amount from ARS to foreign currency
   */
  async convertirDesdeARS(montoARS: number, monedaId: number, tipo = "oficial", fecha?: Date): Promise<{ montoExtranjero: number; cotizacion: number }> {
    const moneda = await prisma.moneda.findUnique({ where: { id: monedaId } })
    if (!moneda) throw new Error("Moneda no encontrada")
    if (moneda.esBase) return { montoExtranjero: montoARS, cotizacion: 1 }

    const cotizacion = await this.obtenerCotizacion(monedaId, tipo, fecha)
    if (!cotizacion || cotizacion === 0) throw new Error(`Sin cotización para ${moneda.codigo} tipo ${tipo}`)

    return { montoExtranjero: montoARS / cotizacion, cotizacion }
  }

  /**
   * List all rates for a currency
   */
  async listarPorMoneda(monedaId: number, limit = 30) {
    return prisma.cotizacion.findMany({
      where: { monedaId },
      orderBy: { fecha: "desc" },
      take: limit,
      include: { moneda: true },
    })
  }

  /**
   * List latest rates for all active currencies
   */
  async listarUltimas() {
    const monedas = await prisma.moneda.findMany({
      where: { activo: true, esBase: false },
      include: {
        cotizaciones: {
          orderBy: { fecha: "desc" },
          take: 5,
        },
      },
    })

    return monedas.map(m => ({
      monedaId: m.id,
      codigo: m.codigo,
      descripcion: m.descripcion,
      simbolo: m.simbolo,
      cotizaciones: m.cotizaciones.map(c => ({
        fecha: c.fecha,
        tipo: c.tipo,
        valorArs: Number(c.valorArs),
        fuente: c.fuente,
      })),
    }))
  }

  /**
   * List all registered monedas
   */
  async listarMonedas() {
    return prisma.moneda.findMany({
      where: { activo: true },
      orderBy: { codigo: "asc" },
    })
  }

  /**
   * Fetch rates from BNA public API (dolar oficial)
   * Returns the fetched rate or null if unavailable
   */
  async fetchDolarBNA(): Promise<{ compra: number; venta: number } | null> {
    try {
      const res = await fetch("https://api.bluelytics.com.ar/v2/latest", {
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) return null
      const data = await res.json()

      if (data?.oficial) {
        const usd = await prisma.moneda.findUnique({ where: { codigo: "USD" } })
        if (usd) {
          await this.registrar({
            monedaId: usd.id,
            fecha: new Date().toISOString().slice(0, 10),
            tipo: "oficial",
            valorArs: data.oficial.value_sell,
            fuente: "bluelytics",
          })

          // Also save blue rate
          await this.registrar({
            monedaId: usd.id,
            fecha: new Date().toISOString().slice(0, 10),
            tipo: "blue",
            valorArs: data.blue.value_sell,
            fuente: "bluelytics",
          })
        }

        return { compra: data.oficial.value_buy, venta: data.oficial.value_sell }
      }
      return null
    } catch {
      return null
    }
  }
}

export const cotizacionService = new CotizacionService()
