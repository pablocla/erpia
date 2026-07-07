/**
 * Motor de drill-down genérico — estilo TOTVS PO UI.
 * Traduce clics en gráficos/pivot a filtros y definición plano transaccional.
 */

import type { DrillFilter } from "@/components/reporting/DrillBreadcrumb"
import type { ReportDefinition, ReportFilter } from "@/lib/reporting/semantic/types"

export interface ChartClickPayload {
  name: string
  seriesKey?: string
  raw?: Record<string, string | number>
}

export function drillStackToFilters(stack: DrillFilter[]): ReportFilter[] {
  return stack.map((d) => ({
    campo: d.campo,
    op: "eq" as const,
    valor: d.valor,
  }))
}

export function mergeDefinitionWithDrill(
  base: ReportDefinition,
  stack: DrillFilter[],
): ReportDefinition {
  const drillFilters = drillStackToFilters(stack)
  const existing = base.filtros.filter(
    (f) => !drillFilters.some((d) => d.campo === f.campo),
  )
  return {
    ...base,
    filtros: [...existing, ...drillFilters],
  }
}

/** Definición para ver comprobantes / filas transaccionales tras drill. */
export function buildTransactionalDetailDefinition(
  base: ReportDefinition,
  stack: DrillFilter[],
): ReportDefinition {
  const merged = mergeDefinitionWithDrill(base, stack)
  return {
    ...merged,
    vista: "plano",
    dimensiones: [],
    medidas: [],
    pivot: undefined,
    chart: undefined,
    camposPlano: undefined,
    limit: 500,
  }
}

export function parseChartClick(
  payload: ChartClickPayload,
  ejeX: string,
  ejeXLabel: string,
): DrillFilter {
  return {
    campo: ejeX,
    etiqueta: ejeXLabel,
    valor: payload.name,
  }
}

export function parsePivotRowClick(
  valor: string,
  campo: string,
  etiqueta: string,
): DrillFilter {
  return { campo, etiqueta, valor }
}

export function pushDrillFilter(
  stack: DrillFilter[],
  filter: DrillFilter,
): DrillFilter[] {
  const idx = stack.findIndex((d) => d.campo === filter.campo)
  if (idx >= 0) {
    return [...stack.slice(0, idx), filter]
  }
  return [...stack, filter]
}