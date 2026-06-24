"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Building2,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Timer,
  TriangleAlert,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { CLAVER_GROUP } from "@/lib/brand"
import {
  horasAbierto,
  estaVencidoSla,
} from "@/lib/soporte/tickets-service"

type EmpresaResumen = {
  id: number
  nombre: string
  razonSocial: string
  rubro: string
  ticketsAbiertos: number
}

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
  urlOrigen: string | null
  stackTrace: string | null
  createdAt: string
  updatedAt: string
  empresaId: number
  empresa?: {
    id: number
    nombre: string
    razonSocial: string
    rubro: string
  }
}

type TicketDetalle = Ticket & {
  comentarios: {
    id: number
    texto: string
    autor: string
    createdAt: string
  }[]
  empresa?: {
    id: number
    nombre: string
    razonSocial: string
    rubro: string
    email: string | null
  }
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
  empresas: { empresaId: number; total: number }[]
  generadoAt: string
}

const ESTADOS = ["abierto", "en_progreso", "resuelto", "cerrado"]
const PRIORIDADES = ["baja", "media", "alta", "critica"]

function colorPrioridad(prioridad: string) {
  if (prioridad === "critica") return "bg-red-500/10 text-red-700 border-red-300"
  if (prioridad === "alta") return "bg-orange-500/10 text-orange-700 border-orange-300"
  if (prioridad === "media") return "bg-blue-500/10 text-blue-700 border-blue-300"
  return "bg-slate-500/10 text-slate-700 border-slate-300"
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function ClaverReportsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [empresas, setEmpresas] = useState<EmpresaResumen[]>([])
  const [metricas, setMetricas] = useState<TicketMetricas | null>(null)
  const [q, setQ] = useState("")
  const [estado, setEstado] = useState("todos")
  const [prioridad, setPrioridad] = useState("todas")
  const [modulo, setModulo] = useState("todos")
  const [empresaId, setEmpresaId] = useState("todas")
  const [loading, setLoading] = useState(false)
  const [detalleId, setDetalleId] = useState<number | null>(null)
  const [detalle, setDetalle] = useState<TicketDetalle | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [comentario, setComentario] = useState("")
  const [asignadoA, setAsignadoA] = useState("")
  const [guardandoComentario, setGuardandoComentario] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      if (estado !== "todos") params.set("estado", estado)
      if (prioridad !== "todas") params.set("prioridad", prioridad)
      if (modulo !== "todos") params.set("modulo", modulo)
      if (empresaId !== "todas") params.set("empresaId", empresaId)

      const [resTickets, resMetricas, resEmpresas] = await Promise.all([
        fetch(`/api/claver/reportes?${params.toString()}`, { headers: authHeaders() }),
        fetch(`/api/claver/reportes/metricas?${params.toString()}`, { headers: authHeaders() }),
        fetch("/api/claver/reportes/empresas", { headers: authHeaders() }),
      ])

      const dataTickets = await resTickets.json()
      setTickets(Array.isArray(dataTickets.data) ? dataTickets.data : [])

      if (resMetricas.ok) {
        const dataMetricas = await resMetricas.json()
        setMetricas(dataMetricas?.resumen ? dataMetricas : null)
      }

      if (resEmpresas.ok) {
        const dataEmpresas = await resEmpresas.json()
        setEmpresas(Array.isArray(dataEmpresas.data) ? dataEmpresas.data : [])
      }
    } finally {
      setLoading(false)
    }
  }

  const cargarDetalle = async (id: number) => {
    setDetalleId(id)
    setLoadingDetalle(true)
    try {
      const res = await fetch(`/api/claver/reportes/${id}`, { headers: authHeaders() })
      const data = await res.json()
      setDetalle(data?.id ? data : null)
      setAsignadoA(data?.asignadoA ?? "")
    } finally {
      setLoadingDetalle(false)
    }
  }

  const actualizarTicket = async (id: number, payload: Record<string, unknown>) => {
    await fetch(`/api/claver/reportes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    })
    await cargar()
    if (detalleId === id) await cargarDetalle(id)
  }

  const guardarComentario = async () => {
    if (!detalleId || !comentario.trim()) return

    setGuardandoComentario(true)
    try {
      await fetch(`/api/claver/reportes/${detalleId}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
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
  }, [estado, prioridad, modulo, empresaId])

  useKeyboardShortcuts(erpShortcuts({ onRefresh: cargar }))

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

  const empresaNombrePorId = useMemo(() => {
    const mapa = new Map<number, string>()
    for (const e of empresas) mapa.set(e.id, e.nombre)
    for (const t of tickets) {
      if (t.empresa) mapa.set(t.empresa.id, t.empresa.nombre)
    }
    return mapa
  }, [empresas, tickets])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Operations Reports</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            Cross-tenant ticket inbox
            <Badge variant="outline" className="bg-amber-500/10 text-amber-800 border-amber-300">
              {CLAVER_GROUP.name} Interno
            </Badge>
          </p>
        </div>
        <Button variant="outline" onClick={cargar} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{resumen.total}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Open</p><p className="text-2xl font-bold text-amber-700">{resumen.abiertos}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Critical</p><p className="text-2xl font-bold text-red-700">{resumen.criticos}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Active Tenants</p><p className="text-2xl font-bold">{empresas.length}</p></CardContent></Card>
      </div>

      {metricas && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-red-200 bg-red-50/40">
            <CardContent className="pt-4">
              <p className="text-xs text-red-700/80">SLA breached</p>
              <p className="text-2xl font-bold text-red-700">{metricas.resumen.vencidosSla}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/40">
            <CardContent className="pt-4">
              <p className="text-xs text-amber-800/80">Critical open</p>
              <p className="text-2xl font-bold text-amber-700">{metricas.resumen.criticosAbiertos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">MTTR</p>
              <p className="text-2xl font-bold">{metricas.resumen.mttrHoras.toFixed(1)} h</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Resolved + Closed</p>
              <p className="text-2xl font-bold">{metricas.resumen.resueltos + metricas.resumen.cerrados}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ticket Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by ID, title or email..."
              className="max-w-sm"
              onKeyDown={(e) => e.key === "Enter" && cargar()}
            />
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">All organizations</SelectItem>
                {empresas.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">All states</SelectItem>
                {ESTADOS.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={prioridad} onValueChange={setPrioridad}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">All priorities</SelectItem>
                {PRIORIDADES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={modulo} onValueChange={setModulo}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">All modules</SelectItem>
                {modulosDisponibles.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={cargar}>Filter</Button>
          </div>

          <div className="space-y-2">
            {tickets.map((t) => (
              <div key={t.id} className="border rounded-lg p-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-medium">{t.numero} — {t.titulo}</p>
                  <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {t.empresa?.nombre ?? empresaNombrePorId.get(t.empresaId) ?? `Empresa #${t.empresaId}`}
                    <span>·</span>
                    {t.modulo || "general"}
                    <span>·</span>
                    {new Date(t.createdAt).toLocaleString("es-AR")}
                    <span>·</span>
                    {t.reportadoPor || "sin email"}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="outline" className={colorPrioridad(t.prioridad)}>{t.prioridad}</Badge>
                    <Badge>{t.estado}</Badge>
                    {estaVencidoSla(t.estado, t.prioridad, new Date(t.createdAt)) && (
                      <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-300">
                        <TriangleAlert className="h-3 w-3 mr-1" />
                        SLA vencido
                      </Badge>
                    )}
                    {t.asignadoA && <Badge variant="outline">Asignado: {t.asignadoA}</Badge>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => cargarDetalle(t.id)}>
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  <Select value={t.estado} onValueChange={(v) => actualizarTicket(t.id, { estado: v })}>
                    <SelectTrigger className="w-44">
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
            {tickets.length === 0 && !loading && <p className="text-sm text-muted-foreground">No reports found.</p>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={detalleId !== null} onOpenChange={(open) => {
        if (!open) {
          setDetalleId(null)
          setDetalle(null)
          setComentario("")
        }
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report — {detalle?.numero || "Detail"}</DialogTitle>
          </DialogHeader>

          {loadingDetalle && <p className="text-sm text-muted-foreground">Cargando detalle…</p>}

          {!loadingDetalle && detalle && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 space-y-2">
                <p className="font-semibold">{detalle.titulo}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detalle.descripcion}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{detalle.tipo}</Badge>
                  <Badge variant="outline" className={colorPrioridad(detalle.prioridad)}>{detalle.prioridad}</Badge>
                  <Badge>{detalle.estado}</Badge>
                  <Badge variant="outline">
                    <Timer className="h-3 w-3 mr-1" />
                    {horasAbierto(detalle.createdAt).toFixed(1)} h abierto
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cliente: {detalle.empresa?.nombre ?? empresaNombrePorId.get(detalle.empresaId)} ({detalle.empresa?.rubro})
                  · Módulo: {detalle.modulo || "general"}
                  · Reportado por: {detalle.reportadoPor || "sin email"}
                </p>
                {detalle.urlOrigen && (
                  <a
                    href={detalle.urlOrigen}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {detalle.urlOrigen}
                  </a>
                )}
                {detalle.stackTrace && (
                  <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto whitespace-pre-wrap">
                    {detalle.stackTrace}
                  </pre>
                )}
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold">Assign analyst</p>
                  <Input
                    value={asignadoA}
                    onChange={(e) => setAsignadoA(e.target.value)}
                    placeholder="email@claver.com"
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={() => actualizarTicket(detalle.id, { asignadoA: asignadoA.trim() || null })}
                >
                  Save
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Comments</p>
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
                    <p className="text-sm text-muted-foreground">No comments yet.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Internal Comment</p>
                <Textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Analysis progress, workaround or next steps..."
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button onClick={guardarComentario} disabled={guardandoComentario || !comentario.trim()}>
                    {guardandoComentario ? "Saving..." : "Post comment"}
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
