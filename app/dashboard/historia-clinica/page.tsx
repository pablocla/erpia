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
  Weight, ClipboardList,
} from "lucide-react"
import { cn } from "@/lib/utils"

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
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Panel izquierdo - lista de pacientes */}
      <div className="w-80 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-pink-500" />
            <h1 className="text-lg font-bold">Historia Clinica</h1>
          </div>
          <Button size="sm" onClick={() => setModalNuevoPaciente(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />Nuevo
          </Button>
        </div>

        {/* KPI pills */}
        <div className="flex gap-2 text-xs">
          <Badge variant="secondary">{resumen.totalPacientes} pacientes</Badge>
          <Badge variant="secondary">{resumen.totalConsultas} consultas</Badge>
          <Badge variant="outline">{resumen.activos} activos</Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar paciente o duenio..." className="pl-9 h-9 text-sm" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {pacientes.map(paciente => {
            const Icon = ESPECIES_ICONS[paciente.especie ?? ""] ?? HeartPulse
            const isSelected = pacienteSeleccionado?.id === paciente.id
            return (
              <div key={paciente.id} onClick={() => { setPacienteSeleccionado(paciente); setTabActiva("consultas"); setConsultaDetalle(null) }}
                className={cn("p-3 rounded-lg border cursor-pointer transition-colors", isSelected ? "bg-pink-50 border-pink-300 dark:bg-pink-950/30 dark:border-pink-800" : "hover:bg-muted/50")}>
                <div className="flex items-start gap-2.5">
                  <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                    paciente.especie === "Canino" ? "bg-amber-100 text-amber-600" : paciente.especie === "Felino" ? "bg-purple-100 text-purple-600" : "bg-sky-100 text-sky-600")}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{paciente.nombre}</p>
                    <p className="text-xs text-muted-foreground truncate">{paciente.raza ?? paciente.especie} {paciente.sexo ? `\u00b7 ${paciente.sexo}` : ""}</p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5"><User className="h-3 w-3" />{paciente.cliente.nombre}</p>
                  </div>
                  <Badge variant={paciente.activo ? "default" : "secondary"} className="text-[10px] h-4 px-1 shrink-0">{paciente.activo ? "activo" : "inactivo"}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 pl-11">{paciente._count.consultas} consultas</p>
              </div>
            )
          })}
          {pacientes.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">No se encontraron pacientes</div>}
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 overflow-auto">
        {!pacienteSeleccionado ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <HeartPulse className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm">Selecciona un paciente para ver su historia clinica</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header del paciente */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn("h-16 w-16 rounded-full flex items-center justify-center shrink-0",
                    pacienteSeleccionado.especie === "Canino" ? "bg-amber-100 text-amber-600" : pacienteSeleccionado.especie === "Felino" ? "bg-purple-100 text-purple-600" : "bg-sky-100 text-sky-600")}>
                    {React.createElement(ESPECIES_ICONS[pacienteSeleccionado.especie ?? ""] ?? HeartPulse, { className: "h-8 w-8" })}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-bold">{pacienteSeleccionado.nombre}</h2>
                        <p className="text-sm text-muted-foreground">{pacienteSeleccionado.especie} {pacienteSeleccionado.raza ? `\u00b7 ${pacienteSeleccionado.raza}` : ""} {pacienteSeleccionado.sexo ? `\u00b7 ${pacienteSeleccionado.sexo}` : ""}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setModalNuevaConsulta(true)}><Stethoscope className="h-3.5 w-3.5 mr-1" />Nueva Consulta</Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-sm"><Weight className="h-4 w-4 text-muted-foreground" /><span>{pacienteSeleccionado.peso ? `${pacienteSeleccionado.peso} kg` : "-"}</span></div>
                      <div className="flex items-center gap-1.5 text-sm"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{pacienteSeleccionado.fechaNac ? new Date(pacienteSeleccionado.fechaNac).toLocaleDateString("es-AR") : "-"}</span></div>
                      <div className="flex items-center gap-1.5 text-sm"><User className="h-4 w-4 text-muted-foreground" /><span className="truncate">{pacienteSeleccionado.cliente.nombre}</span></div>
                      <div className="flex items-center gap-1.5 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{pacienteSeleccionado.cliente.telefono ?? "-"}</span></div>
                    </div>
                    {pacienteSeleccionado.chip && <p className="text-xs text-muted-foreground mt-2">Chip: {pacienteSeleccionado.chip}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <div className="flex gap-1 border-b">
              {(["consultas", "datos"] as const).map(tab => (
                <button key={tab} onClick={() => { setTabActiva(tab); setConsultaDetalle(null) }}
                  className={cn("px-4 py-2 text-sm font-medium capitalize transition-colors", tabActiva === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground")}>
                  {tab === "consultas" ? "Consultas" : "Datos del Paciente"}
                </button>
              ))}
            </div>

            {/* Tab: Consultas list */}
            {tabActiva === "consultas" && !consultaDetalle && (
              <div className="space-y-3">
                {pacienteSeleccionado.consultas.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground"><ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No hay consultas registradas</p></div>
                )}
                {pacienteSeleccionado.consultas.map(consulta => (
                  <Card key={consulta.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setConsultaDetalle(consulta)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-green-100 text-green-600"><Stethoscope className="h-4 w-4" /></div>
                          <div>
                            <p className="font-semibold text-sm">{consulta.motivo}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{new Date(consulta.fecha).toLocaleDateString("es-AR")}</p>
                            {consulta.diagnostico && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">Dx: {consulta.diagnostico}</p>}
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
                <Button variant="ghost" size="sm" onClick={() => setConsultaDetalle(null)}>{"\u2190"} Volver</Button>
                <div className="grid grid-cols-2 gap-4">
                  <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Motivo</CardTitle></CardHeader><CardContent><p className="text-sm">{consultaDetalle.motivo}</p></CardContent></Card>
                  <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Signos Vitales</CardTitle></CardHeader><CardContent className="space-y-1.5">
                    {consultaDetalle.peso && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Peso</span><span className="font-medium">{consultaDetalle.peso} kg</span></div>}
                    {consultaDetalle.temperatura && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Temperatura</span><span className="font-medium">{consultaDetalle.temperatura} C</span></div>}
                  </CardContent></Card>
                  {consultaDetalle.diagnostico && <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Diagnostico</CardTitle></CardHeader><CardContent><p className="text-sm">{consultaDetalle.diagnostico}</p></CardContent></Card>}
                  {consultaDetalle.tratamiento && <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tratamiento</CardTitle></CardHeader><CardContent><p className="text-sm">{consultaDetalle.tratamiento}</p></CardContent></Card>}
                  {consultaDetalle.observaciones && <Card className="col-span-2"><CardHeader className="pb-2"><CardTitle className="text-sm">Observaciones</CardTitle></CardHeader><CardContent><p className="text-sm">{consultaDetalle.observaciones}</p></CardContent></Card>}
                  {consultaDetalle.proximaVisita && <div className="col-span-2 text-xs text-muted-foreground">Proxima visita: {new Date(consultaDetalle.proximaVisita).toLocaleDateString("es-AR")}</div>}
                </div>
              </div>
            )}

            {/* Tab: Datos */}
            {tabActiva === "datos" && (
              <div className="grid grid-cols-2 gap-4">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Datos del Paciente</CardTitle></CardHeader><CardContent className="space-y-2">
                  {[["Nombre", pacienteSeleccionado.nombre], ["Especie", pacienteSeleccionado.especie ?? "-"], ["Raza", pacienteSeleccionado.raza ?? "-"],
                    ["Sexo", pacienteSeleccionado.sexo ?? "-"], ["Peso", pacienteSeleccionado.peso ? `${pacienteSeleccionado.peso} kg` : "-"],
                    ["Chip", pacienteSeleccionado.chip ?? "-"]].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm border-b pb-1 last:border-0"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>
                  ))}
                </CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Propietario</CardTitle></CardHeader><CardContent className="space-y-2">
                  {[["Nombre", pacienteSeleccionado.cliente.nombre], ["Telefono", pacienteSeleccionado.cliente.telefono ?? "-"]].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm border-b pb-1 last:border-0"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>
                  ))}
                </CardContent></Card>
                {pacienteSeleccionado.notas && (
                  <Card className="col-span-2"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4" />Notas</CardTitle></CardHeader>
                  <CardContent><p className="text-sm">{pacienteSeleccionado.notas}</p></CardContent></Card>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Nuevo Paciente */}
      <Dialog open={modalNuevoPaciente} onOpenChange={setModalNuevoPaciente}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nuevo Paciente</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5"><Label>Nombre *</Label><Input value={formPaciente.nombre} onChange={e => setFormPaciente({ ...formPaciente, nombre: e.target.value })} placeholder="Rex, Mimi..." /></div>
            <div className="space-y-1.5"><Label>Especie</Label>
              <Select value={formPaciente.especie} onValueChange={v => setFormPaciente({ ...formPaciente, especie: v })}><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent>
                <SelectItem value="Canino">Canino</SelectItem><SelectItem value="Felino">Felino</SelectItem><SelectItem value="Ave">Ave</SelectItem><SelectItem value="Exotico">Exotico</SelectItem>
              </SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Raza</Label><Input value={formPaciente.raza} onChange={e => setFormPaciente({ ...formPaciente, raza: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Sexo</Label>
              <Select value={formPaciente.sexo} onValueChange={v => setFormPaciente({ ...formPaciente, sexo: v })}><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent>
                <SelectItem value="Macho">Macho</SelectItem><SelectItem value="Hembra">Hembra</SelectItem>
              </SelectContent></Select></div>
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
          <DialogHeader><DialogTitle>Nueva Consulta {"\u2014"} {pacienteSeleccionado?.nombre}</DialogTitle></DialogHeader>
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
    </div>
  )
}
