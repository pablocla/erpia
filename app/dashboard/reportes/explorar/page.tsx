"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { Download, Loader2, Play, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { PageHeader, PageShell } from "@/components/layout"
import {
  FieldExplorer,
  resolveDropZone,
  type FieldItem,
} from "@/components/reporting/FieldExplorer"
import { FilterBar, type FilterDraft } from "@/components/reporting/FilterBar"
import { ViewToggle, type ReportVista } from "@/components/reporting/ViewToggle"
import { ReportPlanoTable } from "@/components/reporting/ReportPlanoTable"
import { ReportPivotGrid } from "@/components/reporting/ReportPivotGrid"
import { ReportChartPanel } from "@/components/reporting/ReportChartPanel"
import { DrillBreadcrumb, type DrillFilter } from "@/components/reporting/DrillBreadcrumb"
import { SheetsLockedState, SheetsUpsellDialog } from "@/components/reporting/SheetsUpsellDialog"
import { useSheetsEntitlement } from "@/hooks/use-sheets-entitlement"
import { restoreExplorerFromDefinition } from "@/lib/reporting/restore-definition"
import type { QueryResult, ReportDefinition } from "@/lib/reporting/semantic/types"
import { useAuthStore } from "@/lib/stores/auth-store"

type ChartTipo = "bar" | "line" | "pie" | "area"
type UpsellReason =
  | "module_not_entitled"
  | "usage_execute_exceeded"
  | "usage_export_exceeded"
  | "saved_reports_exceeded"

const ADMIN_ROLES = new Set(["admin", "administrador", "gerente", "dueno"])

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" }
}

function ReportesExplorarPageContent() {
  const searchParams = useSearchParams()
  const loadId = searchParams.get("load")
  const templateId = searchParams.get("template")

  const [fuente, setFuente] = useState("ventas")
  const [vista, setVista] = useState<ReportVista>("plano")
  const [chartTipo, setChartTipo] = useState<ChartTipo>("bar")
  const [campos, setCampos] = useState<FieldItem[]>([])
  const [sources, setSources] = useState<{ id: string; etiqueta: string }[]>([])
  const [filas, setFilas] = useState<FieldItem[]>([])
  const [columnas, setColumnas] = useState<FieldItem[]>([])
  const [valores, setValores] = useState<FieldItem[]>([])
  const [filtros, setFiltros] = useState<FilterDraft[]>([])
  const [drillStack, setDrillStack] = useState<DrillFilter[]>([])
  const [result, setResult] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [saveName, setSaveName] = useState("")
  const [loadedReportId, setLoadedReportId] = useState<number | null>(null)
  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [upsellOpen, setUpsellOpen] = useState(false)
  const [upsellReason, setUpsellReason] = useState<UpsellReason | undefined>()

  const { entitled, tier, usage, plans, loading: entitlementLoading, refresh } = useSheetsEntitlement()
  const role = useAuthStore((s) => s.user?.rol)
  const isAdmin = role ? ADMIN_ROLES.has(role) : false

  const restoringRef = useRef(false)
  const pendingDefRef = useRef<{ def: ReportDefinition; nombre: string } | null>(null)
  const autoRunRef = useRef(false)
  const userChangedFuenteRef = useRef(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const loadCatalog = useCallback(async (f: string) => {
    const res = await fetch(`/api/reporting/catalog?fuente=${f}`, { headers: authHeaders() })
    if (!res.ok) return []
    const data = await res.json()
    setSources(data.sources ?? [])
    const loaded: FieldItem[] = (data.campos ?? []).map((c: FieldItem) => ({
      campo: c.campo,
      etiqueta: c.etiqueta,
      tipo: c.tipo,
    }))
    setCampos(loaded)
    return loaded
  }, [])

  useEffect(() => {
    if (!entitled) return
    void (async () => {
      await loadCatalog(fuente)
      if (restoringRef.current) return
      if (userChangedFuenteRef.current) {
        userChangedFuenteRef.current = false
        setFilas([])
        setColumnas([])
        setValores([])
        setDrillStack([])
        setResult(null)
      }
    })()
  }, [fuente, loadCatalog, entitled])

  function handleLimitResponse(res: Response, data: { reason?: string; error?: string }) {
    if (res.status === 402 || res.status === 403) {
      setUpsellReason((data.reason as UpsellReason) ?? "module_not_entitled")
      setUpsellOpen(true)
      setError(data.error ?? "Límite de plan alcanzado")
      return true
    }
    return false
  }

  useEffect(() => {
    if (!loadId) return
    void (async () => {
      restoringRef.current = true
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/reporting/definitions/${loadId}`, { headers: authHeaders() })
        if (!res.ok) throw new Error("No se pudo cargar el reporte")
        const row = await res.json()
        const def = row.definicion as ReportDefinition
        pendingDefRef.current = { def, nombre: row.nombre ?? "" }
        setLoadedReportId(row.id)
        setFuente(def.fuente)
        const catalogCampos = await loadCatalog(def.fuente)
        const restored = restoreExplorerFromDefinition(def, catalogCampos, row.nombre)
        setVista(restored.vista)
        setChartTipo(restored.chartTipo)
        setFilas(restored.filas)
        setColumnas(restored.columnas)
        setValores(restored.valores)
        setFiltros(restored.filtros)
        setSaveName(restored.saveName)
        setDrillStack([])
        autoRunRef.current = true
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar")
      } finally {
        restoringRef.current = false
        pendingDefRef.current = null
        setLoading(false)
      }
    })()
  }, [loadId, loadCatalog])

  useEffect(() => {
    if (!templateId || loadId) return
    void (async () => {
      restoringRef.current = true
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/reporting/templates/${templateId}`, { headers: authHeaders() })
        if (!res.ok) throw new Error("No se pudo cargar la plantilla")
        const row = await res.json()
        const def = row.definicion as ReportDefinition
        setLoadedTemplateId(row.id)
        setLoadedReportId(null)
        setFuente(def.fuente)
        const catalogCampos = await loadCatalog(def.fuente)
        const restored = restoreExplorerFromDefinition(def, catalogCampos, row.nombreSugerido)
        setVista(restored.vista)
        setChartTipo(restored.chartTipo)
        setFilas(restored.filas)
        setColumnas(restored.columnas)
        setValores(restored.valores)
        setFiltros(restored.filtros)
        setSaveName(restored.saveName)
        setDrillStack([])
        autoRunRef.current = true
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar plantilla")
      } finally {
        restoringRef.current = false
        setLoading(false)
      }
    })()
  }, [templateId, loadId, loadCatalog])

  const disponibles = useMemo(() => {
    const used = new Set([...filas, ...columnas, ...valores].map((f) => f.campo))
    return campos.filter((c) => !used.has(c.campo))
  }, [campos, filas, columnas, valores])

  const filtrosEfectivos = useMemo((): FilterDraft[] => {
    const drillFiltros: FilterDraft[] = drillStack.map((d) => ({
      campo: d.campo,
      op: "eq",
      valor: d.valor,
    }))
    return [...filtros, ...drillFiltros]
  }, [filtros, drillStack])

  const definicion = useMemo((): ReportDefinition => {
    const dimensiones = [...filas, ...columnas]
      .filter((f, i, arr) => arr.findIndex((x) => x.campo === f.campo) === i)
      .map((f) => ({ campo: f.campo }))

    const medidas = valores.length
      ? valores.map((v) => ({
          campo: v.campo,
          fn: (v.tipo === "medida" && v.campo === "cantidad" ? "count" : "sum") as "sum" | "count",
          etiqueta: `${v.tipo === "medida" && v.campo === "cantidad" ? "count" : "sum"}_${v.campo}`,
        }))
      : [{ campo: "total", fn: "sum" as const, etiqueta: "sum_total" }]

    const def: ReportDefinition = {
      connectorId: "claverp",
      fuente,
      vista,
      dimensiones: vista === "plano" ? [] : dimensiones,
      medidas: vista === "plano" ? [] : medidas,
      filtros: filtrosEfectivos,
      limit: 5000,
    }

    if (vista === "plano") {
      def.camposPlano = campos.map((c) => c.campo)
    }

    if (vista === "pivot" && valores[0]) {
      def.pivot = {
        filas: filas.map((f) => f.campo),
        columnas: columnas.map((f) => f.campo),
        medida: medidas[0].etiqueta ?? `sum_${valores[0].campo}`,
        fn: medidas[0].fn,
      }
    }

    if (vista === "grafico") {
      def.chart = {
        tipo: chartTipo,
        ejeX: filas[0]?.campo ?? dimensiones[0]?.campo ?? "mes",
        series: medidas.map((m) => m.etiqueta ?? `${m.fn}_${m.campo}`),
      }
    }

    return def
  }, [fuente, vista, filas, columnas, valores, filtrosEfectivos, campos, chartTipo])

  const drillableKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const f of [...filas, ...columnas]) keys.add(f.campo)
    return keys
  }, [filas, columnas])

  function assign(zone: "filas" | "columnas" | "valores", field: FieldItem) {
    const setter = zone === "filas" ? setFilas : zone === "columnas" ? setColumnas : setValores
    setter((prev) => (prev.some((p) => p.campo === field.campo) ? prev : [...prev, field]))
  }

  function remove(zone: "filas" | "columnas" | "valores", campo: string) {
    const setter = zone === "filas" ? setFilas : zone === "columnas" ? setColumnas : setValores
    setter((prev) => prev.filter((p) => p.campo !== campo))
  }

  function onDragEnd(event: DragEndEvent) {
    const field = event.active.data.current?.field as FieldItem | undefined
    const zone = resolveDropZone(String(event.over?.id ?? ""))
    if (field && zone) assign(zone, field)
  }

  const ejecutar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/reporting/execute", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(definicion),
      })
      const data = await res.json()
      if (!res.ok) {
        if (handleLimitResponse(res, data)) return
        throw new Error(data.error ?? "Error al ejecutar")
      }
      setResult(data)
      void refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [definicion, refresh])

  useEffect(() => {
    if (autoRunRef.current) {
      autoRunRef.current = false
      void ejecutar()
    }
  }, [definicion, ejecutar])

  function pushDrill(campo: string, etiqueta: string, valor: string | number) {
    setDrillStack((prev) => {
      const idx = prev.findIndex((d) => d.campo === campo)
      const next = idx >= 0 ? [...prev.slice(0, idx), { campo, etiqueta, valor }] : [...prev, { campo, etiqueta, valor }]
      return next
    })
    autoRunRef.current = true
  }

  function handlePivotRowDrill(valor: string) {
    const field = filas[0]
    if (!field) return
    pushDrill(field.campo, field.etiqueta, valor)
  }

  function handlePivotColDrill(valor: string) {
    const field = columnas[0]
    if (!field) return
    pushDrill(field.campo, field.etiqueta, valor)
  }

  function handlePivotCellDrill(fila: string, col: string) {
    if (filas[0]) pushDrill(filas[0].campo, filas[0].etiqueta, fila)
    if (columnas[0]) pushDrill(columnas[0].campo, columnas[0].etiqueta, col)
  }

  function handlePlanoDrill(campo: string, etiqueta: string, valor: string | number) {
    pushDrill(campo, etiqueta, valor)
  }

  function navigateDrill(index: number) {
    setDrillStack((prev) => prev.slice(0, index + 1))
    autoRunRef.current = true
  }

  function clearDrill() {
    setDrillStack([])
    autoRunRef.current = true
  }

  function handleFuenteChange(value: string) {
    if (value !== fuente) {
      userChangedFuenteRef.current = true
      setLoadedReportId(null)
    }
    setFuente(value)
  }

  async function exportarExcel() {
    setLoading(true)
    try {
      const res = await fetch("/api/reporting/export", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ definicion, titulo: saveName || `Reporte ${fuente}` }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (handleLimitResponse(res, data)) return
        throw new Error("Error al exportar")
      }
      const blob = await res.blob()
      void refresh()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `clav-sheets-${fuente}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error export")
    } finally {
      setLoading(false)
    }
  }

  async function guardar() {
    if (!saveName.trim()) {
      setError("Ingresá un nombre para guardar")
      return
    }
    const codigo = saveName.trim().toLowerCase().replace(/\s+/g, "_").slice(0, 40)
    const res = await fetch("/api/reporting/definitions", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        codigo,
        nombre: saveName,
        tipoVista: vista,
        definicion,
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      if (handleLimitResponse(res, data)) return
      setError(data.error ?? "No se pudo guardar")
      return
    }
    setError(null)
  }

  const camposFecha = campos.filter((c) => c.tipo === "fecha" || c.campo === "desde" || c.campo === "hasta")

  if (entitlementLoading) {
    return (
      <PageShell>
        <p className="text-sm text-muted-foreground text-center py-16">Cargando…</p>
      </PageShell>
    )
  }

  if (!entitled) {
    return (
      <PageShell>
        <SheetsLockedState plans={plans} isAdmin={isAdmin} onActivated={refresh} />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="mb-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/reportes">← Mis reportes</Link>
        </Button>
      </div>
      <PageHeader
        title="Clav Sheets — Explorador"
        description={
          loadedReportId
            ? `Editando reporte guardado · clic en celdas para drill-down`
            : loadedTemplateId
              ? `Plantilla cargada · ajustá y guardá como reporte propio`
              : "Reportes planos, pivot y gráficos. Arrastrá campos como SmartView."
        }
        badge={
          <div className="flex gap-1">
            {loadedTemplateId && <Badge variant="secondary">Plantilla</Badge>}
            {loadedReportId && <Badge variant="secondary">#{loadedReportId}</Badge>}
            {tier && <Badge variant="secondary">{tier === "pro" ? "Pro" : "Lite"}</Badge>}
            {usage && tier === "lite" && (
              <Badge variant="outline" className="text-[10px]">
                {usage.execute.usado}/{usage.execute.limite ?? "∞"} consultas
              </Badge>
            )}
          </div>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={ejecutar} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Ejecutar
            </Button>
            <Button variant="outline" onClick={exportarExcel} disabled={loading || !result}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Fuente de datos</p>
              <Select value={fuente} onValueChange={handleFuenteChange}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(sources.length ? sources : [{ id: fuente, etiqueta: fuente }]).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.etiqueta}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ViewToggle value={vista} onChange={setVista} />
            {vista === "grafico" && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tipo de gráfico</p>
                <Select value={chartTipo} onValueChange={(v) => setChartTipo(v as ChartTipo)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Barras</SelectItem>
                    <SelectItem value="line">Líneas</SelectItem>
                    <SelectItem value="area">Área</SelectItem>
                    <SelectItem value="pie">Torta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <FilterBar
              filtros={filtros}
              camposFecha={camposFecha.length ? camposFecha : [{ campo: "desde", etiqueta: "Desde" }, { campo: "hasta", etiqueta: "Hasta" }]}
              onChange={setFiltros}
            />
            <DndContext sensors={sensors} onDragEnd={onDragEnd}>
              <FieldExplorer
                disponibles={disponibles}
                filas={filas}
                columnas={columnas}
                valores={valores}
                onAssign={assign}
                onRemove={remove}
              />
            </DndContext>
            <div className="flex gap-2 pt-2 border-t">
              <Input
                placeholder="Nombre del reporte"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="h-8 text-xs"
              />
              <Button size="sm" variant="outline" onClick={guardar}>
                <Save className="h-3.5 w-3.5" />
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 space-y-2">
            <div className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Resultado</CardTitle>
              {result && (
                <span className="text-xs text-muted-foreground">
                  {result.totalFilas} filas {result.truncado ? "(truncado)" : ""}
                </span>
              )}
            </div>
            <DrillBreadcrumb stack={drillStack} onNavigate={navigateDrill} onClear={clearDrill} />
          </CardHeader>
          <CardContent>
            {!result ? (
              <p className="text-sm text-muted-foreground py-12 text-center">
                Configurá campos y presioná Ejecutar.
              </p>
            ) : vista === "pivot" && result.pivot ? (
              <ReportPivotGrid
                pivot={result.pivot}
                rowField={filas[0]}
                colField={columnas[0]}
                onRowDrill={filas[0] ? handlePivotRowDrill : undefined}
                onColDrill={columnas[0] ? handlePivotColDrill : undefined}
                onCellDrill={filas[0] && columnas[0] ? handlePivotCellDrill : undefined}
              />
            ) : vista === "grafico" && result.chart ? (
              <ReportChartPanel chart={result.chart} />
            ) : (
              <ReportPlanoTable
                columns={result.columns}
                rows={result.rows}
                onCellDrill={handlePlanoDrill}
                drillableKeys={drillableKeys.size > 0 ? drillableKeys : undefined}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <SheetsUpsellDialog
        open={upsellOpen}
        onOpenChange={setUpsellOpen}
        reason={upsellReason}
        plans={plans}
        isAdmin={isAdmin}
        onActivated={refresh}
      />
    </PageShell>
  )
}

export default function ReportesExplorarPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">Cargando...</div>}>
      <ReportesExplorarPageContent />
    </Suspense>
  )
}