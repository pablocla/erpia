"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, Plus, MessageSquare, Scissors, User, CheckCircle2, XCircle, Settings } from "lucide-react"

type EstadoTurno = "confirmado" | "pendiente" | "cancelado" | "completado"

interface Profesional {
  id: number
  nombre: string
  especialidad: string | null
}

interface Turno {
  id: number
  fecha: string
  horaInicio: string
  horaFin: string
  estado: EstadoTurno
  motivo: string | null
  profesional: { id: number; nombre: string; especialidad: string | null }
  cliente: { id: number; nombre: string; telefono: string | null } | null
}

const FECHAS = [0, 1, 2]
const LABELS = ["Hoy", "Mañana", "Pasado mañana"]
const HORARIOS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"]

const ESTADO_CONFIG: Record<EstadoTurno, { label: string; color: string }> = {
  confirmado: { label: "Confirmado", color: "bg-emerald-100 text-emerald-900" },
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-900" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-900" },
  completado: { label: "Completado", color: "bg-slate-100 text-slate-900" },
}

function formatDate(offset: number) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().split("T")[0]
}

export default function PeluqueriaMobilePage() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ horaInicio: "09:00", motivo: "", profesionalId: "", telefono: "" })
  const { toast } = useToast()

  const loadAgenda = useCallback(async () => {
    setLoading(true)
    try {
      const fecha = formatDate(selectedDay)
      const res = await fetch(`/api/agenda?fecha=${fecha}`)
      if (!res.ok) return
      const data = await res.json()
      setTurnos(data.turnos ?? [])
      setProfesionales(data.profesionales ?? [])
    } catch {
      setTurnos([])
      setProfesionales([])
    } finally {
      setLoading(false)
    }
  }, [selectedDay])

  useEffect(() => { void loadAgenda() }, [loadAgenda])

  const getTurnosForDay = () => turnos

  const handleCreateTurno = async () => {
    if (!form.motivo || !form.profesionalId) {
      toast({ title: "Completa los datos", description: "El motivo y el profesional son obligatorios.", variant: "destructive" })
      return
    }
    try {
      const duracion = 30
      const [h, m] = form.horaInicio.split(":").map(Number)
      const total = h * 60 + m + duracion
      const horaFin = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
      const res = await fetch("/api/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: formatDate(selectedDay),
          horaInicio: form.horaInicio,
          horaFin,
          profesionalId: Number(form.profesionalId),
          motivo: form.motivo,
          notas: form.telefono ? `Tel: ${form.telefono}` : undefined,
        }),
      })
      if (res.ok) {
        toast({ title: "Turno agendado", description: "El turno se guardó correctamente." })
        setDialogOpen(false)
        setForm({ horaInicio: "09:00", motivo: "", profesionalId: "", telefono: "" })
        void loadAgenda()
      } else {
        const error = await res.json().catch(() => ({}))
        toast({ title: "Error al agendar", description: error.error ?? "No se pudo guardar el turno.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "No se pudo conectar con el servidor.", variant: "destructive" })
    }
  }

  const enviarWhatsApp = (telefono: string, turno: Turno) => {
    const numero = telefono.replace(/\D/g, "")
    if (!numero) {
      toast({ title: "Teléfono inválido", description: "No se puede enviar WhatsApp con este número.", variant: "destructive" })
      return
    }
    const texto = encodeURIComponent(`Hola ${turno.cliente?.nombre ?? "client"}, te confirmo tu turno para ${turno.motivo ?? "servicio"} el ${formatDate(selectedDay)} a las ${turno.horaInicio}.`) 
    window.open(`https://wa.me/${numero}?text=${texto}`, "_blank")
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <Scissors className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Peluquería móvil</p>
            <h1 className="text-2xl font-bold">Todo desde el celular</h1>
            <p className="text-sm text-muted-foreground">Gestioná turnos, profesionales y confirmaciones sin necesidad de PC.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {FECHAS.map((offset, index) => (
            <button
              key={offset}
              type="button"
              onClick={() => setSelectedDay(offset)}
              className={`rounded-2xl p-3 text-left transition ${selectedDay === offset ? "bg-primary text-primary-foreground" : "bg-muted/30 text-foreground"}`}
            >
              <p className="text-xs uppercase tracking-[0.15em]">{LABELS[index]}</p>
              <p className="font-semibold">{formatDate(offset)}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Acciones rápidas</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/agenda">
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="h-4 w-4 mr-2" /> Ver agenda completa
              </Button>
            </Link>
            <Button className="w-full justify-start" variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" /> Enviar WhatsApp de cita
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Próximos turnos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Spinner className="h-6 w-6" /></div>
            ) : getTurnosForDay().length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay turnos para este día.</p>
            ) : (
              getTurnosForDay().slice(0, 5).map((turno) => (
                <div key={turno.id} className="rounded-2xl border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{turno.cliente?.nombre ?? "Cliente sin nombre"}</p>
                      <p className="text-sm text-muted-foreground">{turno.horaInicio} - {turno.horaFin}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {turno.cliente?.telefono ? (
                        <Button variant="outline" size="sm" className="h-7" onClick={() => enviarWhatsApp(turno.cliente!.telefono, turno)}>
                          <MessageSquare className="h-3.5 w-3.5 mr-1" />
                          WhatsApp
                        </Button>
                      ) : null}
                      <Badge className={ESTADO_CONFIG[turno.estado].color}>{ESTADO_CONFIG[turno.estado].label}</Badge>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{turno.motivo ?? "Sin servicio"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Profesional: {turno.profesional.nombre}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Servicios disponibles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Usá esta pantalla para cargar y ver turnos rápidos cuando no haya computadora.</p>
          <div className="grid gap-2">
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Agendar desde el celular
            </Button>
            <Link href="/dashboard/configuracion">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" /> Configuración de peluquería
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo turno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Servicio *</Label>
              <Input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Corte, tinte, peinado..." />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Profesional *</Label>
                <Select value={form.profesionalId} onValueChange={(value) => setForm({ ...form, profesionalId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elegir profesional" />
                  </SelectTrigger>
                  <SelectContent>
                    {profesionales.map((prof) => (
                      <SelectItem key={prof.id} value={String(prof.id)}>{prof.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Select value={form.horaInicio} onValueChange={(value) => setForm({ ...form, horaInicio: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HORARIOS.map((hora) => (
                      <SelectItem key={hora} value={hora}>{hora}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="Ej: 11 1234 5678" />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleCreateTurno}>
                <Plus className="h-4 w-4 mr-2" /> Guardar turno
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                <XCircle className="h-4 w-4 mr-2" /> Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
