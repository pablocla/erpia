"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  HeartPulse, Search, Plus, ChevronRight, Dog, Cat, Bird,
  Stethoscope, FileText, AlertCircle, Calendar, User, Phone,
  Weight, ClipboardList, Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { PageShell, PageHeader, StatusBadge } from "@/components/layout"
import { activoVariant, activoLabel } from "@/lib/ui/status-map"

interface Consulta {
  id: number
  fecha: string
  motivo: string
  diagnostico: string | null
  tratamiento: string | null
  observaciones: string | null
  peso: number | null
  temperatura: number | null
  proximaVisita: string | null
}

interface Paciente {
  id: number
  nombre: string
  especie: string | null
  raza: string | null
  sexo: string | null
  fechaNac: string | null
  peso: number | null
  chip: string | null
  notas: string | null
  activo: boolean
  cliente: { id: number; nombre: string; telefono: string | null }
  consultas: Consulta[]
  _count: { consultas: number }
}

const ESPECIES_ICONS: Record<string, React.ElementType> = { Canino: Dog, Felino: Cat, Ave: Bird }

export default function HistoriaClinicaPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [resumen, setResumen] = useState({ totalPacientes: 0, totalConsultas: 0, activos: 0 })
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null)
  const [tabActiva, setTabActiva] = useState<"consultas" | "datos">("consultas")
  const [consultaDetalle, setConsultaDetalle] = useState<Consulta | null>(null)
  const [modalNuevoPaciente, setModalNuevoPaciente] = useState(false)
  const [modalNuevaConsulta, setModalNuevaConsulta] = useState(false)
  const [formPaciente, setFormPaciente] = useState({ nombre: "", especie: "", raza: "", sexo: "", fechaNac: "", peso: "", clienteId: "" })
  const [formConsulta, setFormConsulta] = useState({ motivo: "", diagnostico: "", tratamiento: "", observaciones: "", peso: "", temperatura: "" })

  const cargarDatos = useCallback(async () => {
    try {
      const q = busqueda ? `?q=${encodeURIComponent(busqueda)}` : ""
      const res = await fetch(`/api/historia-clinica${q}`)
      if (!res.ok) return
      const data = await res.json()
      setPacientes(data.pacientes ?? [])
      setResumen(data.resumen ?? { totalPacientes: 0, totalConsultas: 0, activos: 0 })
    } catch { /* silently fail */ } finally { setLoading(false) }
  }, [busqueda])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: cargarDatos,
  }))

  const guardarPaciente = async () => {
    if (!formPaciente.nombre) return
    try {
      const res = await fetch("/api/historia-clinica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "paciente", ...formPaciente, peso: formPaciente.peso ? Number(formPaciente.peso) : undefined, clienteId: formPaciente.clienteId ? Number(formPaciente.clienteId) : undefined }),
      })
      if (res.ok) { setModalNuevoPaciente(false); cargarDatos() }
    } catch { /* silently fail */ }
  }

  const guardarConsulta = async () => {
    if (!pacienteSeleccionado || !formConsulta.motivo) return
    try {
      const res = await fetch("/api/historia-clinica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pacienteId: pacienteSeleccionado.id,
          motivo: formConsulta.motivo,
          diagnostico: formConsulta.diagnostico || undefined,
          tratamiento: formConsulta.tratamiento || undefined,
          observaciones: formConsulta.observaciones || undefined,
          peso: formConsulta.peso ? Number(formConsulta.peso) : undefined,
          temperatura: formConsulta.temperatura ? Number(formConsulta.temperatura) : undefined,
        }),
      })
      if (res.ok) { setModalNuevaConsulta(false); cargarDatos() }
    } catch { /* silently fail */ }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><Spinner className="h-8 w-8" /></div>

  return (
    <PageShell>
      <PageHeader
        title="Historias Clínicas"
        description="Ficha digital de pacientes, antecedentes, consultas veterinarias y registro de signos clínicos."
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5 text-primary/80" />
            Clínica Veterinaria
          </span>
        }
        actions={
          <Button onClick={() => setModalNuevoPaciente(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo Paciente
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-14rem)]">
        {/* Panel izquierdo - lista de pacientes */}
        <div className="w-full md:w-80 flex flex-col gap-4 shrink-0">
          {/* KPI pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary" className="backdrop-blur-sm bg-muted/60">{resumen.totalPacientes} pacientes</Badge>
            <Badge variant="secondary" className="backdrop-blur-sm bg-muted/60">{resumen.totalConsultas} consultas</Badge>
            <Badge variant="outline" className="backdrop-blur-sm">{resumen.activos} activos</Badge>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar paciente o dueño..." className="pl-9 h-9 text-sm" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>

          <div className="flex-1 overflow-y-auto max-h-[60vh] md:max-h-[calc(100vh-22rem)] space-y-2 pr-1">
            {pacientes.map(paciente => {
              const Icon = ESPECIES_ICONS[paciente.especie ?? ""] ?? HeartPulse
              const isSelected = pacienteSeleccionado?.id === paciente.id
              return (
                <div key={paciente.id} onClick={() => { setPacienteSeleccionado(paciente); setTabActiva("consultas"); setConsultaDetalle(null) }}
                  className={cn("p-3 rounded-xl border cursor-pointer transition-all backdrop-blur-sm bg-card/40 border-muted/50",
                    isSelected ? "bg-primary/5 ring-1 ring-primary/45 border-primary/40" : "hover:bg-muted/30")}>
                  <div className="flex items-start gap-2.5">
                    <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0 border",
                      paciente.especie === "Canino" ? "bg-[var(--status-warning-muted)] text-[var(--status-warning-foreground)] border-[var(--status-warning-border)]" :
                      paciente.especie === "Felino" ? "bg-[var(--status-info-muted)] text-[var(--status-info-foreground)] border-[var(--status-info-border)]" :
                      "bg-[var(--status-neutral-muted)] text-[var(--status-neutral-foreground)] border-[var(--status-neutral-border)]")}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate text-foreground">{paciente.nombre}</p>
                      <p className="text-xs text-muted-foreground truncate">{paciente.raza ?? paciente.especie} {paciente.sexo ? `\u00b7 ${paciente.sexo}` : ""}</p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5"><User className="h-3 w-3" />{paciente.cliente.nombre}</p>
                    </div>
                    <StatusBadge variant={activoVariant(paciente.activo)} label={activoLabel(paciente.activo)} dot={false} className="text-[10px] px-1.5 py-0 h-auto shrink-0" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 pl-11">{paciente._count.consultas} consultas registradas</p>
                </div>
              )
            })}
            {pacientes.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">No se encontraron pacientes</div>}
          </div>
        </div>

        {/* Panel derecho */}
        <div className="flex-1 overflow-auto">
          {!pacienteSeleccionado ? (
            <Card className="h-full flex flex-col items-center justify-center text-muted-foreground p-12 border-dashed backdrop-blur-sm bg-card/30">
              <HeartPulse className="h-16 w-16 mb-4 opacity-10" />
              <p className="text-sm font-medium">Seleccione un paciente de la lista para ver su historia clínica completa.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Header del paciente */}
              <Card className="backdrop-blur-sm bg-card/60 border-muted/40">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className={cn("h-16 w-16 rounded-full flex items-center justify-center shrink-0 border",
                      pacienteSeleccionado.especie === "Canino" ? "bg-[var(--status-warning-muted)] text-[var(--status-warning-foreground)] border-[var(--status-warning-border)]" :
                      pacienteSeleccionado.especie === "Felino" ? "bg-[var(--status-info-muted)] text-[var(--status-info-foreground)] border-[var(--status-info-border)]" :
                      "bg-[var(--status-neutral-muted)] text-[var(--status-neutral-foreground)] border-[var(--status-neutral-border)]")}>
                      {React.createElement(ESPECIES_ICONS[pacienteSeleccionado.especie ?? ""] ?? HeartPulse, { className: "h-8 w-8" })}
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-bold text-foreground">{pacienteSeleccionado.nombre}</h2>
                          <p className="text-sm text-muted-foreground">{pacienteSeleccionado.especie} {pacienteSeleccionado.raza ? `\u00b7 ${pacienteSeleccionado.raza}` : ""} {pacienteSeleccionado.sexo ? `\u00b7 ${pacienteSeleccionado.sexo}` : ""}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setModalNuevaConsulta(true)} className="gap-2"><Stethoscope className="h-3.5 w-3.5" />Nueva Consulta</Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm"><Weight className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{pacienteSeleccionado.peso ? `${pacienteSeleccionado.peso} kg` : "-"}</span></div>
                        <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{pacienteSeleccionado.fechaNac ? new Date(pacienteSeleccionado.fechaNac).toLocaleDateString("es-AR") : "-"}</span></div>
                        <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-muted-foreground" /><span className="truncate font-medium">{pacienteSeleccionado.cliente.nombre}</span></div>
                        <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{pacienteSeleccionado.cliente.telefono ?? "-"}</span></div>
                      </div>
                      {pacienteSeleccionado.chip && <p className="text-xs font-mono text-muted-foreground mt-2 bg-muted/30 px-2 py-0.5 rounded inline-block">CHIP: {pacienteSeleccionado.chip}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <div className="flex gap-2 border-b">
                {(["consultas", "datos"] as const).map(tab => (
                  <button key={tab} onClick={() => { setTabActiva(tab); setConsultaDetalle(null) }}
                    className={cn("px-4 py-2 text-sm font-semibold capitalize transition-all border-b-2",
                      tabActiva === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
                    {tab === "consultas" ? "Consultas" : "Datos de Ficha"}
                  </button>
                ))}
              </div>

              {/* Tab: Consultas list */}
              {tabActiva === "consultas" && !consultaDetalle && (
                <div className="space-y-3">
                  {pacienteSeleccionado.consultas.length === 0 && (
                    <Card className="backdrop-blur-sm bg-card/60 py-12"><CardContent className="flex flex-col items-center justify-center text-muted-foreground"><ClipboardList className="h-8 w-8 mb-2 opacity-30" /><p className="text-sm font-medium">No hay consultas registradas para este paciente</p></CardContent></Card>
                  )}
                  {pacienteSeleccionado.consultas.map(consulta => (
                    <Card key={consulta.id} className="cursor-pointer hover:border-primary/50 transition-all backdrop-blur-sm bg-card/60 border-muted/40" onClick={() => setConsultaDetalle(consulta)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-[var(--status-success-muted)] text-[var(--status-success-foreground)] border border-[var(--status-success-border)]"><Stethoscope className="h-4 w-4" /></div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">{consulta.motivo}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 font-mono">{new Date(consulta.fecha).toLocaleDateString("es-AR")}</p>
                              {consulta.diagnostico && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">Dx: {consulta.diagnostico}</p>}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Detalle consulta */}
              {tabActiva === "consultas" && consultaDetalle && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Button variant="ghost" size="sm" onClick={() => setConsultaDetalle(null)}>{"\u2190"} Volver a la lista</Button>
                    <span className="text-xs font-mono text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">Fecha: {new Date(consultaDetalle.fecha).toLocaleDateString("es-AR")}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="backdrop-blur-sm bg-card/60"><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Motivo de Consulta</CardTitle></CardHeader><CardContent><p className="text-sm font-medium text-foreground">{consultaDetalle.motivo}</p></CardContent></Card>
                    <Card className="backdrop-blur-sm bg-card/60"><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Signos Clínicos</CardTitle></CardHeader><CardContent className="space-y-2">
                      {consultaDetalle.peso && <div className="flex justify-between text-sm border-b pb-1 last:border-0"><span className="text-muted-foreground">Peso</span><span className="font-medium text-foreground">{consultaDetalle.peso} kg</span></div>}
                      {consultaDetalle.temperatura && <div className="flex justify-between text-sm border-b pb-1 last:border-0"><span className="text-muted-foreground">Temperatura</span><span className="font-medium text-foreground">{consultaDetalle.temperatura} °C</span></div>}
                    </CardContent></Card>
                    {consultaDetalle.diagnostico && <Card className="backdrop-blur-sm bg-card/60"><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Diagnóstico</CardTitle></CardHeader><CardContent><p className="text-sm text-foreground">{consultaDetalle.diagnostico}</p></CardContent></Card>}
                    {consultaDetalle.tratamiento && <Card className="backdrop-blur-sm bg-card/60"><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Tratamiento sugerido</CardTitle></CardHeader><CardContent><p className="text-sm text-foreground">{consultaDetalle.tratamiento}</p></CardContent></Card>}
                    {consultaDetalle.observaciones && <Card className="col-span-1 md:col-span-2 backdrop-blur-sm bg-card/60"><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Observaciones adicionales</CardTitle></CardHeader><CardContent><p className="text-sm text-foreground">{consultaDetalle.observaciones}</p></CardContent></Card>}
                    {consultaDetalle.proximaVisita && <div className="col-span-1 md:col-span-2 text-xs text-muted-foreground bg-[var(--status-info-muted)] border border-[var(--status-info-border)] text-[var(--status-info-foreground)] px-3 py-2 rounded-lg font-medium">Próxima visita agendada: {new Date(consultaDetalle.proximaVisita).toLocaleDateString("es-AR")}</div>}
                  </div>
                </div>
              )}

              {/* Tab: Datos */}
              {tabActiva === "datos" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="backdrop-blur-sm bg-card/60"><CardHeader className="pb-2 border-b"><CardTitle className="text-sm font-semibold text-foreground">Datos del Paciente</CardTitle></CardHeader><CardContent className="space-y-3 pt-3">
                    {[["Nombre", pacienteSeleccionado.nombre], ["Especie", pacienteSeleccionado.especie ?? "-"], ["Raza", pacienteSeleccionado.raza ?? "-"],
                      ["Sexo", pacienteSeleccionado.sexo ?? "-"], ["Peso histórico", pacienteSeleccionado.peso ? `${pacienteSeleccionado.peso} kg` : "-"],
                      ["Código de Chip", pacienteSeleccionado.chip ?? "-"]].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm border-b pb-1 last:border-0"><span className="text-muted-foreground">{label}</span><span className="font-semibold text-foreground">{value}</span></div>
                    ))}
                  </CardContent></Card>
                  <Card className="backdrop-blur-sm bg-card/60"><CardHeader className="pb-2 border-b"><CardTitle className="text-sm font-semibold text-foreground">Propietario / Cliente</CardTitle></CardHeader><CardContent className="space-y-3 pt-3">
                    {[["Nombre completo", pacienteSeleccionado.cliente.nombre], ["Teléfono de contacto", pacienteSeleccionado.cliente.telefono ?? "-"]].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm border-b pb-1 last:border-0"><span className="text-muted-foreground">{label}</span><span className="font-semibold text-foreground">{value}</span></div>
                    ))}
                  </CardContent></Card>
                  {pacienteSeleccionado.notas && (
                    <Card className="col-span-1 md:col-span-2 backdrop-blur-sm bg-card/60"><CardHeader className="pb-2 border-b"><CardTitle className="text-sm flex items-center gap-2 font-semibold text-foreground"><AlertCircle className="h-4 w-4 text-[var(--status-warning-foreground)]" />Alertas / Notas del paciente</CardTitle></CardHeader>
                    <CardContent className="pt-3"><p className="text-sm text-foreground">{pacienteSeleccionado.notas}</p></CardContent></Card>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Nuevo Paciente */}
      <Dialog open={modalNuevoPaciente} onOpenChange={setModalNuevoPaciente}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nuevo Paciente</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5"><Label>Nombre *</Label><Input value={formPaciente.nombre} onChange={e => setFormPaciente({ ...formPaciente, nombre: e.target.value })} placeholder="Rex, Mimi..." /></div>
            <div className="space-y-1.5"><Label>Especie</Label>
              <Select value={formPaciente.especie} onValueChange={v => setFormPaciente({ ...formPaciente, especie: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Canino">Canino</SelectItem><SelectItem value="Felino">Felino</SelectItem><SelectItem value="Ave">Ave</SelectItem><SelectItem value="Exotico">Exotico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Raza</Label><Input value={formPaciente.raza} onChange={e => setFormPaciente({ ...formPaciente, raza: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Sexo</Label>
              <Select value={formPaciente.sexo} onValueChange={v => setFormPaciente({ ...formPaciente, sexo: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Macho">Macho</SelectItem><SelectItem value="Hembra">Hembra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Fecha nac.</Label><Input type="date" value={formPaciente.fechaNac} onChange={e => setFormPaciente({ ...formPaciente, fechaNac: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Peso (kg)</Label><Input type="number" step="0.1" value={formPaciente.peso} onChange={e => setFormPaciente({ ...formPaciente, peso: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNuevoPaciente(false)}>Cancelar</Button>
            <Button onClick={guardarPaciente} disabled={!formPaciente.nombre}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nueva Consulta */}
      <Dialog open={modalNuevaConsulta} onOpenChange={setModalNuevaConsulta}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva Consulta — {pacienteSeleccionado?.nombre}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Motivo *</Label><Input value={formConsulta.motivo} onChange={e => setFormConsulta({ ...formConsulta, motivo: e.target.value })} placeholder="Control anual, vacunacion..." /></div>
            <div className="space-y-1.5"><Label>Peso (kg)</Label><Input type="number" step="0.1" value={formConsulta.peso} onChange={e => setFormConsulta({ ...formConsulta, peso: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Temperatura</Label><Input type="number" step="0.1" value={formConsulta.temperatura} onChange={e => setFormConsulta({ ...formConsulta, temperatura: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Diagnostico</Label><Textarea value={formConsulta.diagnostico} onChange={e => setFormConsulta({ ...formConsulta, diagnostico: e.target.value })} rows={2} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Tratamiento</Label><Textarea value={formConsulta.tratamiento} onChange={e => setFormConsulta({ ...formConsulta, tratamiento: e.target.value })} rows={2} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Observaciones</Label><Textarea value={formConsulta.observaciones} onChange={e => setFormConsulta({ ...formConsulta, observaciones: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNuevaConsulta(false)}>Cancelar</Button>
            <Button onClick={guardarConsulta} disabled={!formConsulta.motivo}>Guardar Consulta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
