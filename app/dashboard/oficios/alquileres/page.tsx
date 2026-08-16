"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Truck,
  Plus,
  Wrench,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Send,
  Camera,
  DollarSign,
  Shield,
  Clock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authFetch } from "@/lib/stores/auth-store"
import { useToast } from "@/hooks/use-toast"

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

export default function AlquilerMaquinariaPage() {
  const { toast } = useToast()
  const [maquinarias, setMaquinarias] = useState<any[]>([])
  const [contratos, setContratos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Diálogo Nueva Maquinaria
  const [openNuevaMaq, setOpenNuevaMaq] = useState(false)
  const [codigoMaq, setCodigoMaq] = useState("")
  const [nombreMaq, setNombreMaq] = useState("")
  const [categoriaMaq, setCategoriaMaq] = useState("Hormigoneras & Andamios")
  const [tarifaDiaria, setTarifaDiaria] = useState("")
  const [tarifaSemanal, setTarifaSemanal] = useState("")
  const [montoGarantia, setMontoGarantia] = useState("")

  // Diálogo Nuevo Alquiler
  const [openNuevoAlquiler, setOpenNuevoAlquiler] = useState(false)
  const [maqSeleccionada, setMaqSeleccionada] = useState("")
  const [nombreCliente, setNombreCliente] = useState("")
  const [telefonoCliente, setTelefonoCliente] = useState("")
  const [fechaDevolucion, setFechaDevolucion] = useState("")
  const [montoAlquiler, setMontoAlquiler] = useState("")
  const [garantiaAlquiler, setGarantiaAlquiler] = useState("")

  // Diálogo Devolución
  const [contratoDevolucion, setContratoDevolucion] = useState<any | null>(null)
  const [cargosExtras, setCargosExtras] = useState("0")
  const [obsDevolucion, setObsDevolucion] = useState("")

  async function cargarDatos() {
    setLoading(true)
    try {
      const [resMaq, resCont] = await Promise.all([
        authFetch("/api/oficios/alquileres/maquinaria"),
        authFetch("/api/oficios/alquileres/contratos"),
      ])

      if (resMaq.ok) {
        const json = await resMaq.json()
        setMaquinarias(json.data || [])
      }
      if (resCont.ok) {
        const json = await resCont.json()
        setContratos(json.data || [])
      }
    } catch (e) {
      toast({ title: "Error al cargar parque de maquinarias", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  async function handleCrearMaquinaria(e: React.FormEvent) {
    e.preventDefault()
    if (!codigoMaq || !nombreMaq || !tarifaDiaria) {
      toast({ title: "Completá código, nombre y tarifa diaria", variant: "destructive" })
      return
    }

    try {
      const res = await authFetch("/api/oficios/alquileres/maquinaria", {
        method: "POST",
        body: JSON.stringify({
          codigo: codigoMaq,
          nombre: nombreMaq,
          categoria: categoriaMaq,
          tarifaDiaria: Number(tarifaDiaria),
          tarifaSemanal: tarifaSemanal ? Number(tarifaSemanal) : null,
          montoGarantia: montoGarantia ? Number(montoGarantia) : 0,
        }),
      })

      if (res.ok) {
        toast({ title: "Máquina agregada al parque" })
        setOpenNuevaMaq(false)
        setCodigoMaq("")
        setNombreMaq("")
        setTarifaDiaria("")
        setTarifaSemanal("")
        setMontoGarantia("")
        cargarDatos()
      }
    } catch (e) {
      toast({ title: "Error al crear máquina", variant: "destructive" })
    }
  }

  async function handleCrearAlquiler(e: React.FormEvent) {
    e.preventDefault()
    if (!maqSeleccionada || !fechaDevolucion || !montoAlquiler) {
      toast({ title: "Completá máquina, fecha de devolución y monto", variant: "destructive" })
      return
    }

    try {
      // 1. Crear o buscar cliente express
      let clienteId = 1
      if (nombreCliente) {
        const resCli = await authFetch("/api/clientes", {
          method: "POST",
          body: JSON.stringify({
            nombre: nombreCliente,
            telefono: telefonoCliente,
          }),
        })
        if (resCli.ok) {
          const cliData = await resCli.json()
          clienteId = cliData.id || 1
        }
      }

      const res = await authFetch("/api/oficios/alquileres/contratos", {
        method: "POST",
        body: JSON.stringify({
          clienteId,
          maquinariaId: maqSeleccionada,
          fechaPactadaDevolucion: fechaDevolucion,
          montoPactado: Number(montoAlquiler),
          depositoGarantia: Number(garantiaAlquiler || 0),
        }),
      })

      if (res.ok) {
        toast({ title: "Alquiler registrado exitosamente" })
        setOpenNuevoAlquiler(false)
        setNombreCliente("")
        setTelefonoCliente("")
        setMontoAlquiler("")
        setGarantiaAlquiler("")
        cargarDatos()
      }
    } catch (e) {
      toast({ title: "Error al registrar alquiler", variant: "destructive" })
    }
  }

  async function handleDevolver() {
    if (!contratoDevolucion) return
    try {
      const res = await authFetch(`/api/oficios/alquileres/contratos/${contratoDevolucion.id}/devolver`, {
        method: "POST",
        body: JSON.stringify({
          cargosExtras: Number(cargosExtras || 0),
          observacionesDevolucion: obsDevolucion,
        }),
      })

      if (res.ok) {
        toast({ title: "Máquina recibida y liberada a disponible" })
        setContratoDevolucion(null)
        setCargosExtras("0")
        setObsDevolucion("")
        cargarDatos()
      }
    } catch (e) {
      toast({ title: "Error al registrar devolución", variant: "destructive" })
    }
  }

  function reclamarPorWhatsApp(c: any) {
    if (!c.cliente?.telefono) return
    const phone = c.cliente.telefono.replace(/\D/g, "")
    const fecha = new Date(c.fechaPactadaDevolucion).toLocaleDateString("es-AR")
    const msg = encodeURIComponent(
      `Hola ${c.cliente.nombre}, te escribimos del pañol de alquileres. Te recordamos que la máquina *${c.maquinaria?.nombre}* (Código ${c.maquinaria?.codigo}) tenía fecha de devolución pactada para el *${fecha}*. ¿Coordinamos la devolución o extendemos el período de alquiler?`
    )
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank")
  }

  const contratosActivos = contratos.filter((c) => c.estado === "ACTIVO" || c.estado === "VENCIDO_EN_MORA")
  const hoy = new Date()

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/oficios">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Truck className="h-6 w-6 text-amber-500" />
              <h1 className="text-2xl font-bold tracking-tight">Alquiler de Maquinaria & Herramientas</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Control de andamios, trompitos, rotomartillos, fechas de devolución, depósitos en garantía y remitos.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog open={openNuevaMaq} onOpenChange={setOpenNuevaMaq}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Agregar Máquina
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nueva Máquina / Herramienta al Pañol</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCrearMaquinaria} className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Código / ID</Label>
                    <Input
                      placeholder="Ej: AND-01, TR-02"
                      value={codigoMaq}
                      onChange={(e) => setCodigoMaq(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Categoría</Label>
                    <Input
                      placeholder="Andamios, Hormigoneras..."
                      value={categoriaMaq}
                      onChange={(e) => setCategoriaMaq(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Nombre del Equipo</Label>
                  <Input
                    placeholder="Ej: Andamio Tubular 6 Cuerpos c/ Tablones"
                    value={nombreMaq}
                    onChange={(e) => setNombreMaq(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Tarifa Día ($)</Label>
                    <Input
                      type="number"
                      placeholder="15000"
                      value={tarifaDiaria}
                      onChange={(e) => setTarifaDiaria(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tarifa Semanal ($)</Label>
                    <Input
                      type="number"
                      placeholder="70000"
                      value={tarifaSemanal}
                      onChange={(e) => setTarifaSemanal(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Garantía / Pagaré ($)</Label>
                    <Input
                      type="number"
                      placeholder="50000"
                      value={montoGarantia}
                      onChange={(e) => setMontoGarantia(e.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-2">
                  Guardar en Pañol
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={openNuevoAlquiler} onOpenChange={setOpenNuevoAlquiler}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Nuevo Alquiler
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Alquiler de Equipo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCrearAlquiler} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs">Equipo a Entregar</Label>
                  <select
                    className="w-full border rounded-md p-2 text-xs bg-background"
                    value={maqSeleccionada}
                    onChange={(e) => {
                      setMaqSeleccionada(e.target.value)
                      const maq = maquinarias.find((m) => m.id === e.target.value)
                      if (maq) {
                        setMontoAlquiler(String(maq.tarifaDiaria || ""))
                        setGarantiaAlquiler(String(maq.montoGarantia || ""))
                      }
                    }}
                    required
                  >
                    <option value="">Seleccionar máquina disponible...</option>
                    {maquinarias
                      .filter((m) => m.estado === "DISPONIBLE")
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.codigo} — {m.nombre} ({fmt(Number(m.tarifaDiaria))}/día)
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Cliente / Empresa</Label>
                    <Input
                      placeholder="Nombre del cliente"
                      value={nombreCliente}
                      onChange={(e) => setNombreCliente(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">WhatsApp Cliente</Label>
                    <Input
                      placeholder="11-4567-8901"
                      value={telefonoCliente}
                      onChange={(e) => setTelefonoCliente(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Fecha Pactada de Devolución</Label>
                  <Input
                    type="date"
                    value={fechaDevolucion}
                    onChange={(e) => setFechaDevolucion(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Monto Alquiler ($)</Label>
                    <Input
                      type="number"
                      value={montoAlquiler}
                      onChange={(e) => setMontoAlquiler(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Depósito Garantía ($)</Label>
                    <Input
                      type="number"
                      value={garantiaAlquiler}
                      onChange={(e) => setGarantiaAlquiler(e.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-2">
                  Confirmar Entrega y Alquiler
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="activos" className="space-y-4">
        <TabsList className="bg-secondary/50 p-1">
          <TabsTrigger value="activos" className="text-xs">
            Alquileres en Obra ({contratosActivos.length})
          </TabsTrigger>
          <TabsTrigger value="parque" className="text-xs">
            Parque de Maquinarias ({maquinarias.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Alquileres Activos */}
        <TabsContent value="activos">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Cargando contratos...</div>
          ) : contratosActivos.length === 0 ? (
            <Card className="border-dashed p-12 text-center space-y-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <h3 className="text-base font-semibold">Todo el parque está en pañol</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No hay herramientas ni andamios alquilados en este momento. Toca "Nuevo Alquiler" para entregar una máquina.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contratosActivos.map((c) => {
                const vence = new Date(c.fechaPactadaDevolucion)
                const vencido = vence < hoy

                return (
                  <Card
                    key={c.id}
                    className={`flex flex-col justify-between transition-all ${
                      vencido ? "border-red-500/60 bg-red-500/5 shadow-sm" : "hover:border-emerald-500/40"
                    }`}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={
                            vencido
                              ? "bg-red-500/10 text-red-600 border-red-500/30"
                              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          }
                        >
                          {vencido ? "Vencido / En Mora" : "En Obra"}
                        </Badge>
                        <span className="text-xs font-mono font-bold text-muted-foreground">
                          {c.maquinaria?.codigo}
                        </span>
                      </div>
                      <CardTitle className="text-base font-bold mt-1">{c.maquinaria?.nombre}</CardTitle>
                      <CardDescription className="text-xs">
                        Cliente: <strong className="text-foreground">{c.cliente?.nombre}</strong>
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2">
                        <div>
                          <span className="text-muted-foreground block">Devolución pactada:</span>
                          <span className={`font-semibold ${vencido ? "text-red-600 font-bold" : ""}`}>
                            {vence.toLocaleDateString("es-AR")}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Alquiler + Garantía:</span>
                          <span className="font-semibold font-mono">
                            {fmt(Number(c.montoPactado))} + {fmt(Number(c.depositoGarantia))}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <Button
                          onClick={() => setContratoDevolucion(c)}
                          variant="outline"
                          className="w-1/2 text-xs h-8 border-slate-300"
                        >
                          Recibir en Pañol
                        </Button>
                        <Button
                          onClick={() => reclamarPorWhatsApp(c)}
                          disabled={!c.cliente?.telefono}
                          className="w-1/2 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        >
                          <Send className="h-3 w-3" /> Reclamar WA
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Parque de Maquinarias */}
        <TabsContent value="parque">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {maquinarias.map((m) => (
              <Card key={m.id} className="hover:border-slate-400 transition-all flex flex-col justify-between">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={
                        m.estado === "DISPONIBLE"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          : m.estado === "ALQUILADO"
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                      }
                    >
                      {m.estado}
                    </Badge>
                    <span className="text-xs font-mono font-bold text-muted-foreground">{m.codigo}</span>
                  </div>
                  <CardTitle className="text-sm font-bold mt-1">{m.nombre}</CardTitle>
                  <CardDescription className="text-xs">{m.categoria}</CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-2 text-xs border-t mt-2 pt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tarifa Diaria:</span>
                    <span className="font-bold font-mono text-emerald-600">{fmt(Number(m.tarifaDiaria))}</span>
                  </div>
                  {m.tarifaSemanal && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tarifa Semanal:</span>
                      <span className="font-semibold font-mono">{fmt(Number(m.tarifaSemanal))}</span>
                    </div>
                  )}
                  {m.montoGarantia && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Depósito Requerido:</span>
                      <span className="font-mono text-muted-foreground">{fmt(Number(m.montoGarantia))}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo Devolución y Check */}
      <Dialog open={!!contratoDevolucion} onOpenChange={(open) => !open && setContratoDevolucion(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recibir Equipo & Devolución de Garantía</DialogTitle>
          </DialogHeader>
          {contratoDevolucion && (
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-secondary/40 rounded-lg text-xs space-y-1">
                <p className="font-bold">{contratoDevolucion.maquinaria?.nombre}</p>
                <p className="text-muted-foreground">Cliente: {contratoDevolucion.cliente?.nombre}</p>
                <p className="text-emerald-600 font-semibold">
                  Garantía a devolver: {fmt(Number(contratoDevolucion.depositoGarantia || 0))}
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Cargos Extras por Rotura / Limpieza ($)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={cargosExtras}
                  onChange={(e) => setCargosExtras(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Observaciones de Estado</Label>
                <Input
                  placeholder="Equipo devuelto en perfecto estado / limpio"
                  value={obsDevolucion}
                  onChange={(e) => setObsDevolucion(e.target.value)}
                />
              </div>

              <Button onClick={handleDevolver} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-2">
                Confirmar Recepción y Liberar Equipo
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
