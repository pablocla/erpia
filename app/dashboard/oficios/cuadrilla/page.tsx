"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Users,
  Plus,
  Phone,
  DollarSign,
  Calendar,
  CheckCircle2,
  Send,
  Calculator,
  UserCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { authFetch } from "@/lib/stores/auth-store"
import { useToast } from "@/hooks/use-toast"

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

interface Operario {
  id: string
  nombre: string
  telefono: string
  rol: string
  valorJornal?: number
  activo: boolean
  asignaciones?: Array<{
    id: string
    fecha: string
    trabajo: {
      id: string
      titulo: string
      direccion?: string
    }
  }>
}

export default function CuadrillaPage() {
  const { toast } = useToast()
  const [operarios, setOperarios] = useState<Operario[]>([])
  const [loading, setLoading] = useState(true)

  const [modalAltaOpen, setModalAltaOpen] = useState(false)
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [rol, setRol] = useState("Oficial Plomero")
  const [valorJornal, setValorJornal] = useState("35000")
  const [guardando, setGuardando] = useState(false)

  const [liquidacionModal, setLiquidacionModal] = useState<any>(null)
  const [calculandoLiquidacion, setCalculandoLiquidacion] = useState(false)

  async function cargarOperarios() {
    setLoading(true)
    try {
      const res = await authFetch("/api/oficios/cuadrilla")
      if (res.ok) {
        const json = await res.json()
        setOperarios(json.data || [])
      }
    } catch (e) {
      toast({ title: "Error al cargar cuadrilla", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarOperarios()
  }, [])

  async function crearOperario() {
    if (!nombre.trim() || !telefono.trim()) {
      toast({ title: "Nombre y teléfono son obligatorios", variant: "destructive" })
      return
    }

    setGuardando(true)
    try {
      const res = await authFetch("/api/oficios/cuadrilla", {
        method: "POST",
        body: JSON.stringify({
          nombre,
          telefono,
          rol,
          valorJornal: Number(valorJornal) || 0,
        }),
      })

      if (res.ok) {
        toast({ title: "¡Operario agregado a la cuadrilla!" })
        setNombre("")
        setTelefono("")
        setModalAltaOpen(false)
        cargarOperarios()
      }
    } catch (e) {
      toast({ title: "Error al guardar operario", variant: "destructive" })
    } finally {
      setGuardando(false)
    }
  }

  async function liquidarViernes(op: Operario) {
    setCalculandoLiquidacion(true)
    try {
      const hoy = new Date()
      const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)

      const res = await authFetch("/api/oficios/cuadrilla/liquidar", {
        method: "POST",
        body: JSON.stringify({
          operarioId: op.id,
          fechaDesde: hace7Dias.toISOString(),
          fechaHasta: hoy.toISOString(),
        }),
      })

      if (res.ok) {
        const json = await res.json()
        setLiquidacionModal(json.data)
      }
    } catch (e) {
      toast({ title: "Error al calcular liquidación", variant: "destructive" })
    } finally {
      setCalculandoLiquidacion(false)
    }
  }

  function enviarWhatsAppAgenda(op: Operario) {
    const tareas = op.asignaciones?.map((a) => `• ${a.trabajo.titulo} (${a.trabajo.direccion || "Sin dirección"})`).join("\n") || "Sin trabajos asignados hoy."
    const msg = encodeURIComponent(
      `Hola ${op.nombre}, tu hoja de ruta para hoy es:\n\n${tareas}\n\nCualquier duda avisar al capataz.`
    )
    window.open(`https://wa.me/${op.telefono.replace(/\D/g, "")}?text=${msg}`, "_blank")
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/oficios">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              <h1 className="text-2xl font-bold tracking-tight">Gestión de Cuadrilla</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Jornales, despacho de hoja de ruta por WhatsApp y liquidación semanal sin peleas.
            </p>
          </div>
        </div>

        <Dialog open={modalAltaOpen} onOpenChange={setModalAltaOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Plus className="h-4 w-4" />
              Agregar Operario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Alta de Operario / Cuadrilla</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <Label className="text-xs">Nombre Completo *</Label>
                <Input
                  placeholder="Ej: Marcos Gómez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Teléfono / WhatsApp *</Label>
                <Input
                  placeholder="11 5555-4444"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Rol / Especialidad</Label>
                  <Input
                    placeholder="Oficial / Ayudante"
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Valor Jornal Diario ($)</Label>
                  <Input
                    type="number"
                    placeholder="35000"
                    value={valorJornal}
                    onChange={(e) => setValorJornal(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setModalAltaOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={crearOperario} disabled={guardando} className="bg-emerald-600 text-white">
                  {guardando ? "Guardando..." : "Guardar Operario"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Operarios */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Cargando cuadrilla...</div>
      ) : operarios.length === 0 ? (
        <Card className="border-dashed p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No hay operarios en la cuadrilla</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
              Agregá a tus oficiales y ayudantes para enviarles la hoja de ruta del día por WhatsApp y liquidar jornales.
            </p>
          </div>
          <Button onClick={() => setModalAltaOpen(true)} className="bg-emerald-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Primer Operario
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {operarios.map((op) => (
            <Card key={op.id} className="hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                    {op.rol}
                  </Badge>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {fmt(Number(op.valorJornal || 0))}/día
                  </span>
                </div>
                <CardTitle className="text-base font-bold mt-1">{op.nombre}</CardTitle>
                <CardDescription className="text-xs flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {op.telefono}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 pt-0 space-y-3">
                <div className="border-t pt-2 text-xs">
                  <span className="text-muted-foreground block mb-1">Tareas asignadas hoy:</span>
                  {(op.asignaciones || []).length === 0 ? (
                    <span className="text-slate-400 italic">Sin asignaciones para hoy</span>
                  ) : (
                    <ul className="space-y-1">
                      {op.asignaciones?.map((as) => (
                        <li key={as.id} className="flex items-center gap-1 text-foreground font-medium">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span className="line-clamp-1">{as.trabajo.titulo}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => enviarWhatsAppAgenda(op)}
                    className="flex-1 text-xs gap-1.5 text-emerald-600 hover:text-emerald-700"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Enviar Agenda WA
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => liquidarViernes(op)}
                    className="text-xs bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                  >
                    <Calculator className="h-3.5 w-3.5 mr-1" />
                    Liquidar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Liquidación */}
      {liquidacionModal && (
        <Dialog open={!!liquidacionModal} onOpenChange={() => setLiquidacionModal(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Liquidación de Jornales: {liquidacionModal.operario.nombre}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm pt-2">
              <div className="bg-muted p-3 rounded-lg space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Días trabajados (última semana):</span>
                  <span className="font-bold">{liquidacionModal.diasTrabajados} jornadas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor por jornada:</span>
                  <span className="font-mono">{fmt(liquidacionModal.operario.valorJornal)}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  <span>Neto a Pagar:</span>
                  <span className="font-mono">{fmt(liquidacionModal.netoAPagar)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setLiquidacionModal(null)}>
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    const msg = encodeURIComponent(
                      `Hola ${liquidacionModal.operario.nombre}, tu liquidación semanal es de *${fmt(
                        liquidacionModal.netoAPagar
                      )}* (${liquidacionModal.diasTrabajados} jornadas trabajadas).`
                    )
                    window.open(
                      `https://wa.me/${liquidacionModal.operario.telefono.replace(/\D/g, "")}?text=${msg}`,
                      "_blank"
                    )
                  }}
                  className="bg-emerald-600 text-white"
                >
                  Enviar Comprobante por WA
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
