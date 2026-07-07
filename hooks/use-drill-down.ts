"use client"

import { useCallback, useState } from "react"
import type { DrillFilter } from "@/components/reporting/DrillBreadcrumb"
import {
  buildTransactionalDetailDefinition,
  mergeDefinitionWithDrill,
  parseChartClick,
  pushDrillFilter,
  type ChartClickPayload,
} from "@/lib/reporting/engine/drill-down-resolver"
import type { QueryResult, ReportDefinition } from "@/lib/reporting/semantic/types"

export interface UseDrillDownOptions {
  baseDefinition: ReportDefinition
  /** Ejecuta reporte (POST /api/reporting/execute o callback interno) */
  onExecute: (def: ReportDefinition) => Promise<QueryResult>
  /** Etiquetas de campos para breadcrumb */
  fieldLabels?: Record<string, string>
  /** Al cambiar stack, re-ejecutar automáticamente el reporte agregado */
  autoRunOnStackChange?: boolean
}

export function useDrillDown({
  baseDefinition,
  onExecute,
  fieldLabels = {},
  autoRunOnStackChange = true,
}: UseDrillDownOptions) {
  const [stack, setStack] = useState<DrillFilter[]>([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailResult, setDetailResult] = useState<QueryResult | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const effectiveDefinition = mergeDefinitionWithDrill(baseDefinition, stack)

  const push = useCallback(
    (filter: DrillFilter) => {
      setStack((prev) => pushDrillFilter(prev, filter))
    },
    [],
  )

  const pushFromChart = useCallback(
    (payload: ChartClickPayload, ejeX: string) => {
      const label = fieldLabels[ejeX] ?? ejeX
      push(parseChartClick(payload, ejeX, label))
    },
    [fieldLabels, push],
  )

  const pushFromPivot = useCallback(
    (valor: string | number, campo: string) => {
      push({
        campo,
        etiqueta: fieldLabels[campo] ?? campo,
        valor,
      })
    },
    [fieldLabels, push],
  )

  const navigate = useCallback((index: number) => {
    setStack((prev) => prev.slice(0, index + 1))
  }, [])

  const clear = useCallback(() => {
    setStack([])
  }, [])

  const openTransactionalDetail = useCallback(async () => {
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const def = buildTransactionalDetailDefinition(baseDefinition, stack)
      const result = await onExecute(def)
      setDetailResult(result)
    } catch {
      setDetailResult(null)
    } finally {
      setDetailLoading(false)
    }
  }, [baseDefinition, stack, onExecute])

  const closeDetail = useCallback(() => {
    setDetailOpen(false)
    setDetailResult(null)
  }, [])

  return {
    stack,
    setStack,
    effectiveDefinition,
    push,
    pushFromChart,
    pushFromPivot,
    navigate,
    clear,
    detailOpen,
    detailResult,
    detailLoading,
    openTransactionalDetail,
    closeDetail,
    autoRunOnStackChange,
  }
}