/**
 * IIBB Service — Ingresos Brutos Provinciales
 *
 * Manages monthly IIBB accrual and the generation of DJ (Declaración Jurada)
 * for each jurisdiction where the company operates.
 *
 * How IIBB works:
 *   1. On each sale, the IIBB devengado is calculated by the AR tax adapter.
 *   2. `acumularPorFactura()` is called to accumulate the IIBB into PeriodoIIBB.
 *   3. Any IIBB perceived from buyers reduces the saldo a pagar.
 *   4. At month-end, `cerrarPeriodo()` locks the period.
 *   5. `generarDDJJ()` produces the DDJJ text file for each jurisdiction.
 *
 * Jurisdictions:
 *   PBA  — Buenos Aires Province (ARBA,   3.5% general commerce)
 *   CABA — Ciudad Autónoma BA   (ARCIBA, 3.0% general commerce)
 *   SF   — Santa Fe             (DGR SF, 3.5%)
 *   CBA  — Córdoba              (DGR CBA, 3.0%)
 *   MZA  — Mendoza              (DGR MZA, 3.0%)
 */

import { prisma } from "@/lib/prisma"
import type { TaxBreakdown } from "@/lib/tes/types"

// ─── MAPPING HELPERS ─────────────────────────────────────────────────────────

const ORGANISMO_POR_JURISDICCION: Record<string, string> = {
  PBA:  "ARBA",
  CABA: "ARCIBA",
  SF:   "DGR_SF",
  CBA:  "DGR_CBA",
  MZA:  "DGR_MZA",
}

// ─── SERVICE ──────────────────────────────────────────────────────────────────

export class IIBBService {

  /**
   * Accumulates IIBB devengado from a TaxBreakdown into the monthly period.
   * Called after a sale or NC emission when the tax engine was used.
   *
   * @param breakdown - result from calcularImpuestos()
   * @param esDevolucion - true for NC (reverses the accrual)
   */
  async acumularPorFactura(breakdown: TaxBreakdown, esDevolucion = false): Promise<void> {
    const iibbItems = breakdown.iibb
    if (!iibbItems.length) return

    const ahora = new Date()
    const mes  = ahora.getMonth() + 1
    const anio = ahora.getFullYear()

    for (const item of iibbItems) {
      const jur        = item.jurisdiccion ?? "PBA"
      const organismo  = ORGANISMO_POR_JURISDICCION[jur] ?? "ARBA"
      const montoItem  = esDevolucion ? -item.monto : item.monto
      const baseItem   = esDevolucion ? -item.base  : item.base

      const existing = await prisma.periodoIIBB.findUnique({
        where: { mes_anio_jurisdiccion: { mes, anio, jurisdiccion: jur } },
      })

      if (existing) {
        const nuevoBase      = existing.baseImponible  + baseItem
        const nuevoDeveng    = existing.montoDevengado + montoItem
        const nuevoSaldo     = nuevoDeveng - existing.montoPercibido
        await prisma.periodoIIBB.update({
          where: { id: existing.id },
          data: {
            baseImponible:  nuevoBase,
            montoDevengado: nuevoDeveng,
            saldo:          nuevoSaldo,
            updatedAt:      new Date(),
          },
        })
      } else {
        await prisma.periodoIIBB.create({
          data: {
            mes,
            anio,
            jurisdiccion:  jur,
            organismo,
            baseImponible: baseItem,
            alicuota:      item.alicuota,
            montoDevengado: montoItem,
            montoPercibido: 0,
            saldo:          montoItem,
          },
        })
      }
    }
  }

  /**
   * Adds a perception received from a supplier to the period
   * (reduces the saldo a pagar for IIBB Compras).
   */
  async acumularPercepcionRecibida(monto: number, jurisdiccion: string, mes?: number, anio?: number): Promise<void> {
    const ahora  = new Date()
    const m = mes  ?? ahora.getMonth() + 1
    const a = anio ?? ahora.getFullYear()
    const organismo = ORGANISMO_POR_JURISDICCION[jurisdiccion] ?? "ARBA"

    const existing = await prisma.periodoIIBB.findUnique({
      where: { mes_anio_jurisdiccion: { mes: m, anio: a, jurisdiccion } },
    })

    if (existing) {
      const nuevoPercibido = existing.montoPercibido + monto
      const nuevoSaldo     = existing.montoDevengado - nuevoPercibido
      await prisma.periodoIIBB.update({
        where: { id: existing.id },
        data: { montoPercibido: nuevoPercibido, saldo: nuevoSaldo, updatedAt: new Date() },
      })
    } else {
      // Period doesn't exist yet — create with just the percepcion recibida
      await prisma.periodoIIBB.create({
        data: {
          mes:            m,
          anio:           a,
          jurisdiccion,
          organismo,
          baseImponible:  0,
          alicuota:       0,
          montoDevengado: 0,
          montoPercibido: monto,
          saldo:          -monto,
        },
      })
    }
  }

  /**
   * Returns the IIBB liquidation for a given period.
   * If jurisdiccion is provided, returns only that jurisdiction.
   */
  async getLiquidacion(mes: number, anio: number, jurisdiccion?: string) {
    const where: any = { mes, anio }
    if (jurisdiccion) where.jurisdiccion = jurisdiccion

    const periodos = await prisma.periodoIIBB.findMany({
      where,
      orderBy: [{ jurisdiccion: "asc" }],
    })

    const totalDevengado  = periodos.reduce((s, p) => s + p.montoDevengado,  0)
    const totalPercibido  = periodos.reduce((s, p) => s + p.montoPercibido,  0)
    const totalSaldo      = periodos.reduce((s, p) => s + p.saldo,           0)

    return {
      periodo: `${String(mes).padStart(2, "0")}/${anio}`,
      periodos,
      resumen: { totalDevengado, totalPercibido, totalSaldo },
    }
  }

  /**
   * Returns IIBB evolution across 12 months for a given year and jurisdiction.
   */
  async getEvolucionAnual(anio: number, jurisdiccion?: string) {
    const where: any = { anio }
    if (jurisdiccion) where.jurisdiccion = jurisdiccion

    return prisma.periodoIIBB.findMany({
      where,
      orderBy: [{ mes: "asc" }],
    })
  }

  /**
   * Locks a period (prevents further accumulation).
   * Should be called after the DDJJ is submitted.
   */
  async cerrarPeriodo(mes: number, anio: number, jurisdiccion: string): Promise<void> {
    await prisma.periodoIIBB.updateMany({
      where: { mes, anio, jurisdiccion, estado: "abierto" },
      data: { estado: "cerrado", updatedAt: new Date() },
    })
  }

  /**
   * Marks a period as submitted to the tax authority.
   */
  async marcarPresentado(mes: number, anio: number, jurisdiccion: string): Promise<void> {
    await prisma.periodoIIBB.updateMany({
      where: { mes, anio, jurisdiccion },
      data: { estado: "presentado", updatedAt: new Date() },
    })
  }

  /**
   * Generates a DDJJ text summary for all jurisdictions in a given period.
   * Each jurisdiction generates a section.
   */
  async generarDDJJ(mes: number, anio: number): Promise<string> {
    const { periodos, resumen } = await this.getLiquidacion(mes, anio)

    if (!periodos.length) {
      return `IIBB — DJ ${String(mes).padStart(2, "0")}/${anio}\nSin movimientos en el período.`
    }

    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

    const lines: string[] = [
      "═══════════════════════════════════════════════════════════",
      `  DECLARACIÓN JURADA — INGRESOS BRUTOS`,
      `  Período: ${meses[mes - 1]} ${anio}`,
      "═══════════════════════════════════════════════════════════",
      "",
    ]

    for (const p of periodos) {
      lines.push(`  Jurisdicción: ${p.jurisdiccion} (${p.organismo})`)
      lines.push(`  ─────────────────────────────────────────`)
      lines.push(`  Base imponible:     $ ${p.baseImponible.toFixed(2).padStart(14)}`)
      lines.push(`  Alícuota:           ${p.alicuota}%`)
      lines.push(`  IIBB devengado:     $ ${p.montoDevengado.toFixed(2).padStart(14)}`)
      lines.push(`  Percepciones s/f:   $ ${p.montoPercibido.toFixed(2).padStart(14)}`)
      lines.push(`  SALDO A PAGAR:      $ ${p.saldo.toFixed(2).padStart(14)}`)
      lines.push(`  Estado:             ${p.estado.toUpperCase()}`)
      lines.push("")
    }

    lines.push("═══════════════════════════════════════════════════════════")
    lines.push(`  TOTALES DEL PERÍODO`)
    lines.push(`  Total devengado:    $ ${resumen.totalDevengado.toFixed(2).padStart(14)}`)
    lines.push(`  Total percibido:    $ ${resumen.totalPercibido.toFixed(2).padStart(14)}`)
    lines.push(`  TOTAL SALDO:        $ ${resumen.totalSaldo.toFixed(2).padStart(14)}`)
    lines.push("═══════════════════════════════════════════════════════════")
    lines.push("")
    lines.push("Notas:")
    lines.push("  • Presentar ante ARBA (arba.gob.ar) / ARCIBA / DGR provincial.")
    lines.push("  • Para Convenio Multilateral: usar CM03 (art. 2) o CM05 (art. 13).")
    lines.push("  • Vencimiento: último día hábil del mes siguiente al período.")

    return lines.join("\n")
  }
}
