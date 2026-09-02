"use client"

import { useState, useEffect, useCallback } from "react"
import { PageShell, PageHeader, KpiStrip, StatusBadge } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Wrench,
  Car,
  Plus,
  Search,
  MessageSquare,
  Share2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  Loader2,
  Trash2,
  User,
  Fuel,
} from "lucide-react"
import { authFetch } from "@/lib/stores/auth-store"
import { useToast } from "@/hooks/use-toast"

interface OrdenItem {
  descripcion: string
  cantidad: number
  precioUnitario: number
  tipo: "REPUESTO" | "MANO_OBRA"
}

interface Reparacion {
  id: number
  numero: string
  estado: string
  titulo: string
  descripcion: string
  total: number
  createdAt: string
  fechaPrometida?: string
  tecnicoAsignado?: string
  cliente?: {
    id: number
    nombre: string
    telefono?: string
    email?: string
  }
  metadata?: {
    patente?: string
    marca?: string
    modelo?: string
    anio?: number
    km?: number
    nivelCombustible?: string
    detallesCarroceria?: string
    diagnosticoTecnico?: string
  }
  items: OrdenItem[]
}

const ESTADOS = [
  { id: "RECEPCION", label: "Recepción", variant: "neutral" as const },
  { id: "DIAGNOSTICO", label: "Diagnóstico", variant: "info" as const },
  { id: "REPUESTOS", label: "Esperando Repuestos", variant: "warning" as const },
  { id: "EN_REPARACION", label: "En Reparación", variant: "info" as const },
  { id: "LISTO", label: "Auto Listo", variant: "success" as const },
  { id: "ENTREGADO", label: "Entregado", variant: "neutral" as const },
]

export default function TallerMecanicoPage() {
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false)
  const [clientes, setClientes] = useState<{ id: number; nombre: string }[]>([])
  const { toast } = useToast()

  // Formulario nuevo vehículo
  const [clienteId, setClienteId] = useState<string>("")
  const [patente, setPatente] = useState("")
  const [marca, setMarca] = useState("")
  const [modelo, setModelo] = useState("")
  const [anio, setAnio] = useState("")
  const [km, setKm] = useState("")
  const [nivelCombustible, setNivelCombustible] = useState<string>("medio")
  const [falla, setFalla] = useState("")
  const [tecnico, setTecnico] = useState("")
  const [items, setItems] = useState<OrdenItem[]>([
    { descripcion: "Mano de obra diagnóstico / revisión", cantidad: 1, precioUnitario: 15000, tipo: "MANO_OBRA" },
  ])
  const [guardando, setGuardando] = useState(false)

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    try {
      const [resOrd, resCli] = await Promise.all([
        authFetch("/api/taller/vehiculos"),
        authFetch("/api/clientes"),
      ])
      const dataOrd = await resOrd.json()
      const dataCli = await resCli.json()

      if (dataOrd.ok) setReparaciones(dataOrd.ordenes || [])
      if (Array.isArray(dataCli)) setClientes(dataCli)
      else if (dataCli.clientes) setClientes(dataCli.clientes)
    } catch {
      toast({
        title: "Error de conexión",
        description: "No se pudieron cargar las órdenes del taller.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const cambiarEstado = async (ordenId: number, nuevoEstado: string) => {
    try {
      const res = await authFetch("/api/taller/estado", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordenId, estado: nuevoEstado }),
      })
      if (res.ok) {
        toast({ title: "Estado actualizado", description: `La orden pasó a ${nuevoEstado}.` })
        cargarDatos()
      }
    } catch {
      toast({ title: "Error", description: "No se pudo cambiar el estado.", variant: "destructive" })
    }
  }

  const notificarAutoListo = async (ordenId: number) => {
    try {
      const res = await authFetch("/api/taller/notificar-listo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordenId }),
      })
      const json = await res.json()
      if (json.ok && json.linkWhatsApp) {
        window.open(json.linkWhatsApp, "_blank")
      }
    } catch {
      toast({ title: "Error", description: "No se pudo generar el mensaje.", variant: "destructive" })
    }
  }

  const agregarItem = () => {
    setItems([...items, { descripcion: "", cantidad: 1, precioUnitario: 0, tipo: "REPUESTO" }])
  }

  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleCrearOrden = async () => {
    if (!clienteId || !patente.trim() || !marca.trim() || !falla.trim()) {
      toast({
        title: "Faltan datos",
        description: "Completá cliente, patente, marca y motivo de ingreso.",
        variant: "destructive",
      })
      return
    }

    setGuardando(true)
    try {
      const res = await authFetch("/api/taller/vehiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: parseInt(clienteId, 10),
          patente,
          marca,
          modelo,
          anio: anio ? parseInt(anio, 10) : undefined,
          km: km ? parseInt(km, 10) : undefined,
          nivelCombustible,
          fallaReportada: falla,
          tecnicoAsignado: tecnico,
          items,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Error al guardar")

      toast({ title: "¡Vehículo ingresado!", description: `Orden ${json.orden.numero} creada exitosamente.` })
      setModalNuevoOpen(false)
      cargarDatos()
    } catch (err) {
      toast({
        title: "Error al registrar",
        description: err instanceof Error ? err.message : "Revisá los datos.",
        variant: "destructive",
      })
    } finally {
      setGuardando(false)
    }
  }

  const filtradas = reparaciones.filter((r) => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    const pat = (r.metadata?.patente || "").toLowerCase()
    const mar = (r.metadata?.marca || "").toLowerCase()
    const cli = (r.cliente?.nombre || "").toLowerCase()
    return pat.includes(q) || mar.includes(q) || cli.includes(q)
  })

  const enTaller = reparaciones.filter((r) => r.estado !== "ENTREGADO").length
  const listos = reparaciones.filter((r) => r.estado === "LISTO").length
  const facturacionTotal = reparaciones.reduce((sum, r) => sum + (Number(r.total) || 0), 0)

  return (
    <PageShell>
      <PageHeader
        title="Taller Mecánico & Reparaciones"
        description="Órdenes de trabajo por patente, repuestos, mano de obra y aviso 'Auto Listo' por WhatsApp."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary">
            <Wrench className="h-3 w-3" />
            Taller Automotor
          </span>
        }
        actions={
          <Button onClick={() => setModalNuevoOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-1.5 h-4 w-4" />
            Ingresar Vehículo
          </Button>
        }
      />

      {/* KPI Strip */}
      <KpiStrip
        columns={3}
        items={[
          {
            label: "En Taller",
            value: enTaller,
            hint: "Vehículos en proceso de reparación",
          },
          {
            label: "Listos para Entregar",
            value: listos,
            hint: "Avisados o pendientes de retiro",
          },
          {
            label: "Facturación Órdenes",
            value: `$${facturacionTotal.toLocaleString("es-AR")}`,
            hint: "Total acumulado de trabajos",
          },
        ]}
      />

      {/* Filtro de Búsqueda */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por patente, marca o cliente..."
            className="pl-9 text-xs"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* Listado de Vehículos */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Cargando reparaciones del taller...</span>
        </div>
      ) : filtradas.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <Car className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="text-sm font-medium">No hay vehículos registrados</p>
            <p className="text-xs text-muted-foreground">Ingresá el primer vehículo para comenzar a gestionar el taller.</p>
            <Button size="sm" onClick={() => setModalNuevoOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Ingresar Vehículo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((rep) => {
            const estadoCfg = ESTADOS.find((e) => e.id === rep.estado) || ESTADOS[0]
            const esListo = rep.estado === "LISTO"

            return (
              <Card key={rep.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader className="pb-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                          {rep.metadata?.patente || "S/PATENTE"}
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold">{rep.numero}</span>
                      </div>
                      <CardTitle className="text-sm font-bold mt-1">
                        {rep.metadata?.marca} {rep.metadata?.modelo}
                      </CardTitle>
                    </div>
                    <StatusBadge variant={estadoCfg.variant} label={estadoCfg.label} />
                  </div>
                  <CardDescription className="text-xs flex items-center gap-1 pt-1 text-slate-700 dark:text-slate-300">
                    <User className="h-3 w-3" />
                    {rep.cliente?.nombre || "Consumidor Final"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-0 text-xs flex-1">
                  <div className="p-2 rounded-lg bg-muted/40 space-y-1">
                    <p className="text-muted-foreground text-[11px] font-medium">Motivo de ingreso:</p>
                    <p className="line-clamp-2 text-slate-800 dark:text-slate-200">{rep.descripcion || "Sin detalle"}</p>
                  </div>

                  {rep.items && rep.items.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase">Trabajos & Repuestos:</p>
                      <div className="max-h-20 overflow-y-auto space-y-0.5 text-[11px]">
                        {rep.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-muted-foreground">
                            <span className="truncate">• {it.descripcion}</span>
                            <span className="font-mono shrink-0">${Number(it.precioUnitario).toLocaleString("es-AR")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t font-semibold">
                    <span>Total Presupuesto:</span>
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                      ${Number(rep.total || 0).toLocaleString("es-AR")}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="pt-2 flex flex-col gap-1.5">
                    <Select value={rep.estado} onValueChange={(val) => cambiarEstado(rep.id, val)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Cambiar estado..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map((e) => (
                          <SelectItem key={e.id} value={e.id} className="text-xs">
                            {e.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      size="sm"
                      onClick={() => notificarAutoListo(rep.id)}
                      className={`h-8 text-xs font-semibold ${
                        esListo
                          ? "bg-[#25D366] hover:bg-[#1EBE5D] text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1" />
                      {esListo ? "Avisar por WhatsApp: Auto Listo 🚗" : "Enviar WhatsApp al Cliente"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal Nuevo Ingreso */}
      <Dialog open={modalNuevoOpen} onOpenChange={setModalNuevoOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Ingreso de Vehículo al Taller
            </DialogTitle>
            <DialogDescription>
              Completá los datos del auto y generá la orden de trabajo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 flex-1 overflow-y-auto text-xs">
            {/* Cliente */}
            <div className="space-y-1">
              <Label className="text-xs">Cliente / Dueño</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Datos Vehículo */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Patente</Label>
                <Input
                  placeholder="AA123BB o ABC123"
                  className="font-mono uppercase text-xs"
                  value={patente}
                  onChange={(e) => setPatente(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Marca</Label>
                <Input
                  placeholder="Ej: Ford, Fiat"
                  className="text-xs"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Modelo</Label>
                <Input
                  placeholder="Ej: Focus, Cronos"
                  className="text-xs"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Kilometraje (km)</Label>
                <Input
                  type="number"
                  placeholder="Ej: 85000"
                  className="text-xs"
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Combustible</Label>
                <Select value={nivelCombustible} onValueChange={setNivelCombustible}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reserva" className="text-xs">Reserva</SelectItem>
                    <SelectItem value="un_cuarto" className="text-xs">1/4 Tanque</SelectItem>
                    <SelectItem value="medio" className="text-xs">1/2 Tanque</SelectItem>
                    <SelectItem value="tres_cuartos" className="text-xs">3/4 Tanque</SelectItem>
                    <SelectItem value="lleno" className="text-xs">Lleno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mecánico Asignado</Label>
                <Input
                  placeholder="Ej: Marcelo"
                  className="text-xs"
                  value={tecnico}
                  onChange={(e) => setTecnico(e.target.value)}
                />
              </div>
            </div>

            {/* Motivo de ingreso */}
            <div className="space-y-1">
              <Label className="text-xs">Falla Reportada / Motivo de Ingreso</Label>
              <Textarea
                placeholder="Ej: Ruido al frenar, cambio de aceite y filtros, tren delantero..."
                className="text-xs"
                rows={2}
                value={falla}
                onChange={(e) => setFalla(e.target.value)}
              />
            </div>

            {/* Repuestos y Mano de Obra */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Trabajos y Repuestos Iniciales</Label>
                <Button size="sm" variant="outline" onClick={agregarItem} className="h-7 text-[11px]">
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar Ítem
                </Button>
              </div>

              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Descripción (ej: Pastillas de freno)"
                      className="text-xs flex-1"
                      value={it.descripcion}
                      onChange={(e) => {
                        const copy = [...items]
                        copy[idx].descripcion = e.target.value
                        setItems(copy)
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Precio"
                      className="text-xs w-24"
                      value={it.precioUnitario || ""}
                      onChange={(e) => {
                        const copy = [...items]
                        copy[idx].precioUnitario = parseFloat(e.target.value) || 0
                        setItems(copy)
                      }}
                    />
                    {items.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => eliminarItem(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalNuevoOpen(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={handleCrearOrden} disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Ingreso"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
