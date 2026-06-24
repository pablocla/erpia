import { aggregateValue, type AggFn } from "@/lib/reporting/engine/aggregators"

export interface PivotInput {
  rows: Record<string, unknown>[]
  filas: string[]
  columnas: string[]
  medida: string
  fn: AggFn
}

export interface PivotOutput {
  filas: string[]
  columnas: string[]
  celdas: Record<string, Record<string, number>>
  totalesFila: Record<string, number>
  totalesColumna: Record<string, number>
  granTotal: number
}

function rowKey(row: Record<string, unknown>, keys: string[]): string {
  return keys.map((k) => String(row[k] ?? "(vacío)")).join(" » ")
}

export function buildPivot(input: PivotInput): PivotOutput {
  const { rows, filas, columnas, medida, fn } = input
  const celdas: Record<string, Record<string, number>> = {}
  const filaSet = new Set<string>()
  const colSet = new Set<string>()
  const buckets = new Map<string, number[]>()

  for (const row of rows) {
    const fKey = filas.length ? rowKey(row, filas) : "Total"
    const cKey = columnas.length ? rowKey(row, columnas) : "Valor"
    filaSet.add(fKey)
    colSet.add(cKey)
    const bucketKey = `${fKey}|||${cKey}`
    const vals = buckets.get(bucketKey) ?? []
    vals.push(Number(row[medida] ?? 0))
    buckets.set(bucketKey, vals)
  }

  const filaList = [...filaSet].sort()
  const colList = [...colSet].sort()
  const totalesFila: Record<string, number> = {}
  const totalesColumna: Record<string, number> = {}
  let granTotal = 0

  for (const f of filaList) {
    celdas[f] = {}
    for (const c of colList) {
      const vals = buckets.get(`${f}|||${c}`) ?? []
      const v = aggregateValue(vals, fn)
      celdas[f][c] = v
      totalesFila[f] = (totalesFila[f] ?? 0) + v
      totalesColumna[c] = (totalesColumna[c] ?? 0) + v
      granTotal += v
    }
  }

  return {
    filas: filaList,
    columnas: colList,
    celdas,
    totalesFila,
    totalesColumna,
    granTotal,
  }
}