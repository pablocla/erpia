"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Mic,
  Sparkles,
  Send,
  Plus,
  Trash2,
  DollarSign,
  Shield,
  Clock,
  Check,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { authFetch } from "@/lib/stores/auth-store"
import { useToast } from "@/hooks/use-toast"

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

interface NivelItem {
  nombre: string
  nivel: "basico" | "recomendado" | "premium"
  descripcion: string
  items: Array<{
    concepto: string
    cantidad: number
    unidad: string
    precioUnitario: number
    subtotal: number
  }>
  total: number
  plazoEstimadoDias: number
  garantiaMeses: number
}

export default function NuevoPresupuestoPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [tipoOficio, setTipoOficio] = useState<string>("PLOMERIA_GAS")
  const [titulo, setTitulo] = useState("")
  const [clienteNombre, setClienteNombre] = useState("")
  const [clienteTelefono, setClienteTelefono] = useState("")
  const [direccion, setDireccion] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [porcentajeSena, setPorcentajeSena] = useState<number>(30)

  const [grabandoAudio, setGrabandoAudio] = useState(false)
  const [generandoIA, setGenerandoIA] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [opciones, setOpciones] = useState<NivelItem[]>([
    {
      nombre: "Básico / Esencial",
      nivel: "basico",
      descripcion: "Mano de obra puntual y materiales estándar.",
      items: [{ concepto: "Mano de obra estándar", cantidad: 1, unidad: "global", precioUnitario: 35000, subtotal: 35000 }],
      total: 35000,
      plazoEstimadoDias: 1,
      garantiaMeses: 3,
    },
    {
      nombre: "Recomendado / Profesional",
      nivel: "recomendado",
      descripcion: "Materiales primera marca, prueba certificada y garantía 6 meses.",
      items: [
        { concepto: "Mano de obra calificada", cantidad: 1, unidad: "global", precioUnitario: 50000, subtotal: 50000 },
        { concepto: "Materiales y accesorios sellados", cantidad: 1, unidad: "kit", precioUnitario: 20000, subtotal: 20000 },
      ],
      total: 70000,
      plazoEstimadoDias: 1,
      garantiaMeses: 6,
    },
    {
      nombre: "Premium / Llave en Mano",
      nivel: "premium",
      descripcion: "Servicio integral reforzado, limpieza final y garantía 1 año.",
      items: [
        { concepto: "Servicio integral premium", cantidad: 1, unidad: "global", precioUnitario: 70000, subtotal: 70000 },
        { concepto: "Materiales de alta durabilidad", cantidad: 1, unidad: "kit", precioUnitario: 30000, subtotal: 30000 },
      ],
      total: 100000,
      plazoEstimadoDias: 2,
      garantiaMeses: 12,
    },
  ])

  async function dictarConIA() {
    setGenerandoIA(true)
    try {
      const res = await authFetch("/api/oficios/ia/audio-presupuesto", {
        method: "POST",
        body: JSON.stringify({
          audioText: descripcion || titulo || "Reparación integral y cambio de piezas",
          rubro: tipoOficio,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        if (json.data?.opcionesPresupuesto?.opciones) {
          setOpciones(json.data.opcionesPresupuesto.opciones)
          if (!titulo && json.data.tituloSugerido) {
            setTitulo(json.data.tituloSugerido)
          }
          toast({
            title: "¡Cotización en 3 niveles generada por IA!",
            description: "Ajustá los valores si lo deseás antes de enviar.",
          })
        }
      }
    } catch (e) {
      toast({
        title: "Error al generar cotización con IA",
        description: "Podés completar los valores manualmente.",
        variant: "destructive",
      })
    } finally {
      setGenerandoIA(false)
    }
  }

  function actualizarPrecioItem(nivelIdx: number, itemIdx: number, nuevoPrecio: number) {
    setOpciones((prev) => {
      const copy = [...prev]
      const nivel = { ...copy[nivelIdx] }
      const items = [...nivel.items]
      const item = { ...items[itemIdx], precioUnitario: nuevoPrecio, subtotal: nuevoPrecio * items[itemIdx].cantidad }
      items[itemIdx] = item
      nivel.items = items
      nivel.total = items.reduce((acc, it) => acc + it.subtotal, 0)
      copy[nivelIdx] = nivel
      return copy
    })
  }

  async function guardarYEnviar() {
    if (!titulo.trim()) {
      toast({ title: "Falta el título del trabajo", variant: "destructive" })
      return
    }

    setGuardando(true)
    try {
      // 1. Crear trabajo
      const payload = {
        tipoOficio,
        titulo,
        descripcion,
        direccion,
        porcentajeSena,
        opcionesPresupuesto: {
          moneda: "ARS",
          validezDias: 7,
          porcentajeSena,
          opciones,
        },
      }

      const res = await authFetch("/api/oficios/trabajos", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const json = await res.json()
        const nuevoTrabajo = json.data
        const token = nuevoTrabajo.tokenPublico
        const link = `${window.location.origin}/p/trabajo/${token}`

        // Si hay teléfono, armar WhatsApp
        if (clienteTelefono) {
          const cleanPhone = clienteTelefono.replace(/\D/g, "")
          const msg = encodeURIComponent(
            `Hola ${clienteNombre || "estimado/a"}, te comparto el presupuesto interactivo para *${titulo}*:\n\n👉 ${link}\n\nPodés elegir la opción que mejor se adapte a tus necesidades y señar directo con Mercado Pago.`
          )
          window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank")
        }

        toast({
          title: "¡Presupuesto creado con éxito!",
          description: "Redirigiendo a la ficha del trabajo...",
        })

        router.push(`/dashboard/oficios/${nuevoTrabajo.id}`)
      } else {
        const err = await res.json()
        toast({ title: "Error al guardar", description: err.error, variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error de conexión", variant: "destructive" })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/oficios">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nuevo Presupuesto Express</h1>
            <p className="text-xs text-muted-foreground">
              Armá 3 opciones en 30 segundos y cobrá la seña por Mercado Pago.
            </p>
          </div>
        </div>

        <Button
          onClick={dictarConIA}
          disabled={generandoIA}
          variant="outline"
          className="gap-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10"
        >
          <Sparkles className="h-4 w-4" />
          {generandoIA ? "Gemini cotizando..." : "Cotizar con IA"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Datos del Trabajo y Cliente */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold">1. Datos del Cliente & Obra</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div>
                <Label className="text-xs">Rubro / Especialidad</Label>
                <Select value={tipoOficio} onValueChange={setTipoOficio}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLOMERIA_GAS">Plomería & Gas</SelectItem>
                    <SelectItem value="ELECTRICIDAD">Electricidad</SelectItem>
                    <SelectItem value="PINTURA">Pintura</SelectItem>
                    <SelectItem value="ALBANILERIA_OBRA">Albañilería & Refacciones</SelectItem>
                    <SelectItem value="REFRIGERACION_CLIMA">Aire & Climatización</SelectItem>
                    <SelectItem value="TECHOS_ZINGUERIA">Techos & Zinguería</SelectItem>
                    <SelectItem value="HERRERIA">Herrería</SelectItem>
                    <SelectItem value="CARPINTERIA">Carpintería</SelectItem>
                    <SelectItem value="GENERAL">General / Multiservicio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Título del Trabajo *</Label>
                <Input
                  placeholder="Ej: Cambio de cañería baño principal"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Cliente</Label>
                  <Input
                    placeholder="Nombre"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">WhatsApp</Label>
                  <Input
                    placeholder="11 2345-6789"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Dirección de la Obra</Label>
                <Input
                  placeholder="Calle, Altura y Localidad"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">Descripción / Notas técnicas</Label>
                <Textarea
                  placeholder="Detalles del problema, medidas, materiales requeridos..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="mt-1 text-xs h-20"
                />
              </div>

              <div>
                <Label className="text-xs">Porcentaje de Seña Requerido</Label>
                <div className="flex gap-2 mt-1">
                  {[30, 50, 100].map((pct) => (
                    <Button
                      key={pct}
                      type="button"
                      variant={porcentajeSena === pct ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPorcentajeSena(pct)}
                      className="flex-1 text-xs"
                    >
                      {pct}%
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Las 3 Opciones de Presupuesto */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">2. Propuesta en 3 Niveles (Básico / Recomendado / Premium)</h2>
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600">
              Validez: 7 días
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {opciones.map((op, nivelIdx) => {
              const isRec = op.nivel === "recomendado"
              return (
                <Card
                  key={op.nivel}
                  className={`flex flex-col justify-between relative transition-all ${
                    isRec ? "border-emerald-500 shadow-md ring-1 ring-emerald-500/50" : ""
                  }`}
                >
                  {isRec && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                      Más Vendido
                    </span>
                  )}

                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-bold">{op.nombre}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2 mt-1">{op.descripcion}</CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-0 space-y-3">
                    <div className="space-y-2">
                      {op.items.map((it, itIdx) => (
                        <div key={itIdx} className="text-xs border-b pb-1.5 space-y-1">
                          <span className="text-muted-foreground block line-clamp-1">{it.concepto}</span>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-mono">
                              {it.cantidad} {it.unidad}
                            </span>
                            <Input
                              type="number"
                              value={it.precioUnitario}
                              onChange={(e) =>
                                actualizarPrecioItem(nivelIdx, itIdx, Number(e.target.value) || 0)
                              }
                              className="h-7 w-24 text-right text-xs font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Total Opción</span>
                        <span className="font-extrabold text-base text-foreground">{fmt(op.total)}</span>
                      </div>
                      <div className="text-right text-[10px] text-muted-foreground">
                        <span className="block flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {op.plazoEstimadoDias}d
                        </span>
                        <span className="block flex items-center gap-1">
                          <Shield className="h-3 w-3 text-emerald-500" /> {op.garantiaMeses}m garantía
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Link href="/dashboard/oficios">
              <Button variant="outline">Cancelar</Button>
            </Link>

            <Button
              onClick={guardarYEnviar}
              disabled={guardando}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md"
            >
              <Send className="h-4 w-4" />
              {guardando ? "Generando..." : "Crear y Enviar por WhatsApp"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
