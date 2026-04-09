"use client"

import { useEffect, useState, useCallback } from "react"
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

  const logsFiltrados = logs.filter((l) =>
    l.usuario?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    l.usuario?.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
    l.detalle?.toLowerCase().includes(busqueda.toLowerCase()) ||
    l.entidad?.toLowerCase().includes(busqueda.toLowerCase())
  )

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
        <Button variant="outline" onClick={cargar} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
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
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-9 h-9 w-48 text-sm" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              </div>
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
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-t">
                <tr>
                  <th className="text-left p-3 font-medium">Fecha</th>
                  <th className="text-left p-3 font-medium">Usuario</th>
                  <th className="text-left p-3 font-medium">Acción</th>
                  <th className="text-left p-3 font-medium">Módulo</th>
                  <th className="text-left p-3 font-medium">Entidad</th>
                  <th className="text-left p-3 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {logsFiltrados.map((l) => (
                  <tr key={l.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString("es-AR")}
                    </td>
                    <td className="p-3 text-xs">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {l.usuario?.nombre ?? "Sistema"}
                      </span>
                      {l.usuario?.email && <p className="text-muted-foreground text-[10px]">{l.usuario.email}</p>}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${ACCION_COLORS[l.accion] ?? "bg-gray-100 text-gray-700"}`}>
                        {l.accion}
                      </span>
                    </td>
                    <td className="p-3"><Badge variant="outline" className="text-xs">{l.modulo}</Badge></td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {l.entidad && <span>{l.entidad}{l.entidadId ? ` #${l.entidadId}` : ""}</span>}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">{l.detalle ?? "—"}</td>
                  </tr>
                ))}
                {logsFiltrados.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">{loading ? "Cargando..." : "No hay logs para mostrar."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
