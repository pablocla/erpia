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

const ACCION_COLORS: Record<string, string> = {
  crear: "bg-green-100 text-green-700",
  editar: "bg-blue-100 text-blue-700",
  eliminar: "bg-red-100 text-red-700",
  login: "bg-violet-100 text-violet-700",
  pago: "bg-amber-100 text-amber-700",
  emision: "bg-cyan-100 text-cyan-700",
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
    <div className="space-y-6">
      <div className="dashboard-surface rounded-xl p-4 sm:p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Trazabilidad corporativa
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Auditoría / Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">Registro completo de acciones en el sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Button variant="outline" onClick={cargar} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* KPIs row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Total de eventos</p>
            <p className="text-2xl font-bold">{resumen?.totalLogs ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" />Módulos activos</p>
            <p className="text-2xl font-bold">{modulosUnicos.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3.5 w-3.5" />Tipos de acción</p>
            <p className="text-2xl font-bold">{accionesUnicas.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top modules distribution */}
      {resumen?.porModulo && resumen.porModulo.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Distribución por módulo</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {resumen.porModulo.map((m) => (
                <Badge key={m.modulo} variant="outline" className="px-3 py-1.5">
                  {m.modulo} <span className="ml-1.5 font-bold">{m.count}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Eventos recientes</CardTitle>
            <div className="flex gap-2">
              {modulosUnicos.length > 0 && (
                <Select value={filtroModulo} onValueChange={setFiltroModulo}>
                  <SelectTrigger className="h-9 w-36"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {modulosUnicos.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {accionesUnicas.length > 0 && (
                <Select value={filtroAccion} onValueChange={setFiltroAccion}>
                  <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {accionesUnicas.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <DataTable<LogEntry>
            data={logsFiltrados}
            columns={[
              { key: "createdAt", header: "Fecha", sortable: true, cell: (l) => <span className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</span> },
              { key: "usuario" as any, header: "Usuario", cell: (l) => l.usuario ? (<div><p className="font-medium text-xs">{l.usuario.nombre}</p><p className="text-[10px] text-muted-foreground">{l.usuario.email}</p></div>) : <span className="text-muted-foreground">Sistema</span>, exportFn: (l) => l.usuario?.nombre ?? "Sistema" },
              { key: "accion", header: "Acción", cell: (l) => <Badge variant="secondary" className={`text-xs ${ACCION_COLORS[l.accion] ?? ""}`}>{l.accion}</Badge> },
              { key: "modulo", header: "Módulo", cell: (l) => <span className="font-medium text-xs">{l.modulo}</span> },
              { key: "entidad", header: "Entidad", cell: (l) => l.entidad ? <span className="text-xs">{l.entidad}{l.entidadId ? ` #${l.entidadId}` : ""}</span> : <span className="text-muted-foreground">—</span> },
              { key: "detalle", header: "Detalle", cell: (l) => <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{l.detalle ?? "—"}</span> },
            ] as DataTableColumn<LogEntry>[]}
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
    </div>
  )
}
