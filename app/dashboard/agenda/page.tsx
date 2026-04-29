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
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/stores"
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

interface CustomFieldValue {
  id: number
  campoId: number
  entidadId: string
  valorTexto?: string | null
  valorNumero?: number | null
  valorFecha?: string | null
  valorBooleano?: boolean | null
  valorJson?: unknown | null
}

interface CustomFieldDefinition {
  id: number
  nombreCampo: string
  etiqueta: string
  tipoDato: string
  opciones: string[] | null
  obligatorio: boolean
  placeholder?: string | null
  ayuda?: string | null
  valorDefault?: string | null
  valor: CustomFieldValue | null
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
  const [servicios, setServicios] = useState<Array<{ id: number; nombre: string; duracionMinutos: number }>>([])
  const [loading, setLoading] = useState(true)
  const [resumen, setResumen] = useState({ totalHoy: 0, pendientes: 0, confirmados: 0, completados: 0 })
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [diaSeleccionado, setDiaSeleccionado] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)
  const [profesionalFiltro, setProfesionalFiltro] = useState("todos")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null)
  const [vistaDetalle, setVistaDetalle] = useState(false)
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[] | null>(null)
  const [loadingCustomFields, setLoadingCustomFields] = useState(false)
  const [savingCustomFields, setSavingCustomFields] = useState(false)
  const [actualizandoTurno, setActualizandoTurno] = useState(false)
  const [cancelandoTurno, setCancelandoTurno] = useState(false)
  const [form, setForm] = useState({ horaInicio: "09:00", motivo: "", notas: "", profesionalId: "", duracion: "30", servicioId: "" })
  const { toast } = useToast()

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
      setServicios(data.servicios ?? [])
      setResumen(data.resumen ?? { totalHoy: 0, pendientes: 0, confirmados: 0, completados: 0 })
    } catch { /* silently fail */ } finally { setLoading(false) }
  }, [fechaSeleccionada])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  useEffect(() => {
    if (!turnoSeleccionado || !vistaDetalle) {
      setCustomFields(null)
      return
    }

    const loadCustomFields = async () => {
      setLoadingCustomFields(true)
      try {
        const res = await authFetch(`/api/campos-personalizados/valores?entidad=turno&entidadId=${turnoSeleccionado.id}`)
        if (!res.ok) return
        const data = await res.json()
        setCustomFields(data.data ?? [])
      } catch {
        setCustomFields([])
      } finally {
        setLoadingCustomFields(false)
      }
    }

    void loadCustomFields()
  }, [turnoSeleccionado, vistaDetalle])

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
    const servicioSeleccionado = servicios.find((s) => String(s.id) === form.servicioId)
    const dur = servicioSeleccionado ? servicioSeleccionado.duracionMinutos : parseInt(form.duracion)
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
          duracionMinutos: dur,
          servicioId: servicioSeleccionado?.id,
          profesionalId: Number(form.profesionalId),
          motivo: form.motivo,
          notas: form.notas || undefined,
        }),
      })
      if (res.ok) { setDialogOpen(false); cargarDatos() }
    } catch { /* silently fail */ }
  }

  const handleCampoPersonalizadoChange = (campoId: number, value: Partial<CustomFieldValue>) => {
    setCustomFields((current) =>
      current?.map((campo) => {
        if (campo.id !== campoId) return campo
        return {
          ...campo,
          valor: {
            ...(campo.valor ?? {}),
            ...value,
          },
        }
      }) ?? null,
    )
  }

  const guardarCamposPersonalizados = async () => {
    if (!turnoSeleccionado || !customFields) return
    setSavingCustomFields(true)

    const valores = customFields.map((campo) => {
      const valor = campo.valor ?? {}
      const base: Record<string, unknown> = { campoId: campo.id }
      switch (campo.tipoDato) {
        case "numero":
          return { ...base, valorNumero: valor.valorNumero ?? (typeof valor.valorTexto === "string" ? Number(valor.valorTexto) : undefined) }
        case "fecha":
          return { ...base, valorFecha: valor.valorFecha ?? null }
        case "booleano":
          return { ...base, valorBooleano: valor.valorBooleano ?? false }
        case "multiselect":
          return { ...base, valorJson: valor.valorJson ?? valor.valorTexto ?? null }
        default:
          return { ...base, valorTexto: valor.valorTexto ?? "" }
      }
    })

    try {
      const res = await authFetch("/api/campos-personalizados", {
        method: "POST",
        body: JSON.stringify({ action: "guardarValores", registroId: turnoSeleccionado.id, valores }),
      })
      if (res.ok) {
        setCustomFields(customFields.map((campo) => ({ ...campo, valor: { ...campo.valor } })))
        toast({ title: "Campos guardados", description: "Se actualizaron los detalles del turno." })
      } else {
        const error = await res.json().catch(() => ({}))
        toast({ title: "Error al guardar", description: error.error ?? "No se pudieron guardar los campos", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "No se pudo conectar con el servidor", variant: "destructive" })
    } finally {
      setSavingCustomFields(false)
    }
  }

  const actualizarTurno = async (changes: { estado?: EstadoTurno }) => {
    if (!turnoSeleccionado) return
    setActualizandoTurno(true)
    try {
      const res = await fetch(`/api/agenda/${turnoSeleccionado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        toast({ title: "Error", description: error.error ?? "No se pudo actualizar el turno.", variant: "destructive" })
        return
      }
      toast({ title: "Turno actualizado", description: "El estado del turno se actualizó correctamente." })
      setVistaDetalle(false)
      cargarDatos()
    } catch {
      toast({ title: "Error", description: "No se pudo conectar con el servidor", variant: "destructive" })
    } finally {
      setActualizandoTurno(false)
    }
  }

  const cancelarTurno = async () => {
    if (!turnoSeleccionado) return
    setCancelandoTurno(true)
    try {
      const res = await fetch(`/api/agenda/${turnoSeleccionado.id}`, { method: "DELETE" })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        toast({ title: "Error", description: error.error ?? "No se pudo cancelar el turno.", variant: "destructive" })
        return
      }
      toast({ title: "Turno cancelado", description: "El turno se canceló correctamente." })
      setVistaDetalle(false)
      cargarDatos()
    } catch {
      toast({ title: "Error", description: "No se pudo conectar con el servidor", variant: "destructive" })
    } finally {
      setCancelandoTurno(false)
    }
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
                <Label>Servicio</Label>
                <Select value={form.servicioId} onValueChange={v => setForm({ ...form, servicioId: v })}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin servicio específico</SelectItem>
                    {servicios.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.nombre} · {s.duracionMinutos} min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Profesional *</Label>
                <Select value={form.profesionalId} onValueChange={v => setForm({ ...form, profesionalId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                  <SelectContent>
                    {profesionales.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora de inicio</Label>
                <Select value={form.horaInicio} onValueChange={v => setForm({ ...form, horaInicio: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{HORARIOS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duración (min)</Label>
                <Select value={form.duracion} onValueChange={v => setForm({ ...form, duracion: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["15", "30", "45", "60", "90", "120"].map(d => <SelectItem key={d} value={d}>{d} min</SelectItem>)}</SelectContent>
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

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">Campos personalizados</h3>
                    <Button size="sm" onClick={guardarCamposPersonalizados} disabled={!customFields || savingCustomFields}>
                      Guardar campos
                    </Button>
                  </div>

                  {loadingCustomFields ? (
                    <div className="py-4 text-center text-muted-foreground">Cargando campos personalizados...</div>
                  ) : customFields && customFields.length > 0 ? (
                    <div className="space-y-3">
                      {customFields.map((campo) => (
                        <div key={campo.id} className="space-y-2 rounded-lg border p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{campo.etiqueta}</span>
                            <span className="text-xs text-muted-foreground">{campo.tipoDato}</span>
                          </div>
                          {campo.tipoDato === "booleano" ? (
                            <label className="inline-flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={campo.valor?.valorBooleano ?? false}
                                onChange={(e) => handleCampoPersonalizadoChange(campo.id, { valorBooleano: e.target.checked })}
                                className="h-4 w-4 rounded border-muted"
                              />
                              {campo.placeholder ?? campo.etiqueta}
                            </label>
                          ) : campo.tipoDato === "select" ? (
                            <Select value={campo.valor?.valorTexto ?? campo.valorDefault ?? ""} onValueChange={(value) => handleCampoPersonalizadoChange(campo.id, { valorTexto: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder={campo.placeholder ?? "Seleccioná…"} />
                              </SelectTrigger>
                              <SelectContent>
                                {(campo.opciones ?? []).map((opcion) => (
                                  <SelectItem key={opcion} value={opcion}>{opcion}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : campo.tipoDato === "fecha" ? (
                            <Input
                              type="date"
                              value={campo.valor?.valorFecha ?? campo.valorDefault ?? ""}
                              onChange={(e) => handleCampoPersonalizadoChange(campo.id, { valorFecha: e.target.value })}
                            />
                          ) : campo.tipoDato === "numero" ? (
                            <Input
                              type="number"
                              value={campo.valor?.valorNumero ?? campo.valor?.valorTexto ?? campo.valorDefault ?? ""}
                              onChange={(e) => handleCampoPersonalizadoChange(campo.id, { valorNumero: Number(e.target.value) })}
                            />
                          ) : campo.tipoDato === "formula" ? (
                            <Input
                              value={campo.valor?.valorTexto ?? campo.valorDefault ?? ""
                              }
                              readOnly
                              className="bg-muted/50"
                            />
                          ) : (
                            <Input
                              value={campo.valor?.valorTexto ?? campo.valorDefault ?? ""}
                              onChange={(e) => handleCampoPersonalizadoChange(campo.id, { valorTexto: e.target.value })}
                              placeholder={campo.placeholder ?? "Ingresa un valor"}
                            />
                          )}
                          {campo.ayuda && <p className="text-xs text-muted-foreground">{campo.ayuda}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No hay campos personalizados registrados para este turno.</div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button variant="outline" onClick={() => actualizarTurno({ estado: "completado" })} disabled={actualizandoTurno || turnoSeleccionado.estado === "completado"}>
                    {actualizandoTurno ? "Actualizando..." : "Marcar completado"}
                  </Button>
                  <Button variant="destructive" onClick={cancelarTurno} disabled={cancelandoTurno || turnoSeleccionado.estado === "cancelado"}>
                    {cancelandoTurno ? "Cancelando..." : "Cancelar turno"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
