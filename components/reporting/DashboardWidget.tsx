"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboardBiStore } from "@/lib/stores/dashboard-bi-store"
import type { ReportDefinition, QueryResult } from "@/lib/reporting/semantic/types"
import { KpiCard } from "@/components/reporting/KpiCard"
import { ReportChartPanel } from "@/components/reporting/ReportChartPanel"
import type { ChartClickPayload } from "@/lib/reporting/engine/drill-down-resolver"

interface DashboardWidgetProps {
  smartViewId?: number
  titulo: string
  tipoGrafico?: string
  publicToken?: string
}

function authHeaders(publicToken?: string): HeadersInit {
  if (publicToken) {
    return { Authorization: `Public Bearer ${publicToken}`, "Content-Type": "application/json" }
  }
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" }
}

export function DashboardWidget({ smartViewId, titulo, tipoGrafico, publicToken }: DashboardWidgetProps) {
  const { globalDesde, globalHasta, crossFilters, addCrossFilter } = useDashboardBiStore()
  const [definition, setDefinition] = useState<ReportDefinition | null>(null)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 1. Fetch Definition
  useEffect(() => {
    if (!smartViewId) return
    let mounted = true
    setLoading(true)
    
    const url = publicToken 
      ? `/api/public/reporting/definitions/${smartViewId}`
      : `/api/reporting/definitions/${smartViewId}`

    fetch(url, { headers: authHeaders(publicToken) })
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return
        if (data.definicion) setDefinition(data.definicion)
        else setError("Reporte no encontrado")
      })
      .catch((err) => {
        if (mounted) setError(err.message)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [smartViewId])

  // 2. Inject Filters
  const effectiveDefinition = useMemo(() => {
    if (!definition) return null
    const globalFiltros = []
    if (globalDesde) globalFiltros.push({ campo: "fecha", op: "gte" as const, valor: globalDesde })
    if (globalHasta) globalFiltros.push({ campo: "fecha", op: "lte" as const, valor: globalHasta })
    const crossF = crossFilters.map((f) => ({ campo: f.campo, op: "eq" as const, valor: f.valor }))

    return {
      ...definition,
      filtros: [...(definition.filtros ?? []), ...globalFiltros, ...crossF],
    }
  }, [definition, globalDesde, globalHasta, crossFilters])

  // 3. Execute
  useEffect(() => {
    if (!effectiveDefinition) return
    let mounted = true
    setLoading(true)
    setError(null)
    
    const url = publicToken ? `/api/public/reporting/execute` : `/api/reporting/execute`
    const body = publicToken 
      ? JSON.stringify({ definition: effectiveDefinition, smartViewId })
      : JSON.stringify(effectiveDefinition)

    fetch(url, {
      method: "POST",
      headers: authHeaders(publicToken),
      body,
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Error al ejecutar")
        if (mounted) setResult(data)
      })
      .catch((err) => {
        if (mounted) setError(err.message)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [effectiveDefinition])

  function handleChartDrill(payload: ChartClickPayload) {
    if (!effectiveDefinition?.chart?.ejeX) return
    const ejeX = effectiveDefinition.chart.ejeX
    addCrossFilter(ejeX, payload.name, ejeX)
  }

  // 4. Render
  if (!smartViewId) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{titulo}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
          Widget sin configurar
        </CardContent>
      </Card>
    )
  }

  if (tipoGrafico === "kpi") {
    // Si es KPI, renderizamos usando la primer fila y columna
    const val = result?.rows?.[0]?.[result.columns?.[0]?.key ?? ""] ?? 0
    return <KpiCard etiqueta={titulo} valor={Number(val)} loading={loading} />
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">{titulo}</CardTitle>
        {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </CardHeader>
      <CardContent className="flex-1 min-h-[220px]">
        {error ? (
          <div className="h-full flex flex-col items-center justify-center text-destructive gap-2 text-xs">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        ) : !result ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
            {loading ? "Cargando..." : "Sin datos"}
          </div>
        ) : result.chart ? (
          <ReportChartPanel chart={result.chart} compact drillable onDrill={handleChartDrill} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
            Vista no soportada en dashboard
          </div>
        )}
      </CardContent>
    </Card>
  )
}
