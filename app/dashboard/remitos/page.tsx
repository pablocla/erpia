"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Truck,
  Search,
  Plus,
  Package,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Clock,
} from "lucide-react"

type LineaRemito = { id: number; descripcion: string; cantidad: number; unidad: string }
type Remito = {
  id: number
  numero: number
  fecha: string
  estado: string
  observaciones: string | null
  cliente?: { id: number; nombre: string; cuit: string | null }
  factura?: { id: number; tipo: string; numero: number; puntoVenta: number } | null
  incoterm?: { id: number; nombre: string } | null
  lineas: LineaRemito[]
}

const ESTADOS = ["pendiente", "entregado", "anulado"]

export default function RemitosPage() {
  const [remitos, setRemitos] = useState<Remito[]>([])
  const [loading, setLoading] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [incoterms, setIncoterms] = useState<{ id: number; nombre: string }[]>([])

  // Modal nuevo remito
  const [modal, setModal] = useState(false)
  const [clienteId, setClienteId] = useState("")
  const [facturaId, setFacturaId] = useState("")
  const [incotermId, setIncotermId] = useState("__none__")
  const [obs, setObs] = useState("")
  const [lineas, setLineas] = useState([{ descripcion: "", cantidad: "1", unidad: "unidad" }])
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState("")

  const authHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/remitos", { headers: authHeaders() })
      const data = await res.json()
      setRemitos(Array.isArray(data.data) ? data.data : [])
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useEffect(() => {
    fetch("/api/maestros/incoterms?take=200", { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setIncoterms(Array.isArray(d) ? d : d.data ?? []))
      .catch(() => {})
  }, [authHeaders])

  const filtrados = remitos.filter((r) => {
    const matchBusqueda =
      r.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(r.numero).includes(busqueda)
    const matchEstado = filtroEstado === "todos" || r.estado === filtroEstado
    return matchBusqueda && matchEstado
  })

  const resumen = {
    total: remitos.length,
    pendientes: remitos.filter((r) => r.estado === "pendiente").length,
    entregados: remitos.filter((r) => r.estado === "entregado").length,
  }

  const agregarLinea = () => setLineas([...lineas, { descripcion: "", cantidad: "1", unidad: "unidad" }])

  const actualizarLinea = (idx: number, campo: string, valor: string) => {
    const nuevas = [...lineas]
    nuevas[idx] = { ...nuevas[idx], [campo]: valor }
    setLineas(nuevas)
  }

  const crearRemito = async () => {
    setError("")
    if (!clienteId) { setError("Cliente es obligatorio"); return }
    const lineasValidas = lineas.filter((l) => l.descripcion.trim())
    if (lineasValidas.length === 0) { setError("Al menos una línea es obligatoria"); return }

    setCreando(true)
    try {
      const body: Record<string, unknown> = {
        clienteId: parseInt(clienteId, 10),
        lineas: lineasValidas.map((l) => ({
          descripcion: l.descripcion.trim(),
          cantidad: parseFloat(l.cantidad) || 1,
          unidad: l.unidad,
        })),
      }
      if (facturaId) body.facturaId = parseInt(facturaId, 10)
      if (incotermId !== "__none__") body.incotermId = parseInt(incotermId, 10)
      if (obs.trim()) body.observaciones = obs.trim()

      const res = await fetch("/api/remitos", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Error al crear remito"); return }

      setModal(false)
      setClienteId("")
      setFacturaId("")
      setIncotermId("__none__")
      setObs("")
      setLineas([{ descripcion: "", cantidad: "1", unidad: "unidad" }])
      await cargar()
    } finally {
      setCreando(false)
    }
  }

  const cambiarEstado = async (id: number, estado: string) => {
    await fetch(`/api/remitos/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ estado }) })
    await cargar()
  }

  return (
    <div className="space-y-6">
      <div className="dashboard-surface rounded-xl p-4 sm:p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Logística de despacho
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Remitos</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestión de despachos y entrega de mercadería a clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={cargar} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button onClick={() => setModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Remito
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Package className="h-3.5 w-3.5" />Total</p>
            <p className="text-2xl font-bold">{resumen.total}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-amber-500" />Pendientes</p>
            <p className="text-2xl font-bold text-amber-700">{resumen.pendientes}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />Entregados</p>
            <p className="text-2xl font-bold text-green-700">{resumen.entregados}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Remitos</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar cliente o número..." className="pl-9 h-9 w-56 text-sm" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              </div>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  {ESTADOS.map((e) => (<SelectItem key={e} value={e}>{e}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-t">
                <tr>
                  <th className="text-left p-3 font-medium">Nro.</th>
                  <th className="text-left p-3 font-medium">Cliente</th>
                  <th className="text-left p-3 font-medium">Fecha</th>
                  <th className="text-left p-3 font-medium">Factura</th>
                  <th className="text-left p-3 font-medium">Incoterm</th>
                  <th className="text-right p-3 font-medium">Líneas</th>
                  <th className="text-left p-3 font-medium">Estado</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono text-xs">R-{String(r.numero).padStart(6, "0")}</td>
                    <td className="p-3">
                      <p className="font-medium">{r.cliente?.nombre ?? "—"}</p>
                      {r.cliente?.cuit && <p className="text-xs text-muted-foreground">{r.cliente.cuit}</p>}
                    </td>
                    <td className="p-3 text-muted-foreground">{new Date(r.fecha).toLocaleDateString("es-AR")}</td>
                    <td className="p-3 font-mono text-xs">
                      {r.factura ? `FAC ${r.factura.tipo} ${String(r.factura.puntoVenta).padStart(4, "0")}-${String(r.factura.numero).padStart(8, "0")}` : "—"}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {r.incoterm?.nombre ?? "—"}
                    </td>
                    <td className="p-3 text-right">
                      <span className="flex items-center justify-end gap-1"><Package className="h-3.5 w-3.5 text-muted-foreground" />{r.lineas.length}</span>
                    </td>
                    <td className="p-3">
                      <Badge variant={r.estado === "entregado" ? "default" : r.estado === "anulado" ? "destructive" : "secondary"} className="text-xs">{r.estado}</Badge>
                    </td>
                    <td className="p-3">
                      {r.estado === "pendiente" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => cambiarEstado(r.id, "entregado")}>
                          <Truck className="h-3 w-3 mr-1" />Entregar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">{loading ? "Cargando..." : "No hay remitos para mostrar."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Nuevo Remito</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {error && <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>ID Cliente</Label>
                <Input type="number" placeholder="Ej: 1" value={clienteId} onChange={(e) => setClienteId(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>ID Factura (opcional)</Label>
                <Input type="number" placeholder="Ej: 42" value={facturaId} onChange={(e) => setFacturaId(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Incoterm (opcional)</Label>
              <Select value={incotermId} onValueChange={setIncotermId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Sin incoterm —</SelectItem>
                  {incoterms.map((inc) => (
                    <SelectItem key={inc.id} value={String(inc.id)}>{inc.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Observaciones</Label>
              <Textarea placeholder="Detalles del despacho..." value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Líneas del remito</Label>
                <Button type="button" variant="ghost" size="sm" onClick={agregarLinea}>
                  <Plus className="h-3 w-3 mr-1" />Agregar
                </Button>
              </div>
              {lineas.map((l, i) => (
                <div key={i} className="grid grid-cols-6 gap-2">
                  <Input className="col-span-3 text-sm" placeholder="Descripción" value={l.descripcion} onChange={(e) => actualizarLinea(i, "descripcion", e.target.value)} />
                  <Input className="text-sm" type="number" placeholder="Cant." value={l.cantidad} onChange={(e) => actualizarLinea(i, "cantidad", e.target.value)} />
                  <Select value={l.unidad} onValueChange={(v) => actualizarLinea(i, "unidad", v)}>
                    <SelectTrigger className="text-sm col-span-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unidad">Unidad</SelectItem>
                      <SelectItem value="kg">Kg</SelectItem>
                      <SelectItem value="litro">Litro</SelectItem>
                      <SelectItem value="metro">Metro</SelectItem>
                      <SelectItem value="caja">Caja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={crearRemito} disabled={creando}>{creando ? "Creando..." : "Crear Remito"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
