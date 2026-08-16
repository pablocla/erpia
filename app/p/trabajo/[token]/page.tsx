"use client"

import { useEffect, useState, use } from "react"
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  Phone,
  DollarSign,
  Star,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

export default function PortalClienteTrabajoPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const { toast } = useToast()

  const [trabajo, setTrabajo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<string>("recomendado")
  const [aprobando, setAprobando] = useState(false)
  const [calificacion, setCalificacion] = useState<number>(5)
  const [comentario, setComentario] = useState("")
  const [enviandoResena, setEnviandoResena] = useState(false)

  async function cargarTrabajo() {
    setLoading(true)
    try {
      // Si viene con ?pago=exitoso de Mercado Pago, registrar seña pagada
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get("pago") === "exitoso") {
        await fetch(`/api/oficios/publico/${resolvedParams.token}/aprobar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ opcionElegida: opcionSeleccionada }),
        })
      }

      const res = await fetch(`/api/oficios/publico/${resolvedParams.token}`)
      if (res.ok) {
        const json = await res.json()
        setTrabajo(json.data)
        if (json.data.opcionElegida) {
          setOpcionSeleccionada(json.data.opcionElegida)
        }
      }
    } catch (e) {
      toast({ title: "No se pudo cargar el presupuesto", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function iniciarPagoMercadoPago() {
    try {
      toast({ title: "Conectando con Mercado Pago...", description: "Generando link de pago seguro." })
      const res = await fetch(`/api/oficios/publico/${resolvedParams.token}/pagar-sena`, {
        method: "POST",
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data?.initPoint) {
          window.location.href = json.data.initPoint
        }
      }
    } catch (e) {
      toast({ title: "Error al iniciar pago", variant: "destructive" })
    }
  }

  useEffect(() => {
    cargarTrabajo()
  }, [resolvedParams.token])

  async function aprobarPresupuesto() {
    setAprobando(true)
    try {
      const res = await fetch(`/api/oficios/publico/${resolvedParams.token}/aprobar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opcionElegida: opcionSeleccionada,
        }),
      })

      if (res.ok) {
        toast({
          title: "¡Presupuesto aceptado!",
          description: "Ahora podés pagar la seña de forma segura.",
        })
        cargarTrabajo()
      }
    } catch (e) {
      toast({ title: "Error al aprobar", variant: "destructive" })
    } finally {
      setAprobando(false)
    }
  }

  async function enviarCalificacion() {
    setEnviandoResena(true)
    try {
      const res = await fetch(`/api/oficios/publico/${resolvedParams.token}/calificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estrellas: calificacion,
          comentario,
        }),
      })

      if (res.ok) {
        toast({ title: "¡Gracias por tu reseña!", description: "Tu opinión nos ayuda a seguir mejorando." })
        cargarTrabajo()
      }
    } catch (e) {
      toast({ title: "Error al enviar reseña", variant: "destructive" })
    } finally {
      setEnviandoResena(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Cargando presupuesto...</p>
        </div>
      </div>
    )
  }

  if (!trabajo) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-3">
          <h2 className="text-xl font-bold">Presupuesto no disponible</h2>
          <p className="text-sm text-muted-foreground">
            El enlace ingresado no es válido o ha expirado. Por favor, contactá a tu profesional.
          </p>
        </Card>
      </div>
    )
  }

  const opcionesRaw = trabajo.opcionesPresupuesto?.opciones || []
  const montoSeña = (Number(trabajo.montoAcordado || 0) * (trabajo.porcentajeSena || 30)) / 100

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 pb-20">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Cabecera del Profesional / Empresa */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold px-3 py-1">
              Presupuesto Digital #{trabajo.numero}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(trabajo.createdAt).toLocaleDateString("es-AR")}
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{trabajo.titulo}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Preparado para: <span className="font-semibold text-foreground">{trabajo.cliente?.nombre || "Estimado Cliente"}</span>
            </p>
          </div>

          <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <span>{trabajo.empresa?.razonSocial || trabajo.empresa?.nombre || "Profesional Certificado"}</span>
            </div>
            {trabajo.empresa?.telefono && (
              <a
                href={`https://wa.me/${trabajo.empresa.telefono.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-emerald-600 hover:underline"
              >
                <Phone className="h-3.5 w-3.5" /> Consultar por WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* 3 Opciones de Cotización */}
        {trabajo.estado === "PRESUPUESTADO" ? (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold">Elegí la opción que mejor se adapte a tu necesidad:</h2>
              <p className="text-xs text-muted-foreground">Seleccioná una opción para confirmar y abonar la seña de reserva.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {opcionesRaw.map((op: any) => {
                const seleccionada = opcionSeleccionada === op.nivel
                const isRec = op.nivel === "recomendado"

                return (
                  <Card
                    key={op.nivel}
                    onClick={() => setOpcionSeleccionada(op.nivel)}
                    className={`cursor-pointer transition-all relative flex flex-col justify-between ${
                      seleccionada
                        ? "border-emerald-500 ring-2 ring-emerald-500/50 bg-emerald-500/5 shadow-md"
                        : "hover:border-slate-400"
                    }`}
                  >
                    {isRec && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full">
                        Recomendado
                      </span>
                    )}

                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold">{op.nombre}</CardTitle>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            seleccionada ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"
                          }`}
                        >
                          {seleccionada && <CheckCircle2 className="h-3 w-3" />}
                        </div>
                      </div>
                      <CardDescription className="text-xs mt-1">{op.descripcion}</CardDescription>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 space-y-3">
                      <div className="space-y-1.5 border-t pt-2 text-xs">
                        {op.items?.map((it: any, i: number) => (
                          <div key={i} className="flex justify-between text-muted-foreground">
                            <span className="line-clamp-1">{it.concepto}</span>
                            <span className="font-mono">{fmt(it.subtotal)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t flex items-center justify-between">
                        <span className="text-xs font-semibold">Total:</span>
                        <span className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400 font-mono">
                          {fmt(op.total)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
              <div className="text-xs text-muted-foreground text-center sm:text-left">
                <span>Al confirmar, reservás fecha y garantizás congelamiento de precio.</span>
              </div>

              <Button
                onClick={aprobarPresupuesto}
                disabled={aprobando}
                size="lg"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 shadow-md"
              >
                {aprobando ? "Confirmando..." : "Aceptar Presupuesto y Continuar"}
              </Button>
            </div>
          </div>
        ) : (
          /* Estado Confirmado / En Curso / Finalizado */
          <div className="space-y-6">
            <Card className="border-emerald-500/40 bg-emerald-500/5">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <CardTitle className="text-base font-bold">¡Presupuesto Aceptado!</CardTitle>
                </div>
                <CardDescription className="text-xs mt-1">
                  Opción acordada: <strong className="uppercase">{trabajo.opcionElegida}</strong> por un total de{" "}
                  <strong>{fmt(Number(trabajo.montoAcordado || 0))}</strong>.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-4">
                {!trabajo.senaPagada ? (
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">Seña a abonar ({trabajo.porcentajeSena}%):</span>
                      <span className="font-extrabold text-xl text-emerald-600 font-mono">{fmt(montoSeña)}</span>
                    </div>

                    <Button
                      onClick={iniciarPagoMercadoPago}
                      className="w-full bg-[#009ee3] hover:bg-[#0082ba] text-white font-bold h-12 text-base shadow-md"
                    >
                      Pagar Seña con Mercado Pago
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 p-3 rounded-lg">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Seña recibida correctamente. Trabajo programado para ejecución.</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Módulo de Calificación si está finalizado */}
            {trabajo.estado === "FINALIZADO" && (
              <Card>
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    ¿Cómo fue tu experiencia con el trabajo realizado?
                  </CardTitle>
                  <CardDescription className="text-xs">Tu reseña se publica en nuestro perfil oficial.</CardDescription>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                  <div className="flex gap-2 justify-center py-2">
                    {[1, 2, 3, 4, 5].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setCalificacion(st)}
                        className="p-1 text-amber-400 hover:scale-110 transition-transform"
                      >
                        <Star className={`h-8 w-8 ${calificacion >= st ? "fill-amber-400" : "stroke-slate-300"}`} />
                      </button>
                    ))}
                  </div>

                  <Textarea
                    placeholder="Contanos qué te pareció la puntualidad, prolijidad y calidad del trabajo..."
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    className="text-xs"
                  />

                  <Button
                    onClick={enviarCalificacion}
                    disabled={enviandoResena}
                    className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                  >
                    {enviandoResena ? "Enviando..." : "Publicar Calificación"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
