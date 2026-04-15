"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import {
  Calendar, Clock, Plus, ChevronLeft, ChevronRight,
  User, CheckCircle2, XCircle, Phone, MessageCircle,
} from "lucide-react"

type EstadoTurno = "confirmado" | "pendiente" | "cancelado" | "completado"

interface Profesional {
  id: number
  nombre: string
  especialidad: string | null
  color: string | null
}

interface Turno {
  id: number
  fecha: string
  horaInicio: string
  horaFin: string
  estado: EstadoTurno
  motivo: string | null
  notas: string | null
  profesional: { id: number; nombre: string; especialidad: string | null; color: string | null }
  cliente: { id: number; nombre: string; telefono: string | null } | null
}

const HORARIOS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"]

const ESTADO_CONFIG: Record<EstadoTurno, { label: string; color: string }> = {
  confirmado: { label: "Confirmado", color: "bg-green-100 text-green-800 border-green-300" },
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800 border-red-300" },
  completado: { label: "Completado", color: "bg-slate-100 text-slate-800 border-slate-300" },
}

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

function obtenerFechasSemana(offset: number): { dias: string[]; fechas: Date[] } {
  const hoy = new Date()
  const lunesOffset = (hoy.getDay() + 6) % 7
  const fechas = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoy)
    d.setDate(hoy.getDate() - lunesOffset + i + offset * 7)
    return d
  })
  return { dias: fechas.map(d => d.getDate().toString()), fechas }
}

export default function AgendaPage() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [loading, setLoading] = useState(true)
  const [resumen, setResumen] = useState({ totalHoy: 0, pendientes: 0, confirmados: 0, completados: 0 })
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [diaSeleccionado, setDiaSeleccionado] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)
  const [profesionalFiltro, setProfesionalFiltro] = useState("todos")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null)
  const [vistaDetalle, setVistaDetalle] = useState(false)
  const [form, setForm] = useState({ horaInicio: "09:00", motivo: "", notas: "", profesionalId: "", duracion: "30" })

  const { dias: diasConFecha, fechas } = obtenerFechasSemana(semanaOffset)
  const fechaSeleccionada = fechas[diaSeleccionado]

  const cargarDatos = useCallback(async () => {
    try {
      const fechaStr = fechaSeleccionada?.toISOString().split("T")[0]
      const res = await fetch(`/api/agenda?fecha=${fechaStr}`)
      if (!res.ok) return
      const data = await res.json()
      setTurnos(data.turnos ?? [])
      setProfesionales(data.profesionales ?? [])
      setResumen(data.resumen ?? { totalHoy: 0, pendientes: 0, confirmados: 0, completados: 0 })
    } catch { /* silently fail */ } finally { setLoading(false) }
  }, [fechaSeleccionada])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: cargarDatos,
  }))

  const profsVisibles = profesionales.filter(p => profesionalFiltro === "todos" || String(p.id) === profesionalFiltro)
  const COLORES_DEFAULT = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-amber-500", "bg-pink-500", "bg-cyan-500"]

  const turnosFiltrados = turnos.filter(t =>
    profesionalFiltro === "todos" || String(t.profesional.id) === profesionalFiltro
  )

  const getTurnosEnHorario = (hora: string, profId: number) =>
    turnosFiltrados.filter(t => t.horaInicio === hora && t.profesional.id === profId)

  const agregarTurno = async () => {
    if (!form.motivo || !form.profesionalId) return
    const dur = parseInt(form.duracion)
    const [h, m] = form.horaInicio.split(":").map(Number)
    const totalMin = h * 60 + m + dur
    const horaFin = `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`
    try {
      const res = await fetch("/api/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: fechaSeleccionada.toISOString().split("T")[0],
          horaInicio: form.horaInicio,
          horaFin,
          profesionalId: Number(form.profesionalId),
          motivo: form.motivo,
          notas: form.notas || undefined,
        }),
      })
      if (res.ok) { setDialogOpen(false); cargarDatos() }
    } catch { /* silently fail */ }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><Spinner className="h-8 w-8" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-7 w-7" />
            Agenda de Turnos
          </h1>
          <p className="text-muted-foreground">Turnos, reservas y seguimiento de pacientes/clientes</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Turno
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-3"><p className="text-xs text-muted-foreground">Hoy</p><p className="text-2xl font-bold">{resumen.totalHoy}</p></CardContent></Card>
        <Card className="border-green-200"><CardContent className="pt-3"><p className="text-xs text-green-700">Confirmados</p><p className="text-2xl font-bold text-green-700">{resumen.confirmados}</p></CardContent></Card>
        <Card className="border-yellow-200"><CardContent className="pt-3"><p className="text-xs text-yellow-700">Pendientes</p><p className="text-2xl font-bold text-yellow-700">{resumen.pendientes}</p></CardContent></Card>
        <Card className="border-slate-200"><CardContent className="pt-3"><p className="text-xs text-slate-700">Completados</p><p className="text-2xl font-bold text-slate-700">{resumen.completados}</p></CardContent></Card>
      </div>

      {/* Semana */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => { setSemanaOffset(o => o - 1); setDiaSeleccionado(0) }}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="flex gap-2 flex-1">
              {DIAS_SEMANA.map((dia, i) => (
                <button
                  key={i}
                  className={`flex-1 flex flex-col items-center py-2 rounded-lg transition-all ${i === diaSeleccionado ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  onClick={() => setDiaSeleccionado(i)}
                >
                  <span className="text-xs">{dia}</span>
                  <span className="text-lg font-bold">{diasConFecha[i]}</span>
                </button>
              ))}
            </div>
            <Button variant="ghost" size="icon" onClick={() => { setSemanaOffset(o => o + 1); setDiaSeleccionado(0) }}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtro profesional */}
      <div className="flex gap-3 items-center flex-wrap">
        <Button size="sm" variant={profesionalFiltro === "todos" ? "default" : "outline"} onClick={() => setProfesionalFiltro("todos")}>Todos</Button>
        {profesionales.map((p, idx) => (
          <Button key={p.id} size="sm" variant={profesionalFiltro === String(p.id) ? "default" : "outline"} onClick={() => setProfesionalFiltro(String(p.id))}>
            <div className={`h-3 w-3 rounded-full ${p.color ?? COLORES_DEFAULT[idx % COLORES_DEFAULT.length]} mr-2`} />
            {p.nombre}
          </Button>
        ))}
      </div>

      {/* Grilla de agenda */}
      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: `80px repeat(${profsVisibles.length || 1}, 1fr)` }}>
              <div />
              {profsVisibles.map((p, idx) => (
                <div key={p.id} className="text-center">
                  <div className={`h-2 rounded-t-full ${p.color ?? COLORES_DEFAULT[idx % COLORES_DEFAULT.length]} mb-1`} />
                  <p className="text-sm font-medium">{p.nombre}</p>
                  {p.especialidad && <p className="text-xs text-muted-foreground">{p.especialidad}</p>}
                </div>
              ))}
            </div>

            {HORARIOS.map(hora => (
              <div key={hora} className="grid gap-2 mb-1" style={{ gridTemplateColumns: `80px repeat(${profsVisibles.length || 1}, 1fr)` }}>
                <div className="flex items-start pt-1"><span className="text-xs text-muted-foreground font-mono">{hora}</span></div>
                {profsVisibles.map(prof => {
                  const turnosHora = getTurnosEnHorario(hora, prof.id)
                  return (
                    <div key={prof.id} className="min-h-[36px] relative">
                      {turnosHora.length > 0 ? turnosHora.map(t => (
                        <button
                          key={t.id}
                          className={`w-full text-left p-2 rounded-lg border text-xs font-medium transition-all hover:shadow-md ${ESTADO_CONFIG[t.estado].color}`}
                          onClick={() => { setTurnoSeleccionado(t); setVistaDetalle(true) }}
                        >
                          <p className="font-bold truncate">{t.cliente?.nombre ?? "Sin cliente"}</p>
                          <p className="opacity-70">{t.motivo ?? "Sin motivo"}</p>
                        </button>
                      )) : (
                        <button
                          className="w-full h-8 rounded border-dashed border hover:bg-muted/50 transition-colors"
                          onClick={() => { setForm(prev => ({ ...prev, horaInicio: hora, profesionalId: String(prof.id) })); setDialogOpen(true) }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog nuevo turno */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Turno</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo / Servicio *</Label>
              <Input value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} placeholder="Consulta general, cirugía..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Profesional *</Label>
                <Select value={form.profesionalId} onValueChange={v => setForm({ ...form, profesionalId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                  <SelectContent>
                    {profesionales.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hora de inicio</Label>
                <Select value={form.horaInicio} onValueChange={v => setForm({ ...form, horaInicio: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{HORARIOS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duración (min)</Label>
                <Select value={form.duracion} onValueChange={v => setForm({ ...form, duracion: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["15", "30", "45", "60", "90", "120"].map(d => <SelectItem key={d} value={d}>{d} min</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Input value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Notas internas..." />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={agregarTurno} disabled={!form.motivo || !form.profesionalId}>Agendar Turno</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog detalle turno */}
      <Dialog open={vistaDetalle} onOpenChange={setVistaDetalle}>
        <DialogContent>
          {turnoSeleccionado && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {turnoSeleccionado.cliente?.nombre ?? "Sin cliente"}
                  <Badge className={ESTADO_CONFIG[turnoSeleccionado.estado].color}>
                    {ESTADO_CONFIG[turnoSeleccionado.estado].label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted rounded-lg">
                  <div><span className="font-medium">Profesional:</span> {turnoSeleccionado.profesional.nombre}</div>
                  <div><span className="font-medium">Motivo:</span> {turnoSeleccionado.motivo ?? "-"}</div>
                  <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {turnoSeleccionado.horaInicio} — {turnoSeleccionado.horaFin}</div>
                  {turnoSeleccionado.cliente?.telefono && (
                    <div className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{turnoSeleccionado.cliente.telefono}</div>
                  )}
                  {turnoSeleccionado.notas && (
                    <div className="col-span-2"><span className="font-medium">Notas:</span> {turnoSeleccionado.notas}</div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
