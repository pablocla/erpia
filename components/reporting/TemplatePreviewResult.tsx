"use client"

import { ReportChartPanel } from "@/components/reporting/ReportChartPanel"
import { ReportPivotGrid } from "@/components/reporting/ReportPivotGrid"
import { ReportPlanoTable } from "@/components/reporting/ReportPlanoTable"
import type { QueryResult } from "@/lib/reporting/semantic/types"

const MAX_PLANO_ROWS = 10
const MAX_PIVOT_ROWS = 8
const MAX_PIVOT_COLS = 6

export function TemplatePreviewResult({
  result,
  vista,
}: {
  result: QueryResult
  vista: string
}) {
  if (result.totalFilas === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">
        Sin datos para el período actual. Probá ajustar filtros en el explorador.
      </p>
    )
  }

  if (vista === "pivot" && result.pivot) {
    const filas = result.pivot.filas.slice(0, MAX_PIVOT_ROWS)
    const columnas = result.pivot.columnas.slice(0, MAX_PIVOT_COLS)
    const celdas: typeof result.pivot.celdas = {}
    const totalesFila: Record<string, number> = {}
    for (const f of filas) {
      celdas[f] = {}
      for (const c of columnas) {
        celdas[f][c] = result.pivot.celdas[f]?.[c] ?? 0
      }
      totalesFila[f] = result.pivot.totalesFila[f] ?? 0
    }
    const truncated =
      result.pivot.filas.length > MAX_PIVOT_ROWS || result.pivot.columnas.length > MAX_PIVOT_COLS

    return (
      <div className="space-y-1">
        <div className="max-h-[240px] overflow-auto rounded-md">
          <ReportPivotGrid
            pivot={{ ...result.pivot, filas, columnas, celdas, totalesFila }}
          />
        </div>
        {truncated && (
          <p className="text-[10px] text-muted-foreground text-center">
            Vista recortada para preview · {result.totalFilas} grupos en total
          </p>
        )}
      </div>
    )
  }

  if (vista === "grafico" && result.chart) {
    const datos = result.chart.datos.slice(0, 12)
    const truncated = result.chart.datos.length > 12
    return (
      <div className="space-y-1">
        <div className="h-[220px] w-full">
          <ReportChartPanel chart={{ ...result.chart, datos }} compact />
        </div>
        {truncated && (
          <p className="text-[10px] text-muted-foreground text-center">
            Mostrando 12 categorías en preview · {result.totalFilas} en total
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="max-h-[240px] overflow-auto rounded-md">
        <ReportPlanoTable
          columns={result.columns}
          rows={result.rows.slice(0, MAX_PLANO_ROWS)}
        />
      </div>
      {result.rows.length > MAX_PLANO_ROWS && (
        <p className="text-[10px] text-muted-foreground text-center">
          Mostrando {MAX_PLANO_ROWS} de {result.totalFilas} filas
        </p>
      )}
    </div>
  )
}