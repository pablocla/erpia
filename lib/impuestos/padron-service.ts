/**
 * Padrón Service — Gestión de padrones de percepciones/retenciones IIBB
 *
 * Funcionalidad:
 *   1. Importación masiva de padrones ARBA/ARCIBA/DGR en formato CSV
 *   2. Consulta de alícuota por CUIT → auto-aplicada al emitir factura
 *   3. CRUD de regímenes manuales
 *   4. Estadísticas y vigencias
 *
 * Formatos soportados:
 *   ARBA:   CUIT;FechaDesde;FechaHasta;Alícuota;TipoRegimen;...
 *   ARCIBA: CUIT|Alicuota|FechaDesde|FechaHasta|...
 *   DGR:    Genérico CSV por jurisdicción
 */

import { prisma } from "@/lib/prisma"

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface PadronCSVRow {
  cuit: string
  alicuota: number
  tipoRegimen: string
  vigenciaDesde: Date
  vigenciaHasta: Date | null
}

export interface ImportResult {
  total: number
  insertados: number
  actualizados: number
  errores: number
  detalleErrores: string[]
}

export type OrganismoSoportado = "ARBA" | "AGIP" | "DGR_SF" | "DGR_CBA" | "DGR_MZA"

const JURISDICCION_POR_ORGANISMO: Record<OrganismoSoportado, string> = {
  ARBA:    "PBA",
  AGIP:    "CABA",
  DGR_SF:  "SF",
  DGR_CBA: "CBA",
  DGR_MZA: "MZA",
}

// ─── SERVICE ──────────────────────────────────────────────────────────────────

export class PadronService {

  /**
   * Importar padrón masivo desde texto CSV.
   * Detecta formato por organismo. Upsert por cuit+organismo+tipoRegimen.
   */
  async importarCSV(
    csvText: string,
    organismo: OrganismoSoportado,
    tipoRegimen: string = "percepcion_iibb",
  ): Promise<ImportResult> {
    const jurisdiccion = JURISDICCION_POR_ORGANISMO[organismo]
    if (!jurisdiccion) throw new Error(`Organismo no soportado: ${organismo}`)

    const rows = this.parsearCSV(csvText, organismo)
    const result: ImportResult = {
      total: rows.length,
      insertados: 0,
      actualizados: 0,
      errores: 0,
      detalleErrores: [],
    }

    // Process in batches of 100 for performance
    const BATCH_SIZE = 100
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)

      for (const row of batch) {
        try {
          // Find or link to cliente by CUIT
          const cliente = await prisma.cliente.findFirst({
            where: { cuit: row.cuit },
          })

          if (!cliente) {
            // Create padron entry without client link (orphan — will link when client is created)
            // Skip for now, only link existing clients
            result.errores++
            result.detalleErrores.push(`CUIT ${row.cuit}: cliente no encontrado en DB`)
            continue
          }

          // Upsert: check if exists for this cuit+organismo+tipo
          const existing = await prisma.padronRegimenCliente.findFirst({
            where: {
              cuitSujeto: row.cuit,
              organismo,
              tipoRegimen: row.tipoRegimen || tipoRegimen,
              clienteId: cliente.id,
            },
          })

          if (existing) {
            await prisma.padronRegimenCliente.update({
              where: { id: existing.id },
              data: {
                alicuota: row.alicuota,
                vigenciaDesde: row.vigenciaDesde,
                vigenciaHasta: row.vigenciaHasta,
              },
            })
            result.actualizados++
          } else {
            await prisma.padronRegimenCliente.create({
              data: {
                cuitSujeto: row.cuit,
                organismo,
                jurisdiccion,
                tipoRegimen: row.tipoRegimen || tipoRegimen,
                alicuota: row.alicuota,
                vigenciaDesde: row.vigenciaDesde,
                vigenciaHasta: row.vigenciaHasta,
                clienteId: cliente.id,
              },
            })
            result.insertados++
          }
        } catch (err) {
          result.errores++
          const msg = err instanceof Error ? err.message : String(err)
          if (result.detalleErrores.length < 20) {
            result.detalleErrores.push(`CUIT ${row.cuit}: ${msg}`)
          }
        }
      }
    }

    return result
  }

  /**
   * Consultar alícuota vigente de un CUIT para un organismo.
   * Retorna la alícuota del padrón si está vigente, o null si no figura.
   * Esta función se llama al emitir facturas para aplicar percepciones IIBB.
   */
  async consultarAlicuota(
    cuit: string,
    organismo: OrganismoSoportado,
    tipo: string = "percepcion_iibb",
    fecha?: Date,
  ): Promise<{ alicuota: number; vigencia: { desde: Date; hasta: Date | null } } | null> {
    const hoy = fecha ?? new Date()

    const regimen = await prisma.padronRegimenCliente.findFirst({
      where: {
        cuitSujeto: cuit,
        organismo,
        tipoRegimen: tipo,
        vigenciaDesde: { lte: hoy },
        OR: [
          { vigenciaHasta: null },
          { vigenciaHasta: { gte: hoy } },
        ],
      },
      orderBy: { vigenciaDesde: "desc" },
    })

    if (!regimen) return null

    return {
      alicuota: Number(regimen.alicuota),
      vigencia: {
        desde: regimen.vigenciaDesde,
        hasta: regimen.vigenciaHasta,
      },
    }
  }

  /**
   * Consultar todos los regímenes activos de un CUIT.
   */
  async consultarTodos(cuit: string): Promise<Array<{
    organismo: string
    jurisdiccion: string
    tipoRegimen: string
    alicuota: number
    vigenciaDesde: Date
    vigenciaHasta: Date | null
  }>> {
    const hoy = new Date()
    const regimenes = await prisma.padronRegimenCliente.findMany({
      where: {
        cuitSujeto: cuit,
        vigenciaDesde: { lte: hoy },
        OR: [
          { vigenciaHasta: null },
          { vigenciaHasta: { gte: hoy } },
        ],
      },
    })

    return regimenes.map((r) => ({
      organismo: r.organismo,
      jurisdiccion: r.jurisdiccion,
      tipoRegimen: r.tipoRegimen,
      alicuota: Number(r.alicuota),
      vigenciaDesde: r.vigenciaDesde,
      vigenciaHasta: r.vigenciaHasta,
    }))
  }

  /**
   * Listar padrones con paginación y filtros.
   */
  async listar(filtros: {
    organismo?: string
    jurisdiccion?: string
    tipoRegimen?: string
    soloVigentes?: boolean
    skip?: number
    take?: number
  } = {}) {
    const where: Record<string, unknown> = {}
    if (filtros.organismo) where.organismo = filtros.organismo
    if (filtros.jurisdiccion) where.jurisdiccion = filtros.jurisdiccion
    if (filtros.tipoRegimen) where.tipoRegimen = filtros.tipoRegimen
    if (filtros.soloVigentes) {
      const hoy = new Date()
      where.vigenciaDesde = { lte: hoy }
      where.OR = [
        { vigenciaHasta: null },
        { vigenciaHasta: { gte: hoy } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.padronRegimenCliente.findMany({
        where,
        include: { cliente: { select: { id: true, nombre: true, cuit: true } } },
        orderBy: { vigenciaDesde: "desc" },
        skip: filtros.skip ?? 0,
        take: filtros.take ?? 50,
      }),
      prisma.padronRegimenCliente.count({ where }),
    ])

    return { data, total }
  }

  /**
   * Estadísticas del padrón.
   */
  async estadisticas() {
    const hoy = new Date()
    const [total, vigentes, porOrganismo] = await Promise.all([
      prisma.padronRegimenCliente.count(),
      prisma.padronRegimenCliente.count({
        where: {
          vigenciaDesde: { lte: hoy },
          OR: [
            { vigenciaHasta: null },
            { vigenciaHasta: { gte: hoy } },
          ],
        },
      }),
      prisma.padronRegimenCliente.groupBy({
        by: ["organismo"],
        _count: true,
        _avg: { alicuota: true },
      }),
    ])

    return {
      total,
      vigentes,
      vencidos: total - vigentes,
      porOrganismo: porOrganismo.map((g) => ({
        organismo: g.organismo,
        cantidad: g._count,
        alicuotaPromedio: Number(g._avg.alicuota ?? 0),
      })),
    }
  }

  // ─── CSV PARSERS ────────────────────────────────────────────────────────────

  private parsearCSV(csvText: string, organismo: OrganismoSoportado): PadronCSVRow[] {
    const lines = csvText.trim().split("\n").filter(Boolean)
    if (lines.length === 0) return []

    // Skip header if first line contains letters (non-CUIT pattern)
    const startIndex = /^\d{2}-?\d{8}-?\d$/.test(lines[0].split(/[;|,]/)[0].trim()) ? 0 : 1

    const rows: PadronCSVRow[] = []

    for (let i = startIndex; i < lines.length; i++) {
      try {
        const row = this.parsearLinea(lines[i], organismo)
        if (row) rows.push(row)
      } catch {
        // Skip malformed lines
      }
    }

    return rows
  }

  private parsearLinea(line: string, organismo: OrganismoSoportado): PadronCSVRow | null {
    switch (organismo) {
      case "ARBA": {
        // ARBA format: CUIT;FechaDesde;FechaHasta;Alícuota;TipoContribuyente;MarcaAlta
        const parts = line.split(";")
        if (parts.length < 4) return null
        const cuit = this.normalizarCUIT(parts[0].trim())
        if (!cuit) return null
        return {
          cuit,
          vigenciaDesde: this.parsearFechaCSV(parts[1].trim()),
          vigenciaHasta: parts[2].trim() ? this.parsearFechaCSV(parts[2].trim()) : null,
          alicuota: parseFloat(parts[3].trim().replace(",", ".")),
          tipoRegimen: "percepcion_iibb",
        }
      }
      case "AGIP": {
        // AGIP/ARCIBA format: CUIT|Alicuota|FechaDesde|FechaHasta|TipoRegimen
        const parts = line.split("|")
        if (parts.length < 3) return null
        const cuit = this.normalizarCUIT(parts[0].trim())
        if (!cuit) return null
        return {
          cuit,
          alicuota: parseFloat(parts[1].trim().replace(",", ".")),
          vigenciaDesde: this.parsearFechaCSV(parts[2].trim()),
          vigenciaHasta: parts[3]?.trim() ? this.parsearFechaCSV(parts[3].trim()) : null,
          tipoRegimen: parts[4]?.trim() || "percepcion_iibb",
        }
      }
      default: {
        // Generic CSV: CUIT,Alicuota,FechaDesde,FechaHasta
        const parts = line.split(",")
        if (parts.length < 3) return null
        const cuit = this.normalizarCUIT(parts[0].trim())
        if (!cuit) return null
        return {
          cuit,
          alicuota: parseFloat(parts[1].trim().replace(",", ".")),
          vigenciaDesde: this.parsearFechaCSV(parts[2].trim()),
          vigenciaHasta: parts[3]?.trim() ? this.parsearFechaCSV(parts[3].trim()) : null,
          tipoRegimen: "percepcion_iibb",
        }
      }
    }
  }

  private normalizarCUIT(raw: string): string | null {
    const digits = raw.replace(/\D/g, "")
    if (digits.length !== 11) return null
    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
  }

  private parsearFechaCSV(raw: string): Date {
    // Soporta: dd/mm/yyyy, yyyy-mm-dd, ddmmyyyy, yyyymmdd
    if (raw.includes("/")) {
      const [d, m, y] = raw.split("/")
      return new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
    }
    if (raw.includes("-")) {
      return new Date(raw)
    }
    if (raw.length === 8) {
      // Try yyyymmdd first
      const y = raw.slice(0, 4)
      const m = raw.slice(4, 6)
      const d = raw.slice(6, 8)
      return new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
    }
    return new Date(raw)
  }
}

export const padronService = new PadronService()
