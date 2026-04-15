"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Plus, Trash2, Flag, Calendar, Eye, EyeOff, CheckCircle2,
  Clock, AlertTriangle, Flame, CheckSquare, RefreshCw, Filter,
} from "lucide-react"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"

interface Tarea {
  id: number
  titulo: string
  descripcion?: string | null
  completada: boolean
  prioridad: "baja" | "media" | "alta" | "urgente"
  fechaVencimiento?: string | null
  visibleJefe: boolean
  createdAt: string
  usuario?: { id: number; nombre: string }
}

const PRIORIDAD_CONFIG = {
  urgente: { label: "Urgente", color: "bg-red-500/10 text-red-700 border-red-300", icon: Flame },
  alta:    { label: "Alta",    color: "bg-orange-500/10 text-orange-700 border-orange-300", icon: AlertTriangle },
  media:   { label: "Media",   color: "bg-blue-500/10 text-blue-700 border-blue-300", icon: Flag },
  baja:    { label: "Baja",    color: "bg-slate-500/10 text-slate-600 border-slate-300", icon: Flag },
}

const PRIORIDAD_ORDEN = { urgente: 0, alta: 1, media: 2, baja: 3 }

function estaVencida(fecha?: string | null) {
  if (!fecha) return false
  return new Date(fecha) < new Date(new Date().toDateString())
}

function diasParaVencer(fecha?: string | null): number | null {
  if (!fecha) return null
  const diff = new Date(fecha).getTime() - new Date(new Date().toDateString()).getTime()
  return Math.round(diff / 86400000)
}

export default function MisTareasPage() {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarCompletadas, setMostrarCompletadas] = useState(false)
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("todas")
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [editando, setEditando] = useState<Tarea | null>(null)
  const [guardando, setGuardando] = useState(false)

  // Form state
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [prioridad, setPrioridad] = useState<"baja" | "media" | "alta" | "urgente">("media")
  const [fechaVencimiento, setFechaVencimiento] = useState("")
  const [visibleJefe, setVisibleJefe] = useState(false)

  const tituloRef = useRef<HTMLInputElement>(null)

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const cargarTareas = async () => {
    setCargando(true)
    try {
      const params = new URLSearchParams({ incluirCompletadas: mostrarCompletadas ? "true" : "false" })
      const res = await fetch(`/api/mis-tareas?${params}`, { headers: getAuthHeaders() })
      const data = await res.json()
      setTareas(Array.isArray(data) ? data : [])
    } catch {
      setTareas([])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void cargarTareas()
  }, [mostrarCompletadas])

  useKeyboardShortcuts(erpShortcuts({
    onNew: () => abrirDialogo(),
    onRefresh: () => cargarTareas(),
  }))

  const abrirDialogo = (tarea?: Tarea) => {
    if (tarea) {
      setEditando(tarea)
      setTitulo(tarea.titulo)
      setDescripcion(tarea.descripcion ?? "")
      setPrioridad(tarea.prioridad)
      setFechaVencimiento(tarea.fechaVencimiento ? tarea.fechaVencimiento.split("T")[0] : "")
      setVisibleJefe(tarea.visibleJefe)
    } else {
      setEditando(null)
      setTitulo("")
      setDescripcion("")
      setPrioridad("media")
      setFechaVencimiento("")
      setVisibleJefe(false)
    }
    setDialogoAbierto(true)
    setTimeout(() => tituloRef.current?.focus(), 60)
  }

  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setEditando(null)
  }

  const guardarTarea = async () => {
    if (!titulo.trim()) return
    setGuardando(true)
    try {
      const body = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        prioridad,
        fechaVencimiento: fechaVencimiento || null,
        visibleJefe,
      }

      if (editando) {
        await fetch(`/api/mis-tareas?id=${editando.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify(body),
        })
      } else {
        await fetch("/api/mis-tareas", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify(body),
        })
      }
      cerrarDialogo()
      await cargarTareas()
    } finally {
      setGuardando(false)
    }
  }

  const toggleCompletada = async (tarea: Tarea) => {
    setTareas(prev => prev.map(t => t.id === tarea.id ? { ...t, completada: !t.completada } : t))
    await fetch(`/api/mis-tareas?id=${tarea.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ completada: !tarea.completada }),
    })
    await cargarTareas()
  }

  const eliminarTarea = async (id: number) => {
    setTareas(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/mis-tareas?id=${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
  }

  const tareasFiltradas = tareas.filter(t => {
    if (filtroPrioridad !== "todas" && t.prioridad !== filtroPrioridad) return false
    return true
  })

  const pendientes = tareasFiltradas.filter(t => !t.completada)
  const completadas = tareasFiltradas.filter(t => t.completada)
  const urgentes = pendientes.filter(t => t.prioridad === "urgente" || t.prioridad === "alta")
  const vencidas = pendientes.filter(t => estaVencida(t.fechaVencimiento))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CheckSquare className="h-8 w-8 text-primary" />
            Mis Tareas
          </h1>
          <p className="text-muted-foreground mt-1">Organizá tu jornada. Las tareas privadas solo las ves vos.</p>
          <p className="text-xs text-muted-foreground mt-0.5">Alt+N nueva tarea · Alt+R refrescar</p>
        </div>
        <Button onClick={() => abrirDialogo()} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 bg-muted/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendientes.length}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-muted/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
              <Flame className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{urgentes.length}</p>
              <p className="text-xs text-muted-foreground">Urgentes/Altas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-muted/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{vencidas.length}</p>
              <p className="text-xs text-muted-foreground">Vencidas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-muted/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completadas.length}</p>
              <p className="text-xs text-muted-foreground">Completadas hoy</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las prioridades</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Switch
            id="mostrar-completadas"
            checked={mostrarCompletadas}
            onCheckedChange={setMostrarCompletadas}
          />
          <Label htmlFor="mostrar-completadas" className="text-xs cursor-pointer">
            Mostrar completadas
          </Label>
        </div>
        <Button variant="ghost" size="sm" className="h-8" onClick={cargarTareas}>
          <RefreshCw className={`h-3.5 w-3.5 ${cargando ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Lista de tareas pendientes */}
      {cargando ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : pendientes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p className="font-medium text-muted-foreground">No hay tareas pendientes</p>
            <p className="text-sm text-muted-foreground mt-1">Agregá una nueva tarea para empezar</p>
            <Button className="mt-4" onClick={() => abrirDialogo()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {pendientes
            .sort((a, b) => {
              // Vencidas primero
              const aVenc = estaVencida(a.fechaVencimiento) ? -1 : 0
              const bVenc = estaVencida(b.fechaVencimiento) ? -1 : 0
              if (aVenc !== bVenc) return aVenc - bVenc
              // Luego por prioridad
              return PRIORIDAD_ORDEN[a.prioridad] - PRIORIDAD_ORDEN[b.prioridad]
            })
            .map(tarea => (
              <TareaCard
                key={tarea.id}
                tarea={tarea}
                onToggle={toggleCompletada}
                onEditar={abrirDialogo}
                onEliminar={eliminarTarea}
              />
            ))}
        </div>
      )}

      {/* Completadas */}
      {mostrarCompletadas && completadas.length > 0 && (
        <div className="space-y-2">
          <Separator />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
            Completadas ({completadas.length})
          </p>
          {completadas.map(tarea => (
            <TareaCard
              key={tarea.id}
              tarea={tarea}
              onToggle={toggleCompletada}
              onEditar={abrirDialogo}
              onEliminar={eliminarTarea}
            />
          ))}
        </div>
      )}

      {/* Diálogo nueva/editar tarea */}
      <Dialog open={dialogoAbierto} onOpenChange={(v) => { if (!v) cerrarDialogo() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Título *</Label>
              <Input
                ref={tituloRef}
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="¿Qué tenés que hacer?"
                className="mt-1"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) void guardarTarea() }}
              />
            </div>

            <div>
              <Label className="text-xs">Descripción (opcional)</Label>
              <Textarea
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Detalles adicionales..."
                className="mt-1 resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Prioridad</Label>
                <Select value={prioridad} onValueChange={v => setPrioridad(v as typeof prioridad)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgente">🔴 Urgente</SelectItem>
                    <SelectItem value="alta">🟠 Alta</SelectItem>
                    <SelectItem value="media">🔵 Media</SelectItem>
                    <SelectItem value="baja">⚫ Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Vencimiento</Label>
                <Input
                  type="date"
                  value={fechaVencimiento}
                  onChange={e => setFechaVencimiento(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Visibilidad */}
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <Switch
                id="visible-jefe"
                checked={visibleJefe}
                onCheckedChange={setVisibleJefe}
              />
              <div className="flex-1">
                <Label htmlFor="visible-jefe" className="text-sm cursor-pointer flex items-center gap-1.5">
                  {visibleJefe ? <Eye className="h-3.5 w-3.5 text-blue-500" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                  {visibleJefe ? "Visible para el jefe" : "Solo yo la veo"}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {visibleJefe
                    ? "Los administradores pueden ver esta tarea en el panel de equipo."
                    : "Esta tarea es privada. Nadie más puede verla."}
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={cerrarDialogo} disabled={guardando}>
                Cancelar
              </Button>
              <Button onClick={guardarTarea} disabled={!titulo.trim() || guardando}>
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear Tarea"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ── Componente TareaCard ──────────────────────────────────────────── */

function TareaCard({
  tarea,
  onToggle,
  onEditar,
  onEliminar,
}: {
  tarea: Tarea
  onToggle: (t: Tarea) => void
  onEditar: (t: Tarea) => void
  onEliminar: (id: number) => void
}) {
  const cfg = PRIORIDAD_CONFIG[tarea.prioridad]
  const PrioIcon = cfg.icon
  const vencida = estaVencida(tarea.fechaVencimiento)
  const dias = diasParaVencer(tarea.fechaVencimiento)

  return (
    <div
      className={`
        flex items-start gap-3 p-3 rounded-lg border transition-all group
        ${tarea.completada ? "opacity-50 bg-muted/20" : vencida ? "border-red-200 bg-red-50/50 dark:bg-red-950/20" : "bg-card hover:shadow-sm"}
      `}
    >
      <Checkbox
        checked={tarea.completada}
        onCheckedChange={() => onToggle(tarea)}
        className="mt-0.5 shrink-0"
      />

      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEditar(tarea)}>
        <p className={`text-sm font-medium leading-snug ${tarea.completada ? "line-through text-muted-foreground" : ""}`}>
          {tarea.titulo}
        </p>
        {tarea.descripcion && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{tarea.descripcion}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${cfg.color}`}>
            <PrioIcon className="h-2.5 w-2.5 mr-0.5" />
            {cfg.label}
          </Badge>
          {tarea.fechaVencimiento && (
            <Badge
              variant="outline"
              className={`text-[10px] h-4 px-1.5 ${vencida ? "bg-red-500/10 text-red-700 border-red-300" : dias !== null && dias <= 1 ? "bg-orange-500/10 text-orange-700 border-orange-300" : ""}`}
            >
              <Calendar className="h-2.5 w-2.5 mr-0.5" />
              {vencida ? "Vencida" : dias === 0 ? "Hoy" : dias === 1 ? "Mañana" : `${dias}d`}
            </Badge>
          )}
          {tarea.visibleJefe ? (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-blue-600 border-blue-200 bg-blue-50">
              <Eye className="h-2.5 w-2.5 mr-0.5" />
              Visible jefe
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-muted-foreground">
              <EyeOff className="h-2.5 w-2.5 mr-0.5" />
              Privada
            </Badge>
          )}
          {tarea.usuario && (
            <span className="text-[10px] text-muted-foreground">{tarea.usuario.nombre}</span>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={() => onEliminar(tarea.id)}
      >
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
      </Button>
    </div>
  )
}
