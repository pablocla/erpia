import type { ReportMeasure } from "@/lib/reporting/semantic/types"

export type AggFn = ReportMeasure["fn"]

export function aggregateValue(values: number[], fn: AggFn): number {
  if (values.length === 0) return 0
  switch (fn) {
    case "sum":
      return values.reduce((a, b) => a + b, 0)
    case "count":
      return values.length
    case "avg":
      return values.reduce((a, b) => a + b, 0) / values.length
    case "min":
      return Math.min(...values)
    case "max":
      return Math.max(...values)
    default:
      return 0
  }
}

export function groupRows(
  rows: Record<string, unknown>[],
  dimensionKeys: string[],
  measures: { campo: string; fn: AggFn; etiqueta?: string }[],
): Record<string, unknown>[] {
  if (dimensionKeys.length === 0) {
    const out: Record<string, unknown> = {}
    for (const m of measures) {
      const key = m.etiqueta ?? `${m.fn}_${m.campo}`
      const vals = rows.map((r) => Number(r[m.campo] ?? 0)).filter((n) => !Number.isNaN(n))
      out[key] = m.fn === "count" && m.campo === "cantidad"
        ? rows.length
        : aggregateValue(vals, m.fn)
    }
    return [out]
  }

  const groups = new Map<string, Record<string, unknown>[]>()
  for (const row of rows) {
    const key = dimensionKeys.map((k) => String(row[k] ?? "")).join("|||")
    const bucket = groups.get(key) ?? []
    bucket.push(row)
    groups.set(key, bucket)
  }

  const result: Record<string, unknown>[] = []
  for (const [, bucket] of groups) {
    const out: Record<string, unknown> = {}
    for (const dim of dimensionKeys) {
      out[dim] = bucket[0][dim]
    }
    for (const m of measures) {
      const key = m.etiqueta ?? `${m.fn}_${m.campo}`
      const vals = bucket.map((r) => Number(r[m.campo] ?? 0)).filter((n) => !Number.isNaN(n))
      out[key] = m.fn === "count" && m.campo === "cantidad"
        ? bucket.length
        : aggregateValue(vals, m.fn)
    }
    result.push(out)
  }
  return result
}