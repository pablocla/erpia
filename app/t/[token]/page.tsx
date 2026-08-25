"use client"

import { useEffect, useState, use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, MapPin, Phone, User, CalendarX2, CheckCircle2, AlertTriangle, Building2, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface TurnoPublico {
  id: number
  fecha: string
  horaInicio: string
  estado: string
  empresa: {
    nombreFantasia: string
    logoUrl: string | null
    telefono: string | null
  }
  profesional: {
    nombre: string
    especialidad: string | null
  }
  servicio: {
    nombre: string
  } | null
  cliente: {
    nombre: string
  } | null
}

export default function TurnoPublicoPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const [turno, setTurno] = useState<TurnoPublico | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [cancelando, setCancelando] = useState(false)
  const [cancelado, setCancelado] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const fetchTurno = async () => {
      try {
        const res = await fetch(`/api/t/${token}`)
        if (!res.ok) {
          const errData = await res.json()
          setError(errData.error || "No se pudo cargar el turno.")
          return
        }
        const data = await res.json()
        setTurno(data)
        if (data.estado === "cancelado") {
          setCancelado(true)
        }
      } catch (e) {
        setError("Error de conexión.")
      } finally {
        setLoading(false)
      }
    }
    fetchTurno()
  }, [token])

  const handleCancelar = async () => {
    setCancelando(true)
    try {
      const res = await fetch(`/api/t/${token}/cancelar`, {
        method: "POST",
      })
      if (!res.ok) {
        const errData = await res.json()
        alert(errData.error || "No se pudo cancelar el turno.")
        return
      }
      setCancelado(true)
      setDialogOpen(false)
      if (turno) {
        setTurno({ ...turno, estado: "cancelado" })
      }
    } catch (e) {
      alert("Error al intentar cancelar el turno.")
    } finally {
      setCancelando(false)
    }
  }

  const contactarWhatsApp = () => {
    if (!turno?.empresa.telefono) return
    const tel = turno.empresa.telefono.replace(/\D/g, '')
    const msg = encodeURIComponent(`Hola, me gustaría reprogramar mi turno del ${new Date(turno.fecha).toLocaleDateString('es-AR')}.`)
    window.open(`https://wa.me/${tel}?text=${msg}`, "_blank")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">Cargando tu turno...</p>
        </div>
      </div>
    )
  }

  if (error || !turno) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md shadow-lg border-destructive/20">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Enlace no válido</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>{error || "No pudimos encontrar el turno. Es posible que el enlace haya expirado o sea incorrecto."}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fechaFormateada = new Date(turno.fecha).toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  
  // Capitalize first letter of fecha
  const fechaCapitalizada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1)

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4 flex flex-col items-center selection:bg-primary/20">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header / Brand */}
        <div className="text-center space-y-2">
          {turno.empresa.logoUrl ? (
            <img src={turno.empresa.logoUrl} alt={turno.empresa.nombreFantasia} className="h-16 mx-auto object-contain drop-shadow-sm" />
          ) : (
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center ring-1 ring-primary/20">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
          )}
          <h1 className="text-xl font-bold tracking-tight text-foreground/90">
            {turno.empresa.nombreFantasia}
          </h1>
        </div>

        <AnimatePresence mode="wait">
          {cancelado ? (
            <motion.div
              key="cancelado"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full"
            >
              <Card className="border-destructive/20 bg-destructive/5 shadow-sm overflow-hidden">
                <div className="h-1 bg-destructive" />
                <CardHeader className="text-center pb-2 pt-6">
                  <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4 ring-8 ring-destructive/5">
                    <CalendarX2 className="w-8 h-8 text-destructive" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-destructive">Turno Cancelado</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4 pb-6">
                  <p className="text-muted-foreground">
                    Tu turno con <strong className="text-foreground">{turno.profesional.nombre}</strong> ha sido cancelado exitosamente. La franja horaria ha sido liberada.
                  </p>
                  
                  {turno.empresa.telefono && (
                    <Button onClick={contactarWhatsApp} variant="outline" className="w-full mt-4 bg-background h-12 rounded-xl">
                      <Phone className="w-4 h-4 mr-2 text-green-600" />
                      Contactar para nuevo turno
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="activo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <Card className="shadow-xl border-primary/10 bg-card overflow-hidden">
                <div className="bg-primary/5 border-b border-primary/10 px-6 py-4 flex items-center gap-3">
                  <div className="bg-primary/20 p-2 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-primary">Turno Agendado</h2>
                    <p className="text-xs text-muted-foreground">Detalles de tu reserva</p>
                  </div>
                </div>
                
                <CardContent className="p-6 space-y-6">
                  {/* Fecha y Hora (Destacado) */}
                  <div className="bg-muted/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 border border-border/50 shadow-inner">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">{fechaCapitalizada}</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <Clock className="w-5 h-5" />
                      <span className="text-4xl font-black tracking-tighter">{turno.horaInicio}</span>
                    </div>
                  </div>

                  {/* Detalles */}
                  <div className="space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">{turno.profesional.nombre}</p>
                        {turno.profesional.especialidad && (
                          <p className="text-muted-foreground">{turno.profesional.especialidad}</p>
                        )}
                      </div>
                    </div>
                    
                    {turno.servicio && (
                      <div className="flex items-start gap-3">
                        <HelpCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Servicio</p>
                          <p className="text-muted-foreground">{turno.servicio.nombre}</p>
                        </div>
                      </div>
                    )}
                    
                    {turno.cliente && (
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">A nombre de</p>
                          <p className="text-muted-foreground">{turno.cliente.nombre}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="bg-muted/20 border-t border-border/50 p-6 flex flex-col gap-3">
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full h-12 rounded-xl text-base shadow-sm hover:shadow-md transition-all">
                        Cancelar mi Turno
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-2xl">
                      <DialogHeader>
                        <DialogTitle>¿Cancelar tu turno?</DialogTitle>
                        <DialogDescription>
                          Al confirmar, perderás tu reserva para el {fechaFormateada} a las {turno.horaInicio}hs.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Alert className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/50 dark:border-amber-900/50 dark:text-amber-200">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Atención</AlertTitle>
                        <AlertDescription>
                          Esta acción no se puede deshacer. Liberaremos este horario para otro paciente/cliente.
                        </AlertDescription>
                      </Alert>

                      <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={cancelando} className="rounded-xl">
                          Mantener Turno
                        </Button>
                        <Button variant="destructive" onClick={handleCancelar} disabled={cancelando} className="rounded-xl">
                          {cancelando ? "Cancelando..." : "Sí, quiero cancelar"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  {turno.empresa.telefono && (
                    <Button variant="outline" onClick={contactarWhatsApp} className="w-full h-12 rounded-xl text-muted-foreground hover:text-foreground">
                      <Phone className="w-4 h-4 mr-2" />
                      Necesito Reprogramar
                    </Button>
                  )}
                  
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    Desarrollado con Claver Cloud
                  </p>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
