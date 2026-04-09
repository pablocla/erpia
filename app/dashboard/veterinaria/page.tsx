"use client"

/**
 * MÓDULO VETERINARIA — Hub principal
 *
 * Activo para rubros: veterinaria, clínica (con mascota)
 * Maestros: Paciente (mascota) → Consulta (HC) → Plan sanitario (vacunas)
 * Flujos:
 *   1. Alta de mascota con datos del propietario (Cliente)
 *   2. Apertura de consulta → diagnóstico → tratamiento → próxima visita
 *   3. Registro de vacunas y desparasitaciones con recordatorio automático
 *   4. Venta de accesorios/alimentos en el mismo flujo (via POS)
 */

import { useState, useEffect, useCallback } from "react"
import { PawPrint, Plus, Search, HeartPulse, Calendar, Stethoscope, Edit, ChevronDown, ChevronUp, Weight, Thermometer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

// ─── TIPOS ─────────────────────────────────────────────────────────────────────

interface Paciente {
  id: number
  nombre: string
  especie?: string
  raza?: string
  sexo?: string
  fechaNac?: string
  peso?: number
  chip?: string
  notas?: string
  activo: boolean
  cliente: { id: number; nombre: string; telefono?: string }
  consultas: { fecha: string; motivo: string }[]
}

interface Consulta {
  id: number
  fecha: string
  motivo: string
  diagnostico?: string
  tratamiento?: string
  observaciones?: string
  peso?: number
  temperatura?: number
  proximaVisita?: string
  paciente: { id: number; nombre: string; especie?: string }
}

interface Cliente {
  id: number
  nombre: string
  telefono?: string
}

const ESPECIES = ["Canino", "Felino", "Aviario", "Equino", "Bovino", "Exótico", "Otro"]
const ESPECIE_EMOJI: Record<string, string> = {
  Canino: "🐕", Felino: "🐈", Aviario: "🦜", Equino: "🐴", Bovino: "🐄", Exótico: "🦎", Otro: "🐾",
}

function edad(fechaNac?: string) {
  if (!fechaNac) return null
  const meses = (Date.now() - new Date(fechaNac).getTime()) / (1000 * 60 * 60 * 24 * 30)
  if (meses < 24) return `${Math.floor(meses)} meses`
  return `${Math.floor(meses / 12)} años`
}

// ─── FORM NUEVO PACIENTE ───────────────────────────────────────────────────────

function DialogNuevoPaciente({
  open, onClose, onCreado,
}: { open: boolean; onClose: () => void; onCreado: () => void }) {
  const [form, setForm] = useState({
    nombre: "", clienteId: "", especie: "Canino", raza: "", sexo: "", fechaNac: "", peso: "", chip: "", notas: "",
  })
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  useEffect(() => {
    if (!open) return
    fetch("/api/clientes?limit=100", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((d) => setClientes(d.clientes ?? d))
      .catch(() => {})
  }, [open, token])

  const guardar = async () => {
    if (!form.nombre.trim()) { setError("El nombre es obligatorio"); return }
    if (!form.clienteId) { setError("Seleccioná el propietario"); return }
    setGuardando(true); setError("")
    try {
      const res = await fetch("/api/veterinaria/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          nombre: form.nombre,
          clienteId: parseInt(form.clienteId),
          especie: form.especie || undefined,
          raza: form.raza || undefined,
          sexo: form.sexo || undefined,
          fechaNac: form.fechaNac || undefined,
          peso: form.peso ? parseFloat(form.peso) : undefined,
          chip: form.chip || undefined,
          notas: form.notas || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Error al guardar"); return }
      onCreado()
      onClose()
      setForm({ nombre: "", clienteId: "", especie: "Canino", raza: "", sexo: "", fechaNac: "", peso: "", chip: "", notas: "" })
    } finally { setGuardando(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-teal-600" /> Nueva Mascota / Paciente
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Nombre *</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Rocky" />
            </div>
            <div className="space-y-1">
              <Label>Especie</Label>
              <Select value={form.especie} onValueChange={(v) => setForm({ ...form, especie: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ESPECIES.map((e) => <SelectItem key={e} value={e}>{ESPECIE_EMOJI[e]} {e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Propietario (Cliente) *</Label>
            <Select value={form.clienteId} onValueChange={(v) => setForm({ ...form, clienteId: v })}>
              <SelectTrigger><SelectValue placeholder="Seleccionar propietario..." /></SelectTrigger>
              <SelectContent>
                {clientes.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Raza</Label>
              <Input value={form.raza} onChange={(e) => setForm({ ...form, raza: e.target.value })} placeholder="Labrador..." />
            </div>
            <div className="space-y-1">
              <Label>Sexo</Label>
              <Select value={form.sexo} onValueChange={(v) => setForm({ ...form, sexo: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Macho</SelectItem>
                  <SelectItem value="H">Hembra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Fecha nac.</Label>
              <Input type="date" value={form.fechaNac} onChange={(e) => setForm({ ...form, fechaNac: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Peso (kg)</Label>
              <Input type="number" step="0.1" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} placeholder="12.5" />
            </div>
            <div className="space-y-1">
              <Label>Microchip</Label>
              <Input value={form.chip} onChange={(e) => setForm({ ...form, chip: e.target.value })} placeholder="985..." />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notas</Label>
            <Textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Alergias, condiciones previas..." className="h-20" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={guardando}>{guardando ? "Guardando..." : "Registrar Mascota"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── FORM NUEVA CONSULTA ───────────────────────────────────────────────────────

function DialogNuevaConsulta({
  open, paciente, onClose, onCreada,
}: { open: boolean; paciente: Paciente | null; onClose: () => void; onCreada: () => void }) {
  const [form, setForm] = useState({
    motivo: "", diagnostico: "", tratamiento: "", observaciones: "", peso: "", temperatura: "", proximaVisita: "",
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const guardar = async () => {
    if (!paciente || !form.motivo.trim()) { setError("El motivo es obligatorio"); return }
    setGuardando(true); setError("")
    try {
      const res = await fetch("/api/veterinaria/consultas", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          pacienteId: paciente.id,
          motivo: form.motivo,
          diagnostico: form.diagnostico || undefined,
          tratamiento: form.tratamiento || undefined,
          observaciones: form.observaciones || undefined,
          peso: form.peso ? parseFloat(form.peso) : undefined,
          temperatura: form.temperatura ? parseFloat(form.temperatura) : undefined,
          proximaVisita: form.proximaVisita || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Error al guardar"); return }
      onCreada()
      onClose()
      setForm({ motivo: "", diagnostico: "", tratamiento: "", observaciones: "", peso: "", temperatura: "", proximaVisita: "" })
    } finally { setGuardando(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            Nueva Consulta — {paciente?.nombre}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

          <div className="space-y-1">
            <Label>Motivo de consulta *</Label>
            <Input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Consulta de rutina, vacunación, herida..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="flex items-center gap-1"><Weight className="h-3 w-3" /> Peso actual (kg)</Label>
              <Input type="number" step="0.1" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} placeholder="12.5" />
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-1"><Thermometer className="h-3 w-3" /> Temperatura (°C)</Label>
              <Input type="number" step="0.1" value={form.temperatura} onChange={(e) => setForm({ ...form, temperatura: e.target.value })} placeholder="38.5" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Diagnóstico</Label>
            <Textarea value={form.diagnostico} onChange={(e) => setForm({ ...form, diagnostico: e.target.value })} placeholder="Diagnóstico clínico..." className="h-20" />
          </div>

          <div className="space-y-1">
            <Label>Tratamiento / Prescripción</Label>
            <Textarea value={form.tratamiento} onChange={(e) => setForm({ ...form, tratamiento: e.target.value })} placeholder="Medicamentos, dosis, frecuencia..." className="h-20" />
          </div>

          <div className="space-y-1">
            <Label>Observaciones</Label>
            <Textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} className="h-16" />
          </div>

          <div className="space-y-1">
            <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Próxima visita</Label>
            <Input type="date" value={form.proximaVisita} onChange={(e) => setForm({ ...form, proximaVisita: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={guardando}>{guardando ? "Guardando..." : "Registrar Consulta"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── CARD PACIENTE ─────────────────────────────────────────────────────────────

function PacienteCard({
  paciente,
  onNuevaConsulta,
}: { paciente: Paciente; onNuevaConsulta: (p: Paciente) => void }) {
  const [expandido, setExpandido] = useState(false)
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loadingConsultas, setLoadingConsultas] = useState(false)
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const cargarConsultas = useCallback(async () => {
    if (consultas.length > 0) return
    setLoadingConsultas(true)
    try {
      const res = await fetch(`/api/veterinaria/consultas?pacienteId=${paciente.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) setConsultas(await res.json())
    } finally { setLoadingConsultas(false) }
  }, [paciente.id, consultas.length, token])

  const toggleExpandir = () => {
    if (!expandido) cargarConsultas()
    setExpandido(!expandido)
  }

  const emoji = ESPECIE_EMOJI[paciente.especie || ""] || "🐾"
  const ultimaConsulta = paciente.consultas[0]

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl shrink-0">{emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold">{paciente.nombre}</h3>
                <p className="text-xs text-muted-foreground">
                  {paciente.especie} {paciente.raza ? `· ${paciente.raza}` : ""}
                  {paciente.sexo ? ` · ${paciente.sexo === "M" ? "Macho" : "Hembra"}` : ""}
                  {paciente.fechaNac ? ` · ${edad(paciente.fechaNac)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onNuevaConsulta(paciente)}>
                  <Stethoscope className="h-3 w-3" /> Consulta
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={toggleExpandir}>
                  {expandido ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>👤 {paciente.cliente.nombre}</span>
              {paciente.peso && <span><Weight className="inline h-3 w-3 mr-0.5" />{paciente.peso}kg</span>}
              {paciente.chip && <span className="font-mono">🔖 {paciente.chip.substring(0, 8)}…</span>}
            </div>
            {ultimaConsulta && (
              <p className="text-xs text-muted-foreground mt-1">
                Última consulta: {new Date(ultimaConsulta.fecha).toLocaleDateString("es-AR")} — {ultimaConsulta.motivo}
              </p>
            )}
          </div>
        </div>

        {expandido && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Historia Clínica</p>
            {loadingConsultas ? (
              <p className="text-xs text-muted-foreground">Cargando...</p>
            ) : consultas.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin consultas registradas</p>
            ) : (
              <div className="space-y-3">
                {consultas.map((c) => (
                  <div key={c.id} className="rounded-lg border p-3 bg-muted/30">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-medium">{c.motivo}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(c.fecha).toLocaleDateString("es-AR")}</p>
                    </div>
                    {c.diagnostico && <p className="text-xs text-muted-foreground mt-1">Dx: {c.diagnostico}</p>}
                    {c.tratamiento && <p className="text-xs text-muted-foreground">Trat: {c.tratamiento}</p>}
                    {c.proximaVisita && (
                      <Badge variant="secondary" className="mt-1 text-[10px]">
                        Próx: {new Date(c.proximaVisita).toLocaleDateString("es-AR")}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────────

export default function VeterinariaPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [dialogPaciente, setDialogPaciente] = useState(false)
  const [dialogConsulta, setDialogConsulta] = useState(false)
  const [pacienteConsulta, setPacienteConsulta] = useState<Paciente | null>(null)
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const fetchPacientes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      const res = await fetch(`/api/veterinaria/pacientes?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) setPacientes(await res.json())
    } finally { setLoading(false) }
  }, [search, token])

  useEffect(() => {
    const t = setTimeout(fetchPacientes, 300)
    return () => clearTimeout(t)
  }, [fetchPacientes])

  const abrirConsulta = (p: Paciente) => { setPacienteConsulta(p); setDialogConsulta(true) }

  const totalPorEspecie = pacientes.reduce<Record<string, number>>((acc, p) => {
    const esp = p.especie || "Otro"
    acc[esp] = (acc[esp] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PawPrint className="h-6 w-6 text-teal-600" />
            Veterinaria
          </h1>
          <p className="text-muted-foreground text-sm">Historia clínica y gestión de pacientes / mascotas</p>
        </div>
        <Button onClick={() => setDialogPaciente(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Mascota
        </Button>
      </div>

      {/* KPIs */}
      <div className="flex flex-wrap gap-3">
        <Card className="flex-1 min-w-28">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total pacientes</p>
            <p className="text-2xl font-bold text-teal-600">{pacientes.length}</p>
          </CardContent>
        </Card>
        {Object.entries(totalPorEspecie).slice(0, 4).map(([esp, count]) => (
          <Card key={esp} className="flex-1 min-w-24">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{ESPECIE_EMOJI[esp]} {esp}</p>
              <p className="text-2xl font-bold">{count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nombre, raza, propietario o chip..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : pacientes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <PawPrint className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No hay mascotas registradas</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => setDialogPaciente(true)}>
            <Plus className="h-4 w-4" /> Registrar primera mascota
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {pacientes.map((p) => (
            <PacienteCard key={p.id} paciente={p} onNuevaConsulta={abrirConsulta} />
          ))}
        </div>
      )}

      <DialogNuevoPaciente open={dialogPaciente} onClose={() => setDialogPaciente(false)} onCreado={fetchPacientes} />
      <DialogNuevaConsulta open={dialogConsulta} paciente={pacienteConsulta} onClose={() => setDialogConsulta(false)} onCreada={fetchPacientes} />
    </div>
  )
}
