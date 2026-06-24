"use client"

import { useCallback, useEffect, useState } from "react"
import { Download, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type LogEntry = {
  id: string
  fuente: string
  severidad: string
  categoria: string
  contexto: string
  mensaje: string
  createdAt: string
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function estadoColor(estado: string) {
  if (estado === "ok" || estado === "info") return "bg-emerald-500/10 text-emerald-700 border-emerald-300"
  if (estado === "error" || estado === "fatal") return "bg-red-500/10 text-red-700 border-red-300"
  if (estado === "warn") return "bg-amber-500/10 text-amber-800 border-amber-300"
  return "bg-slate-500/10 text-slate-700 border-slate-300"
}

export function OpsLogsPanel({ logsUrl }: { logsUrl: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [categoria, setCategoria] = useState("")
  const [severidad, setSeveridad] = useState("")

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (categoria) params.set("categoria", categoria)
      if (severidad) params.set("severidad", severidad)
      params.set("take", "80")
      const res = await fetch(`${logsUrl}?${params}`, { headers: authHeaders() })
      if (res.ok) {
        const json = await res.json()
        setLogs(json.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [logsUrl, categoria, severidad])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const exportCsv = () => {
    const params = new URLSearchParams()
    if (categoria) params.set("categoria", categoria)
    if (severidad) params.set("severidad", severidad)
    params.set("format", "csv")
    window.open(`${logsUrl}?${params}`, "_blank")
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Logs unificados</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Select value={categoria || "all"} onValueChange={(v) => setCategoria(v === "all" ? "" : v)}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="ops">ops</SelectItem>
              <SelectItem value="afip">afip</SelectItem>
              <SelectItem value="api">api</SelectItem>
              <SelectItem value="funcional">funcional</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severidad || "all"} onValueChange={(v) => setSeveridad(v === "all" ? "" : v)}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Severidad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="info">info</SelectItem>
              <SelectItem value="warn">warn</SelectItem>
              <SelectItem value="error">error</SelectItem>
              <SelectItem value="fatal">fatal</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={cargar} disabled={loading}>
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="h-3 w-3 mr-1" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[28rem] overflow-y-auto">
        {logs.map((log) => (
          <div key={log.id} className="border rounded-md p-2 text-xs">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className={estadoColor(log.severidad)}>{log.severidad}</Badge>
              <Badge variant="outline">{log.fuente}</Badge>
              <span className="text-muted-foreground">{log.categoria} · {log.contexto}</span>
            </div>
            <p>{log.mensaje}</p>
            <p className="text-muted-foreground mt-1">{new Date(log.createdAt).toLocaleString("es-AR")}</p>
          </div>
        ))}
        {logs.length === 0 && <p className="text-sm text-muted-foreground">Sin logs para los filtros seleccionados.</p>}
      </CardContent>
    </Card>
  )
}