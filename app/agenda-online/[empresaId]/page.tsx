"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

interface Profesional {
  id: number
  nombre: string
  especialidad: string | null
  color: string | null
}

interface EmpresaPublicaResponse {
  success: boolean
  empresa: { id: number; nombre: string }
  profesionales: Profesional[]
  servicios: Array<{ id: number; nombre: string; duracionMinutos: number }>
  disponibilidad?: Array<{ profesionalId: number; horarios: string[] }>
}

interface PageProps {
  params: { empresaId: string }
}

const FECHA_FORMATO = new Intl.DateTimeFormat("es-AR", { year: "numeric", month: "2-digit", day: "2-digit" })

export default function AgendaOnlinePage({ params }: PageProps) {
  const empresaId = params.empresaId
  const [empresaName, setEmpresaName] = useState<string>("")
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [servicios, setServicios] = useState<Array<{ id: number; nombre: string; duracionMinutos: number }>>([])
  const [servicioId, setServicioId] = useState<string>("")
  const [profesionalId, setProfesionalId] = useState<string>("")
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split("T")[0])
  const [horarios, setHorarios] = useState<string[]>([])
  const [horaSeleccionada, setHoraSeleccionada] = useState<string>("")
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [email, setEmail] = useState("")
  const [notas, setNotas] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  const profesionalSeleccionado = useMemo(
    () => profesionales.find((item) => String(item.id) === profesionalId),
    [profesionales, profesionalId],
  )

  const loadDisponibilidad = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/agenda-publica/${empresaId}?fecha=${fecha}${profesionalId ? `&profesionalId=${profesionalId}` : ""}${servicioId ? `&servicioId=${servicioId}` : ""}`)
      if (!res.ok) {
        throw new Error("No se pudo cargar la agenda pública")
      }
      const data = (await res.json()) as EmpresaPublicaResponse
      if (!data.success) {
        throw new Error("Respuesta inválida")
      }
      setEmpresaName(data.empresa.nombre)
      setProfesionales(data.profesionales)
      setServicios(data.servicios)
      setHorarios(data.disponibilidad?.[0]?.horarios ?? [])
      if (profesionalId && data.disponibilidad?.length === 0) {
        setHorarios([])
      }
    } catch (error) {
      console.error(error)
      setHorarios([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDisponibilidad()
  }, [empresaId])

  useEffect(() => {
    if (!fecha || !profesionalId) return
    void loadDisponibilidad()
  }, [fecha, profesionalId, servicioId])

  const handleSubmit = async () => {
    if (!nombre || !telefono || !profesionalId || !fecha || !horaSeleccionada) {
      return toast({ title: "Completa los datos", description: "Por favor completá todos los campos obligatorios.", variant: "destructive" })
    }

    setSubmitting(true)
    try {
      const servicioSeleccionado = servicios.find((s) => String(s.id) === servicioId)
      const durationMinutos = servicioSeleccionado?.duracionMinutos ?? 30
      const horaInicio = horaSeleccionada
      const [hora, minutos] = horaSeleccionada.split(":").map(Number)
      const totalMinutos = hora * 60 + minutos + durationMinutos
      const horaFin = `${String(Math.floor(totalMinutos / 60)).padStart(2, "0")}:${String(totalMinutos % 60).padStart(2, "0")}`
      const res = await fetch(`/api/agenda-publica/${empresaId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          telefono,
          email: email || undefined,
          profesionalId: Number(profesionalId),
          servicioId: servicioSeleccionado?.id,
          fecha,
          horaInicio,
          horaFin,
          notas: notas || undefined,
        }),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || "No se pudo reservar el turno")
      }
      setMensajeExito("Turno reservado con éxito. Te contactaremos para confirmarlo.")
      setNombre("")
      setTelefono("")
      setEmail("")
      setNotas("")
      setHoraSeleccionada("")
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : "Error al reservar el turno"
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Reserva online</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Reservá tu turno en {empresaName || "el comercio"} de forma rápida y sin entrar al panel.</p>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="profesional">Profesional</Label>
              <Select onValueChange={setProfesionalId} value={profesionalId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elegí un profesional" />
                </SelectTrigger>
                <SelectContent>
                  {profesionales.map((prof) => (
                    <SelectItem key={prof.id} value={String(prof.id)}>
                      {prof.nombre} {prof.especialidad ? `· ${prof.especialidad}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="servicio">Servicio</Label>
              <Select value={servicioId} onValueChange={setServicioId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Duración estándar (30 min)</SelectItem>
                  {servicios.map((servicio) => (
                    <SelectItem key={servicio.id} value={String(servicio.id)}>
                      {servicio.nombre} · {servicio.duracionMinutos} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Horario disponible</Label>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando horarios...</p>
            ) : horarios.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {horarios.map((hora) => (
                  <button
                    key={hora}
                    type="button"
                    className={`rounded-md border px-3 py-2 text-sm ${horaSeleccionada === hora ? "border-brand bg-brand text-white" : "border-border bg-background"}`}
                    onClick={() => setHoraSeleccionada(hora)}
                  >
                    {hora}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay horarios disponibles para la fecha seleccionada.</p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" value={nombre} onChange={(event) => setNombre(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" value={telefono} onChange={(event) => setTelefono(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email (opcional)</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="notas">Notas</Label>
              <Textarea id="notas" value={notas} onChange={(event) => setNotas(event.target.value)} rows={4} />
            </div>
          </div>

          {mensajeExito ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{mensajeExito}</p> : null}

          <Button disabled={submitting || !profesionalId || !horaSeleccionada} onClick={handleSubmit}>
            {submitting ? "Reservando..." : "Reservar turno"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
