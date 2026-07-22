/**
 * Catálogo de índices económicos (IPC / UVA).
 * Seed manual + API; en prod se puede alimentar con job mensual.
 */

import type { IndiceCodigo, IndicePeriodo } from "./types"

/** Seed ilustrativo — reemplazar/actualizar vía API o job INDEC */
const SEED: IndicePeriodo[] = [
  { codigo: "IPC_NACIONAL", periodo: "2025-01", valor: 100.0, fuente: "seed" },
  { codigo: "IPC_NACIONAL", periodo: "2025-02", valor: 102.2, fuente: "seed" },
  { codigo: "IPC_NACIONAL", periodo: "2025-03", valor: 104.5, fuente: "seed" },
  { codigo: "IPC_NACIONAL", periodo: "2025-04", valor: 107.0, fuente: "seed" },
  { codigo: "IPC_NACIONAL", periodo: "2025-05", valor: 109.2, fuente: "seed" },
  { codigo: "IPC_NACIONAL", periodo: "2025-06", valor: 111.0, fuente: "seed" },
  { codigo: "IPC_NACIONAL", periodo: "2025-07", valor: 112.8, fuente: "seed" },
  { codigo: "IPC_NACIONAL", periodo: "2025-08", valor: 114.5, fuente: "seed" },
  { codigo: "IPC_NACIONAL", periodo: "2025-09", valor: 116.0, fuente: "seed" },
  { codigo: "IPC_NACIONAL", periodo: "2025-10", valor: 117.5, fuente: "seed" },
  { codigo: "IPC_NACIONAL", periodo: "2025-11", valor: 119.0, fuente: "seed" },
  { codigo: "IPC_NACIONAL", periodo: "2025-12", valor: 120.5, fuente: "seed" },
  { codigo: "IPC_NACIONAL", periodo: "2026-01", valor: 122.0, fuente: "seed" },
  { codigo: "IPC_NACIONAL", periodo: "2026-02", valor: 123.5, fuente: "seed" },
  { codigo: "IPC_NACIONAL", periodo: "2026-03", valor: 125.0, fuente: "seed" },
  { codigo: "IPC_NACIONAL", periodo: "2026-04", valor: 126.4, fuente: "seed" },
  { codigo: "IPC_NACIONAL", periodo: "2026-05", valor: 127.8, fuente: "seed" },
  { codigo: "IPC_NACIONAL", periodo: "2026-06", valor: 129.0, fuente: "seed" },
  { codigo: "IPC_NACIONAL", periodo: "2026-07", valor: 130.2, fuente: "seed" },
  // UVA seed (escala distinta; solo para factor relativo mismo código)
  { codigo: "UVA", periodo: "2025-12", valor: 1000, fuente: "seed" },
  { codigo: "UVA", periodo: "2026-01", valor: 1015, fuente: "seed" },
  { codigo: "UVA", periodo: "2026-02", valor: 1030, fuente: "seed" },
  { codigo: "UVA", periodo: "2026-03", valor: 1045, fuente: "seed" },
  { codigo: "UVA", periodo: "2026-04", valor: 1060, fuente: "seed" },
  { codigo: "UVA", periodo: "2026-05", valor: 1075, fuente: "seed" },
  { codigo: "UVA", periodo: "2026-06", valor: 1090, fuente: "seed" },
  { codigo: "UVA", periodo: "2026-07", valor: 1105, fuente: "seed" },
]

/** Runtime overlay (API/job puede mutar en proceso) */
const overlay: IndicePeriodo[] = []

export function periodoFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

export function parsePeriodo(periodo: string): { year: number; month: number } {
  const [y, m] = periodo.split("-").map(Number)
  return { year: y, month: m }
}

export function upsertIndicePeriodo(p: IndicePeriodo): void {
  const i = overlay.findIndex((x) => x.codigo === p.codigo && x.periodo === p.periodo)
  if (i >= 0) overlay[i] = p
  else overlay.push(p)
}

export function listIndices(codigo?: IndiceCodigo): IndicePeriodo[] {
  const all = [...SEED, ...overlay]
  const byKey = new Map<string, IndicePeriodo>()
  for (const row of all) {
    byKey.set(`${row.codigo}:${row.periodo}`, row)
  }
  let rows = [...byKey.values()]
  if (codigo) rows = rows.filter((r) => r.codigo === codigo)
  return rows.sort((a, b) => a.periodo.localeCompare(b.periodo))
}

/**
 * Último índice disponible en o antes de `periodo`.
 */
export function getIndiceAtOrBefore(
  codigo: IndiceCodigo,
  periodo: string,
): IndicePeriodo | null {
  const rows = listIndices(codigo).filter((r) => r.periodo <= periodo)
  if (!rows.length) return null
  return rows[rows.length - 1]
}

/**
 * Índice efectivo a una fecha (usa período YYYY-MM de esa fecha).
 * Si es día < diaPublicacion del mes, usa mes anterior como “último oficial”.
 */
export function getIndiceEfectivo(
  codigo: IndiceCodigo,
  fecha: Date,
  diaPublicacion = 15,
): { periodo: IndicePeriodo; estimado: boolean } | null {
  let p = periodoFromDate(fecha)
  if (fecha.getDate() < diaPublicacion) {
    // Usar mes anterior como publicado
    const d = new Date(fecha.getFullYear(), fecha.getMonth() - 1, 1)
    p = periodoFromDate(d)
  }
  const row = getIndiceAtOrBefore(codigo, p)
  if (!row) return null
  return {
    periodo: row,
    estimado: row.periodo !== p || row.fuente === "seed",
  }
}
