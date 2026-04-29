"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import {
  UtensilsCrossed, Users, Clock, Plus, Trash2,
  CheckCircle2, Receipt, Coffee,
} from "lucide-react"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"

type EstadoMesa = "libre" | "ocupada" | "reservada"

interface LineaComanda {
  id: number
  nombre: string
  cantidad: number
  precio: number
  estado: string
  notas: string | null
}

interface Comanda {
  id: number
  estado: string
  comensales: number
  mozo: string | null
  lineas: LineaComanda[]
}

interface Mesa {
  id: number
  numero: number
  capacidad: number
  estado: EstadoMesa
  salon: { id: number; nombre: string }
  comandas: Comanda[]
}

interface PlatoProducto {
  id: number
  nombre: string
  precioVenta: number
}

interface Salon {
  id: number
  nombre: string
  _count: { mesas: number }
}

interface Cliente {
  id: number
  nombre: string
}

const ESTADO_COLORES: Record<string, string> = {
  libre: "bg-green-100 border-green-300 text-green-800",
  ocupada: "bg-blue-100 border-blue-300 text-blue-800",
  reservada: "bg-yellow-100 border-yellow-300 text-yellow-800",
}

const ESTADO_LABELS: Record<string, string> = {
  libre: "Libre",
  ocupada: "Ocupada",
  reservada: "Reservada",
}

export default function HospitalidadPage() {
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [salones, setSalones] = useState<Salon[]>([])
  const [resumen, setResumen] = useState({ totalMesas: 0, ocupadas: 0, libres: 0, comandasAbiertas: 0 })
  const [loading, setLoading] = useState(true)
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null)
  const [vistaComanda, setVistaComanda] = useState(false)
  const [platos, setPlatos] = useState<PlatoProducto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteFacturarId, setClienteFacturarId] = useState("")
  const [selectedSalonId, setSelectedSalonId] = useState<number | null>(null)
  const [isSavingComanda, setIsSavingComanda] = useState(false)
  const [isFacturando, setIsFacturando] = useState(false)
  const [nuevoItem, setNuevoItem] = useState({ productoId: "", nombre: "", precio: "", cantidad: "1" })
  const { toast } = useToast()

  const authHeaders = useCallback((): HeadersInit => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const cargarDatos = useCallback(async () => {
    try {
      const query = selectedSalonId ? `?salonId=${selectedSalonId}` : ""
      const res = await fetch(`/api/hospitalidad${query}`, { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setMesas(data.mesas ?? [])
      setSalones(data.salones ?? [])
      setResumen(data.resumen ?? { totalMesas: 0, ocupadas: 0, libres: 0, comandasAbiertas: 0 })
    } catch { /* silently fail */ } finally { setLoading(false) }
  }, [authHeaders, selectedSalonId])

  const cargarPlatos = useCallback(async () => {
    try {
      const res = await fetch("/api/productos?esPlato=true", { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setPlatos(Array.isArray(data) ? data : [])
    } catch { /* silently fail */ }
  }, [authHeaders])

  const cargarClientes = useCallback(async () => {
    try {
      const res = await fetch("/api/clientes?soloActivos=true", { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) {
        setClientes(data)
        const consumidorFinal = data.find((cliente) => /consumidor/i.test(cliente.nombre))
        if (consumidorFinal && !clienteFacturarId) {
          setClienteFacturarId(String(consumidorFinal.id))
        }
      } else {
        setClientes([])
      }
    } catch { /* silently fail */ }
  }, [authHeaders, clienteFacturarId])

  useEffect(() => { cargarDatos(); cargarPlatos(); cargarClientes() }, [cargarDatos, cargarPlatos, cargarClientes])

  useKeyboardShortcuts(erpShortcuts({ onRefresh: cargarDatos }))

  const abrirMesa = (mesa: Mesa) => {
    setMesaSeleccionada(mesa)
    setVistaComanda(true)
  }

  const crearComanda = async () => {
    if (!mesaSeleccionada || !nuevoItem.nombre || !nuevoItem.precio) return
    setIsSavingComanda(true)
    try {
      const res = await fetch("/api/hospitalidad", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          mesaId: mesaSeleccionada.id,
          comensales: 1,
          lineas: [{
            productoId: nuevoItem.productoId ? Number(nuevoItem.productoId) : undefined,
            nombre: nuevoItem.nombre,
            cantidad: Number(nuevoItem.cantidad),
            precio: Number(nuevoItem.precio),
          }],
        }),
      })
      if (res.ok) {
        toast({ title: "Comanda registrada", description: `Mesa ${mesaSeleccionada.numero} actualizada.`, variant: "success" })
        setNuevoItem({ productoId: "", nombre: "", precio: "", cantidad: "1" })
        await cargarDatos()
        setVistaComanda(false)
      } else {
        const error = await res.json().catch(() => ({}))
        toast({ title: "Error al crear comanda", description: error.error ?? "Verificá los datos ingresados.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "No se pudo conectar al servidor.", variant: "destructive" })
    } finally {
      setIsSavingComanda(false)
    }
  }

  const comandaActiva = mesaSeleccionada?.comandas?.[0]
  const totalMesa = comandaActiva?.lineas.reduce((s, i) => s + i.cantidad * Number(i.precio), 0) ?? 0

  const facturarComanda = async () => {
    if (!comandaActiva || !clienteFacturarId) {
      toast({ title: "Cliente requerido", description: "Seleccioná un cliente para facturar la comanda.", variant: "destructive" })
      return
    }

    setIsFacturando(true)
    try {
      const res = await fetch("/api/hospitalidad/facturar", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          comandaId: comandaActiva.id,
          clienteId: Number(clienteFacturarId),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "Comanda facturada", description: `Factura emitida con ID ${data.facturaId}.`, variant: "success" })
        setClienteFacturarId("")
        setVistaComanda(false)
        await cargarDatos()
      } else {
        toast({ title: "Error al facturar", description: data.error ?? "No se pudo facturar la comanda.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "No se pudo conectar al servidor.", variant: "destructive" })
    } finally {
      setIsFacturando(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><Spinner className="h-8 w-8" /></div>

  return (
    <div className="space-y-6">
      <div className="space-y-4 sm:flex sm:items-end sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="h-7 w-7" />
            Hospitalidad
          </h1>
          <p className="text-muted-foreground">Gestion de mesas, comandas y sala</p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex flex-wrap gap-2 items-center">
            <Label className="text-xs text-muted-foreground">Salon</Label>
            <Select value={selectedSalonId ? String(selectedSalonId) : "__all__"} onValueChange={(value) => setSelectedSalonId(value === "__all__" ? null : Number(value))}>
              <SelectTrigger className="h-8 text-xs min-w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los salones</SelectItem>
                {salones.map((salon) => (
                  <SelectItem key={salon.id} value={String(salon.id)}>{salon.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={cargarDatos} className="h-8">Actualizar</Button>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{resumen.ocupadas} mesas ocupadas</p>
            <p className="text-xs text-muted-foreground">{resumen.libres} libres de {resumen.totalMesas}</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-3 pb-3"><p className="text-xs text-muted-foreground">Libres</p><p className="text-2xl font-bold text-green-700">{resumen.libres}</p></CardContent></Card>
        <Card><CardContent className="pt-3 pb-3"><p className="text-xs text-muted-foreground">Ocupadas</p><p className="text-2xl font-bold text-blue-700">{resumen.ocupadas}</p></CardContent></Card>
        <Card><CardContent className="pt-3 pb-3"><p className="text-xs text-muted-foreground">Total mesas</p><p className="text-2xl font-bold">{resumen.totalMesas}</p></CardContent></Card>
        <Card><CardContent className="pt-3 pb-3"><p className="text-xs text-muted-foreground">Comandas abiertas</p><p className="text-2xl font-bold text-amber-700">{resumen.comandasAbiertas}</p></CardContent></Card>
      </div>

      {/* Salones */}
      {salones.length > 1 && (
        <div className="flex gap-2">
          {salones.map(s => (
            <Badge key={s.id} variant="secondary" className="text-xs">{s.nombre} ({s._count.mesas} mesas)</Badge>
          ))}
        </div>
      )}

      {/* Mapa de mesas */}
      <Card>
        <CardHeader><CardTitle>Salon {"\u2014"} Vista de Mesas</CardTitle></CardHeader>
        <CardContent>
          {mesas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay mesas configuradas. Crea salones y mesas desde la base de datos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {mesas.map(mesa => (
                <button key={mesa.id} className={`border-2 rounded-xl p-3 text-center transition-all hover:shadow-md ${ESTADO_COLORES[mesa.estado] ?? ESTADO_COLORES.libre}`} onClick={() => abrirMesa(mesa)}>
                  <p className="text-lg font-bold">Mesa {mesa.numero}</p>
                  <div className="flex justify-center gap-1 my-1">
                    {Array.from({ length: mesa.capacidad }).map((_, i) => (<Users key={i} className="h-3 w-3" />))}
                  </div>
                  <p className="text-xs font-medium">{ESTADO_LABELS[mesa.estado] ?? mesa.estado}</p>
                  {mesa.comandas.length > 0 && mesa.comandas[0].mozo && <p className="text-xs opacity-70">{mesa.comandas[0].mozo}</p>}
                  {mesa.comandas.length > 0 && <Badge className="mt-1 text-xs h-4">{mesa.comandas[0].lineas.length} items</Badge>}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog comanda */}
      <Dialog open={vistaComanda} onOpenChange={setVistaComanda}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              Mesa {mesaSeleccionada?.numero}
              <Badge className={ESTADO_COLORES[mesaSeleccionada?.estado ?? "libre"]}>
                {ESTADO_LABELS[mesaSeleccionada?.estado ?? "libre"]}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Comanda actual */}
            {comandaActiva ? (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Coffee className="h-4 w-4" />Comanda actual</h3>
                <div className="space-y-2">
                  {comandaActiva.lineas.map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-sm p-2 rounded border">
                      <span className="w-6 text-center font-bold">{item.cantidad}x</span>
                      <span className="flex-1">{item.nombre}</span>
                      <span className="font-bold">${(item.cantidad * Number(item.precio)).toLocaleString("es-AR")}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${totalMesa.toLocaleString("es-AR")}</span>
                </div>
                <div className="mt-4 space-y-2">
                  <Label>Cliente para facturar</Label>
                  <Select value={clienteFacturarId || "__none__"} onValueChange={(v) => setClienteFacturarId(v === "__none__" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Seleccionar cliente</SelectItem>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={facturarComanda} disabled={!clienteFacturarId || isFacturando} className="w-full">
                    {isFacturando ? "Facturando..." : "Facturar Comanda"}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground text-sm text-center py-4">Sin comanda abierta</p>
                <div className="space-y-3 border-t pt-4">
                  <h4 className="text-sm font-semibold">Agregar item rapido</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <Select
                      value={nuevoItem.productoId || "__manual__"}
                      onValueChange={(value) => {
                        if (value === "__manual__") {
                          setNuevoItem({ ...nuevoItem, productoId: "", nombre: "", precio: "" })
                          return
                        }
                        const plato = platos.find((p) => String(p.id) === value)
                        setNuevoItem({
                          ...nuevoItem,
                          productoId: value,
                          nombre: plato?.nombre ?? "",
                          precio: plato?.precioVenta?.toString() ?? "",
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Plato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__manual__">Manual</SelectItem>
                        {platos.map((plato) => (
                          <SelectItem key={plato.id} value={String(plato.id)}>{plato.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Nombre" value={nuevoItem.nombre} onChange={e => setNuevoItem({ ...nuevoItem, nombre: e.target.value })} />
                    <Input type="number" placeholder="Precio" value={nuevoItem.precio} onChange={e => setNuevoItem({ ...nuevoItem, precio: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2" />
                    <Input type="number" placeholder="Cant" value={nuevoItem.cantidad} onChange={e => setNuevoItem({ ...nuevoItem, cantidad: e.target.value })} />
                  </div>
                  <Button onClick={crearComanda} disabled={!nuevoItem.nombre || !nuevoItem.precio || isSavingComanda} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />{isSavingComanda ? "Guardando..." : "Abrir Comanda"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
