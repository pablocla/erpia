import { describe, it, expect } from "vitest"
import {
  resolveOlapQuery,
  shouldUseOlapTimeSeries,
  timeSeriesToChartRows,
} from "@/lib/analytics/olap-engine"
import type { ReportDefinition } from "@/lib/reporting/semantic/types"

describe("olap-engine", () => {
  const timeChartDef: ReportDefinition = {
    connectorId: "claverp",
    fuente: "ventas",
    vista: "grafico",
    dimensiones: [{ campo: "mes", agruparPor: "mes" }],
    medidas: [{ campo: "total", fn: "sum", etiqueta: "sum_total" }],
    filtros: [
      { campo: "desde", op: "gte", valor: "2026-01-01" },
      { campo: "hasta", op: "lte", valor: "2026-03-31" },
    ],
    chart: { tipo: "line", ejeX: "mes", series: ["sum_total"] },
  }

  it("detects time-series chart candidates", () => {
    expect(shouldUseOlapTimeSeries(timeChartDef)).toBe(true)
    expect(shouldUseOlapTimeSeries({ ...timeChartDef, vista: "plano" })).toBe(false)
    expect(shouldUseOlapTimeSeries({ ...timeChartDef, fuente: "stock" })).toBe(false)
  })

  it("resolves OLAP query with month granularity", () => {
    const q = resolveOlapQuery(timeChartDef, 42)
    expect(q).toMatchObject({
      empresaId: 42,
      fuente: "ventas",
      measure: "total",
      granularity: "month",
    })
    expect(q?.desde).toBeInstanceOf(Date)
    expect(q?.hasta).toBeInstanceOf(Date)
  })

  it("resolves day granularity when ejeX is fecha", () => {
    const def: ReportDefinition = {
      ...timeChartDef,
      dimensiones: [{ campo: "fecha", agruparPor: "dia" }],
      chart: { tipo: "line", ejeX: "fecha", series: ["sum_total"] },
    }
    const q = resolveOlapQuery(def, 1)
    expect(q?.granularity).toBe("day")
  })

  it("converts time series points to chart rows", () => {
    const rows = timeSeriesToChartRows(
      [
        { bucket: "2026-01", value: 1000, count: 5 },
        { bucket: "2026-02", value: 0, count: 0 },
      ],
      "mes",
      "sum_total",
    )
    expect(rows).toEqual([
      { mes: "2026-01", sum_total: 1000, cantidad: 5 },
      { mes: "2026-02", sum_total: 0, cantidad: 0 },
    ])
  })

  it("maps fecha eje to fecha key", () => {
    const rows = timeSeriesToChartRows(
      [{ bucket: "2026-03-15", value: 500, count: 2 }],
      "fecha",
      "sum_total",
    )
    expect(rows[0]).toMatchObject({ fecha: "2026-03-15", sum_total: 500 })
  })
})