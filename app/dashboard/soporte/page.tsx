"use client"

import { useEffect, useMemo, useState } from "react"
import { MessageSquare, RefreshCw, Timer, TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type Ticket = {
  id: number
  numero: string
  titulo: string
  descripcion: string
  tipo: string
  modulo: string | null
  prioridad: string
  estado: string
  asignadoA: string | null
  reportadoPor: string | null
  createdAt: string
  updatedAt: string
}

type TicketDetalle = Ticket & {
  comentarios: {
    id: number
    texto: string
    autor: string
    createdAt: string
  }[]
}

type TicketMetricas = {
  resumen: {
    total: number
    abiertos: number
    enProgreso: number
    resueltos: number
    cerrados: number
    criticosAbiertos: number
    vencidosSla: number
    mttrHoras: number
  }
  modulos: { modulo: string; total: number }[]
  generadoAt: string
}

const ESTADOS = ["abierto", "en_progreso", "resuelto", "cerrado"]
const PRIORIDADES = ["baja", "media", "alta", "critica"]

const SLA_HORAS: Record<string, number> = {
  critica: 4,
  alta: 8,
  media: 24,
  baja: 72,
}

function horasAbierto(fechaIso: string) {
  return Math.max(0, (Date.now() - new Date(fechaIso).getTime()) / (1000 * 60 * 60))
}

function colorPrioridad(prioridad: string) {
  if (prioridad === "critica") return "bg-red-500/10 text-red-700 border-red-300"
  if (prioridad === "alta") return "bg-orange-500/10 text-orange-700 border-orange-300"
  if (prioridad === "media") return "bg-blue-500/10 text-blue-700 border-blue-300"
  return "bg-slate-500/10 text-slate-700 border-slate-300"
}

export default function SoportePage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [metricas, setMetricas] = useState<TicketMetricas | null>(null)
  const [q, setQ] = useState("")
  const [estado, setEstado] = useState("todos")
  const [prioridad, setPrioridad] = useState("todas")
  const [modulo, setModulo] = useState("todos")
  const [loading, setLoading] = useState(false)
  const [detalleId, setDetalleId] = useState<number | null>(null)
  const [detalle, setDetalle] = useState<TicketDetalle | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [comentario, setComentario] = useState("")
  const [guardandoComentario, setGuardandoComentario] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      if (estado !== "todos") params.set("estado", estado)
      if (prioridad !== "todas") params.set("prioridad", prioridad)
      if (modulo !== "todos") params.set("modulo", modulo)

      const res = await fetch(`/api/tickets?${params.toString()}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      const data = await res.json()
      setTickets(Array.isArray(data.data) ? data.data : [])

      const resMetricas = await fetch("/api/tickets/metricas", {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      const dataMetricas = await resMetricas.json()
      setMetricas(dataMetricas?.resumen ? dataMetricas : null)
    } finally {
      setLoading(false)
    }
  }

  const cargarDetalle = async (id: number) => {
    setDetalleId(id)
    setLoadingDetalle(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/tickets/${id}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      const data = await res.json()
      setDetalle(data?.id ? data : null)
    } finally {
      setLoadingDetalle(false)
    }
  }

  const actualizarEstado = async (id: number, nuevoEstado: string) => {
    const token = localStorage.getItem("token")
    await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ estado: nuevoEstado }),
    })
    await cargar()
    if (detalleId === id) await cargarDetalle(id)
  }

  const guardarComentario = async () => {
    if (!detalleId || !comentario.trim()) return

    setGuardandoComentario(true)
    try {
      const token = localStorage.getItem("token")
      await fetch(`/api/tickets/${detalleId}/comentarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ texto: comentario.trim() }),
      })
      setComentario("")
      await cargarDetalle(detalleId)
    } finally {
      setGuardandoComentario(false)
    }
  }

  useEffect(() => {
    void cargar()
  }, [])

  const resumen = useMemo(() => {
    const abiertos = tickets.filter((t) => t.estado === "abierto" || t.estado === "en_progreso").length
    const criticos = tickets.filter((t) => t.prioridad === "critica").length
    return { abiertos, criticos, total: tickets.length }
  }, [tickets])

  const modulosDisponibles = useMemo(() => {
    const lista = new Set<string>()
    for (const t of tickets) {
      if (t.modulo?.trim()) lista.add(t.modulo.trim())
    }
    return Array.from(lista).sort((a, b) => a.localeCompare(b))
  }, [tickets])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Soporte y Tickets</h1>
          <p className="text-muted-foreground">Bandeja interna para analistas funcionales y soporte al cliente.</p>
        </div>
        <Button variant="outline" onClick={cargar} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{resumen.total}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Abiertos</p><p className="text-2xl font-bold text-amber-700">{resumen.abiertos}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Críticos</p><p className="text-2xl font-bold text-red-700">{resumen.criticos}</p></CardContent></Card>
      </div>

      {metricas && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-red-200 bg-red-50/40">
            <CardContent className="pt-4">
              <p className="text-xs text-red-700/80">SLA vencido</p>
              <p className="text-2xl font-bold text-red-700">{metricas.resumen.vencidosSla}</p>
              <p className="text-xs text-muted-foreground mt-1">Tickets abiertos fuera de objetivo</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/40">
            <CardContent className="pt-4">
              <p className="text-xs text-amber-800/80">Críticos abiertos</p>
              <p className="text-2xl font-bold text-amber-700">{metricas.resumen.criticosAbiertos}</p>
              <p className="text-xs text-muted-foreground mt-1">Incidentes de alta severidad</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">MTTR</p>
              <p className="text-2xl font-bold">{metricas.resumen.mttrHoras.toFixed(1)} h</p>
              <p className="text-xs text-muted-foreground mt-1">Tiempo promedio de resolución</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Resueltos + Cerrados</p>
              <p className="text-2xl font-bold">{metricas.resumen.resueltos + metricas.resumen.cerrados}</p>
              <p className="text-xs text-muted-foreground mt-1">Efectividad de cierre operativo</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Gestión corporativa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por número o título..."
              className="max-w-sm"
            />
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={prioridad} onValueChange={setPrioridad}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las prioridades</SelectItem>
                {PRIORIDADES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={modulo} onValueChange={setModulo}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los módulos</SelectItem>
                {modulosDisponibles.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="secondary" onClick={cargar}>Filtrar</Button>
          </div>

          <div className="space-y-2">
            {tickets.map((t) => (
              <div key={t.id} className="border rounded-lg p-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-medium">{t.numero} - {t.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.modulo || "general"} · {new Date(t.createdAt).toLocaleString("es-AR")} · {t.reportadoPor || "sin email"}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="outline" className={colorPrioridad(t.prioridad)}>{t.prioridad}</Badge>
                    <Badge>{t.estado}</Badge>
                    {(["abierto", "en_progreso"].includes(t.estado) && horasAbierto(t.createdAt) > (SLA_HORAS[t.prioridad] ?? SLA_HORAS.media)) && (
                      <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-300">
                        <TriangleAlert className="h-3 w-3 mr-1" />
                        SLA vencido
                      </Badge>
                    )}
                    {t.asignadoA && (
                      <Badge variant="outline">Asignado: {t.asignadoA}</Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => cargarDetalle(t.id)}>
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Ver detalle
                  </Button>
                  <Select value={t.estado} onValueChange={(v) => actualizarEstado(t.id, v)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
            {tickets.length === 0 && <p className="text-sm text-muted-foreground">No hay tickets para mostrar.</p>}
          </div>
        </CardContent>
      </Card>

      {metricas && metricas.modulos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución por módulo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metricas.modulos.map((m) => (
                <div key={m.modulo} className="flex items-center justify-between border rounded-md px-3 py-2">
                  <p className="text-sm font-medium">{m.modulo}</p>
                  <Badge variant="secondary">{m.total}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={detalleId !== null} onOpenChange={(open) => {
        if (!open) {
          setDetalleId(null)
          setDetalle(null)
          setComentario("")
        }
      }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ticket - {detalle?.numero || "Detalle"}</DialogTitle>
          </DialogHeader>

          {loadingDetalle && <p className="text-sm text-muted-foreground">Cargando detalle...</p>}

          {!loadingDetalle && detalle && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 space-y-2">
                <p className="font-semibold">{detalle.titulo}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detalle.descripcion}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{detalle.tipo}</Badge>
                  <Badge variant="outline" className={colorPrioridad(detalle.prioridad)}>{detalle.prioridad}</Badge>
                  <Badge>{detalle.estado}</Badge>
                  <Badge variant="outline"><Timer className="h-3 w-3 mr-1" />{horasAbierto(detalle.createdAt).toFixed(1)} h abierto</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Módulo: {detalle.modulo || "general"} · Reportado por: {detalle.reportadoPor || "sin email"}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Comentarios internos</p>
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {detalle.comentarios.map((c) => (
                    <div key={c.id} className="border rounded-md p-2">
                      <p className="text-sm whitespace-pre-wrap">{c.texto}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {c.autor} · {new Date(c.createdAt).toLocaleString("es-AR")}
                      </p>
                    </div>
                  ))}
                  {detalle.comentarios.length === 0 && (
                    <p className="text-sm text-muted-foreground">Sin comentarios aún.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Nuevo comentario</p>
                <Textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Agregar contexto técnico, workaround o avance de análisis..."
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button onClick={guardarComentario} disabled={guardandoComentario || !comentario.trim()}>
                    {guardandoComentario ? "Guardando..." : "Publicar comentario"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
