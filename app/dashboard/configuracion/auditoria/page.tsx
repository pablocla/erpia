"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Clock, Search, User, RefreshCw, Sparkles, Filter, BarChart3 } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"
import { DateRangePicker } from "@/components/date-range-picker"
import { type DateRange } from "react-day-picker"
import { PageShell, PageHeader, StatusBadge } from "@/components/layout"
import { auditoriaAccionVariant, auditoriaAccionLabel } from "@/lib/ui/status-map"

type LogEntry = {
  id: number
  accion: string
  modulo: string
  entidad: string | null
  entidadId: number | null
  detalle: string | null
  ip: string | null
  createdAt: string
  usuario: { id: number; nombre: string; email: string; rol: string } | null
}
type ResumenLog = {
  totalLogs: number
  porModulo: { modulo: string; count: number }[]
  porAccion: { accion: string; count: number }[]
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [resumen, setResumen] = useState<ResumenLog | null>(null)
  const [loading, setLoading] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [filtroModulo, setFiltroModulo] = useState("todos")
  const [filtroAccion, setFiltroAccion] = useState("todas")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroModulo !== "todos") params.set("modulo", filtroModulo)
      if (filtroAccion !== "todas") params.set("accion", filtroAccion)
      const res = await fetch(`/api/config/auditoria?${params}`, { headers })
      const data = await res.json()
      setLogs(Array.isArray(data.data) ? data.data : [])
      setResumen(data.resumen ?? null)
    } finally {
      setLoading(false)
    }
  }, [filtroModulo, filtroAccion])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const logsFiltrados = useMemo(() => {
    let filtered = logs.filter((l) =>
      l.usuario?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      l.usuario?.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
      l.detalle?.toLowerCase().includes(busqueda.toLowerCase()) ||
      l.entidad?.toLowerCase().includes(busqueda.toLowerCase())
    )
    if (dateRange?.from) {
      filtered = filtered.filter((l) => {
        const d = new Date(l.createdAt)
        if (dateRange.from && d < dateRange.from) return false
        if (dateRange.to) {
          const end = new Date(dateRange.to)
          end.setHours(23, 59, 59, 999)
          if (d > end) return false
        }
        return true
      })
    }
    return filtered
  }, [logs, busqueda, dateRange])

  const modulosUnicos = resumen?.porModulo?.map((m) => m.modulo) ?? []
  const accionesUnicas = resumen?.porAccion?.map((a) => a.accion) ?? []

  return (
    <PageShell>
      <PageHeader
        title="Auditoría / Logs"
        description="Registro completo de acciones realizadas en el sistema para control de cambios y trazabilidad de operaciones."
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5 text-primary/80" />
            Trazabilidad corporativa
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <Button variant="outline" onClick={cargar} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        }
      />

      {/* KPIs row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="backdrop-blur-sm bg-card/60 border-muted/40">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Total de eventos</p>
            <p className="text-2xl font-bold mt-1">{resumen?.totalLogs ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-sm bg-card/60 border-muted/40">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" />Módulos activos</p>
            <p className="text-2xl font-bold mt-1">{modulosUnicos.length}</p>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-sm bg-card/60 border-muted/40">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3.5 w-3.5" />Tipos de acción</p>
            <p className="text-2xl font-bold mt-1">{accionesUnicas.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top modules distribution */}
      {resumen?.porModulo && resumen.porModulo.length > 0 && (
        <Card className="backdrop-blur-sm bg-card/60 border-muted/40">
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Distribución por módulo</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {resumen.porModulo.map((m) => (
                <Badge key={m.modulo} variant="outline" className="px-3 py-1.5 backdrop-blur-sm bg-background/40">
                  {m.modulo} <span className="ml-1.5 font-bold text-foreground">{m.count}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="backdrop-blur-sm bg-card/60 border-muted/40">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-base font-semibold">Eventos de Auditoría</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {modulosUnicos.length > 0 && (
                <Select value={filtroModulo} onValueChange={setFiltroModulo}>
                  <SelectTrigger className="h-9 w-36"><Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" /><SelectValue placeholder="Módulo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los módulos</SelectItem>
                    {modulosUnicos.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {accionesUnicas.length > 0 && (
                <Select value={filtroAccion} onValueChange={setFiltroAccion}>
                  <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Acción" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las acciones</SelectItem>
                    {accionesUnicas.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-9 h-9 w-48 text-sm" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <DataTable<LogEntry>
            data={logsFiltrados}
            columns={[
              {
                key: "createdAt",
                header: "Fecha y Hora",
                sortable: true,
                cell: (l) => <span className="text-xs text-muted-foreground font-mono">{new Date(l.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
              },
              {
                key: "usuario" as any,
                header: "Usuario",
                cell: (l) => l.usuario ? (
                  <div>
                    <p className="font-semibold text-xs text-foreground">{l.usuario.nombre}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{l.usuario.email}</p>
                  </div>
                ) : <span className="text-muted-foreground text-xs italic">Sistema</span>,
                exportFn: (l) => l.usuario?.nombre ?? "Sistema"
              },
              {
                key: "accion",
                header: "Acción",
                cell: (l) => (
                  <StatusBadge
                    variant={auditoriaAccionVariant(l.accion)}
                    label={auditoriaAccionLabel(l.accion)}
                  />
                )
              },
              {
                key: "modulo",
                header: "Módulo",
                cell: (l) => <span className="font-semibold text-xs text-foreground capitalize">{l.modulo}</span>
              },
              {
                key: "entidad",
                header: "Entidad afectada",
                cell: (l) => l.entidad ? <span className="text-xs font-mono">{l.entidad}{l.entidadId ? ` #${l.entidadId}` : ""}</span> : <span className="text-muted-foreground">—</span>
              },
              {
                key: "detalle",
                header: "Detalle / Observaciones",
                cell: (l) => <span className="text-xs text-muted-foreground truncate max-w-[280px] block" title={l.detalle ?? ""}>{l.detalle ?? "—"}</span>
              },
            ]}
            rowKey="id"
            searchPlaceholder="Buscar evento..."
            searchKeys={["accion", "modulo", "detalle"]}
            exportFilename="auditoria-logs"
            loading={loading}
            emptyMessage="No hay eventos registrados"
            emptyIcon={<EmptyStateIllustration type="generico" compact title="Sin eventos" description="Los eventos se registran automáticamente." />}
            defaultPageSize={25}
            compact
          />
        </CardContent>
      </Card>
    </PageShell>
  )
}
