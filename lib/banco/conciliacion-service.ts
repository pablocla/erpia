/**
 * Conciliación Bancaria Service
 *
 * Provides automatic and manual bank reconciliation:
 * 1. Import bank statement (CSV/OFX parsing)
 * 2. Auto-match statement lines against internal movements
 * 3. Manual matching for unmatched items
 * 4. Reconciliation report (matched, pending, discrepancies)
 */

import { prisma } from "@/lib/prisma"

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface ExtractoLinea {
  fecha: string
  descripcion: string
  referencia?: string
  importe: number // positive = credit, negative = debit
}

export interface MatchResult {
  movimientoId: number
  extractoIdx: number
  confianza: number // 0-100
  motivo: string
}

export interface ReconciliacionReport {
  cuentaBancariaId: number
  periodo: string
  conciliados: { movimientoId: number; extractoLinea: ExtractoLinea }[]
  pendientesInterno: { id: number; fecha: Date; descripcion: string; importe: number }[]
  pendientesExtracto: ExtractoLinea[]
  saldoLibro: number
  saldoExtracto: number
  diferencia: number
}

// ─── SERVICE ──────────────────────────────────────────────────────────────────

export class ConciliacionService {
  /**
   * Parse CSV bank statement into structured lines.
   * Expects columns: fecha;descripcion;referencia;debito;credito
   * Semicolon-separated (common in Argentine bank exports).
   */
  parseCSV(csv: string): ExtractoLinea[] {
    const lines = csv.trim().split("\n")
    if (lines.length < 2) return []

    // Skip header row
    return lines.slice(1).map((line) => {
      const cols = line.split(";").map((c) => c.trim().replace(/^"|"$/g, ""))
      const debito = parseFloat(cols[3]?.replace(",", ".") || "0") || 0
      const credito = parseFloat(cols[4]?.replace(",", ".") || "0") || 0

      return {
        fecha: cols[0] || "",
        descripcion: cols[1] || "",
        referencia: cols[2] || undefined,
        importe: credito - debito,
      }
    }).filter((l) => l.importe !== 0 || l.descripcion)
  }

  /**
   * Auto-match extracto lines with internal pending movements.
   * Matching criteria (scored by confidence):
   * - Exact amount match (+40)
   * - Same date (+30) or ±1 day (+15)
   * - Reference/description similarity (+30)
   */
  autoMatch(
    pendientes: { id: number; fecha: Date; descripcion: string; importe: number; referencia?: string | null }[],
    extracto: ExtractoLinea[],
  ): MatchResult[] {
    const matches: MatchResult[] = []
    const usedMov = new Set<number>()
    const usedExt = new Set<number>()

    for (let ei = 0; ei < extracto.length; ei++) {
      if (usedExt.has(ei)) continue
      const ext = extracto[ei]!
      let bestMatch: MatchResult | null = null

      for (const mov of pendientes) {
        if (usedMov.has(mov.id)) continue

        let confianza = 0
        const motivos: string[] = []

        // Amount match (most important)
        const importeInterno = mov.importe
        if (Math.abs(importeInterno - ext.importe) < 0.01) {
          confianza += 40
          motivos.push("importe exacto")
        } else if (Math.abs(importeInterno - ext.importe) < 1) {
          confianza += 20
          motivos.push("importe aproximado")
        } else {
          continue // Skip if amounts don't match at all
        }

        // Date match
        const fechaMov = new Date(mov.fecha)
        const fechaExt = new Date(ext.fecha)
        const diffDias = Math.abs(
          Math.floor((fechaMov.getTime() - fechaExt.getTime()) / 86400000),
        )
        if (diffDias === 0) {
          confianza += 30
          motivos.push("misma fecha")
        } else if (diffDias <= 1) {
          confianza += 15
          motivos.push("fecha ±1 día")
        } else if (diffDias <= 3) {
          confianza += 5
          motivos.push("fecha ±3 días")
        }

        // Reference match
        if (ext.referencia && mov.referencia) {
          if (ext.referencia.includes(mov.referencia) || mov.referencia.includes(ext.referencia)) {
            confianza += 30
            motivos.push("referencia coincide")
          }
        }

        // Description similarity  
        const descExt = ext.descripcion.toLowerCase()
        const descMov = mov.descripcion.toLowerCase()
        if (descExt.includes(descMov) || descMov.includes(descExt)) {
          confianza += 15
          motivos.push("descripción similar")
        }

        if (confianza >= 40 && (!bestMatch || confianza > bestMatch.confianza)) {
          bestMatch = {
            movimientoId: mov.id,
            extractoIdx: ei,
            confianza,
            motivo: motivos.join(", "),
          }
        }
      }

      if (bestMatch) {
        matches.push(bestMatch)
        usedMov.add(bestMatch.movimientoId)
        usedExt.add(ei)
      }
    }

    return matches.sort((a, b) => b.confianza - a.confianza)
  }

  /**
   * Execute full reconciliation: parse statement, auto-match, generate report.
   */
  async reconciliar(
    cuentaBancariaId: number,
    empresaId: number,
    csvExtracto: string,
    mesAnio?: string, // "MM/YYYY"
  ): Promise<ReconciliacionReport> {
    // Parse extracto
    const extracto = this.parseCSV(csvExtracto)

    // Get pending internal movements
    const where: Record<string, unknown> = {
      cuentaBancariaId,
      estado: "pendiente",
      cuentaBancaria: { empresaId },
    }

    if (mesAnio) {
      const [mes, anio] = mesAnio.split("/").map(Number)
      if (mes && anio) {
        const desde = new Date(anio!, mes! - 1, 1)
        const hasta = new Date(anio!, mes!, 0, 23, 59, 59)
        where.fecha = { gte: desde, lte: hasta }
      }
    }

    const movimientos = await prisma.movimientoBancario.findMany({
      where,
      orderBy: { fecha: "asc" },
    })

    const pendientesNorm = movimientos.map((m) => ({
      id: m.id,
      fecha: m.fecha,
      descripcion: m.descripcion,
      importe: m.tipo === "credito" ? Number(m.importe) : -Number(m.importe),
      referencia: m.referencia,
    }))

    // Auto-match
    const matches = this.autoMatch(pendientesNorm, extracto)

    // Apply confident matches (>=70) automatically
    const matchedMovIds = new Set<number>()
    const matchedExtIdx = new Set<number>()
    const conciliados: ReconciliacionReport["conciliados"] = []

    for (const match of matches) {
      if (match.confianza >= 70) {
        matchedMovIds.add(match.movimientoId)
        matchedExtIdx.add(match.extractoIdx)
        conciliados.push({
          movimientoId: match.movimientoId,
          extractoLinea: extracto[match.extractoIdx]!,
        })
      }
    }

    // Mark matched as conciliado
    if (matchedMovIds.size > 0) {
      await prisma.movimientoBancario.updateMany({
        where: { id: { in: Array.from(matchedMovIds) } },
        data: { estado: "conciliado" },
      })
    }

    // Remaining unmatched items
    const pendientesInterno = pendientesNorm
      .filter((m) => !matchedMovIds.has(m.id))
      .map((m) => ({ id: m.id, fecha: m.fecha, descripcion: m.descripcion, importe: m.importe }))

    const pendientesExtracto = extracto.filter((_, i) => !matchedExtIdx.has(i))

    // Calculate balances
    const saldoLibro = pendientesNorm.reduce((s, m) => s + m.importe, 0)
    const saldoExtracto = extracto.reduce((s, e) => s + e.importe, 0)

    return {
      cuentaBancariaId,
      periodo: mesAnio ?? new Date().toLocaleDateString("es-AR", { month: "2-digit", year: "numeric" }),
      conciliados,
      pendientesInterno,
      pendientesExtracto,
      saldoLibro: Math.round(saldoLibro * 100) / 100,
      saldoExtracto: Math.round(saldoExtracto * 100) / 100,
      diferencia: Math.round((saldoExtracto - saldoLibro) * 100) / 100,
    }
  }

  /**
   * Manual match: link specific movements to extracto items.
   */
  async conciliarManual(
    ids: number[],
    empresaId: number,
  ): Promise<number> {
    const result = await prisma.movimientoBancario.updateMany({
      where: {
        id: { in: ids },
        estado: "pendiente",
        cuentaBancaria: { empresaId },
      },
      data: { estado: "conciliado" },
    })

    return result.count
  }

  /**
   * Get reconciliation summary for a bank account.
   */
  async getResumen(cuentaBancariaId: number, empresaId: number) {
    const [pendientes, conciliados, totalCreditos, totalDebitos] = await Promise.all([
      prisma.movimientoBancario.count({
        where: { cuentaBancariaId, estado: "pendiente", cuentaBancaria: { empresaId } },
      }),
      prisma.movimientoBancario.count({
        where: { cuentaBancariaId, estado: "conciliado", cuentaBancaria: { empresaId } },
      }),
      prisma.movimientoBancario.aggregate({
        where: { cuentaBancariaId, tipo: "credito", cuentaBancaria: { empresaId } },
        _sum: { importe: true },
      }),
      prisma.movimientoBancario.aggregate({
        where: { cuentaBancariaId, tipo: "debito", cuentaBancaria: { empresaId } },
        _sum: { importe: true },
      }),
    ])

    return {
      pendientes,
      conciliados,
      totalCreditos: Number(totalCreditos._sum.importe ?? 0),
      totalDebitos: Number(totalDebitos._sum.importe ?? 0),
      saldo: Number(totalCreditos._sum.importe ?? 0) - Number(totalDebitos._sum.importe ?? 0),
    }
  }
}

export const conciliacionService = new ConciliacionService()
