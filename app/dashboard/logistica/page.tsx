"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Truck, Plus, Search, Pencil, Trash2, Package, MapPin, Users } from "lucide-react"

interface Transportista {
  id: number
  nombre: string
  cuit?: string
  telefono?: string
  email?: string
  activo: boolean
}

interface Envio {
  id: number
  numero: string
  estado: string
  direccionDestino: string
  fechaEmbarque?: string
  fechaEntrega?: string
  pesoKg?: number
  bultos: number
  observaciones?: string
  transportistaId?: number
  transportista?: Transportista
  remito?: { id: number; numero: number }
}

const ESTADOS_ENVIO: Record<string, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  en_transito: { label: "En tránsito", color: "bg-blue-100 text-blue-800" },
  entregado: { label: "Entregado", color: "bg-green-100 text-green-800" },
  devuelto: { label: "Devuelto", color: "bg-red-100 text-red-800" },
}

const initialEnvioForm = {
  numero: "", direccionDestino: "", transportistaId: "", remitoId: "",
  fechaEmbarque: "", fechaEntrega: "", pesoKg: "", bultos: "1", observaciones: "",
}

const initialTransportistaForm = {
  nombre: "", cuit: "", telefono: "", email: "",
}

export default function LogisticaPage() {
  const [envios, setEnvios] = useState<Envio[]>([])
  const [transportistas, setTransportistas] = useState<Transportista[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [transportistaDialogOpen, setTransportistaDialogOpen] = useState(false)
  const [envioSeleccionado, setEnvioSeleccionado] = useState<Envio | null>(null)
  const [form, setForm] = useState(initialEnvioForm)
  const [transportistaForm, setTransportistaForm] = useState(initialTransportistaForm)
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  const fetchEnvios = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (filtroEstado !== "todos") params.set("estado", filtroEstado)
      const res = await fetch(`/api/logistica?${params}`)
      if (res.ok) setEnvios(await res.json())
    } finally {
      setLoading(false)
    }
  }, [search, filtroEstado])

  const fetchTransportistas = useCallback(async () => {
    const res = await fetch("/api/logistica/transportistas")
    if (res.ok) setTransportistas(await res.json())
  }, [])

  useEffect(() => { fetchEnvios(); fetchTransportistas() }, [fetchEnvios, fetchTransportistas])

  const abrirDialogNuevo = () => {
    setEnvioSeleccionado(null)
    setForm(initialEnvioForm)
    setError("")
    setDialogOpen(true)
  }

  const abrirDialogEditar = (envio: Envio) => {
    setEnvioSeleccionado(envio)
    setForm({
      numero: envio.numero,
      direccionDestino: envio.direccionDestino,
      transportistaId: envio.transportistaId?.toString() || "",
      remitoId: envio.remito?.id?.toString() || "",
      fechaEmbarque: envio.fechaEmbarque ? envio.fechaEmbarque.substring(0, 10) : "",
      fechaEntrega: envio.fechaEntrega ? envio.fechaEntrega.substring(0, 10) : "",
      pesoKg: envio.pesoKg?.toString() || "",
      bultos: envio.bultos.toString(),
      observaciones: envio.observaciones || "",
    })
    setError("")
    setDialogOpen(true)
  }

  const guardarEnvio = async () => {
    if (!form.numero || !form.direccionDestino) { setError("Número y destino son obligatorios"); return }
    setGuardando(true); setError("")
    try {
      const payload = {
        numero: form.numero,
        direccionDestino: form.direccionDestino,
        transportistaId: form.transportistaId ? parseInt(form.transportistaId) : null,
        remitoId: form.remitoId ? parseInt(form.remitoId) : null,
        fechaEmbarque: form.fechaEmbarque || null,
        fechaEntrega: form.fechaEntrega || null,
        pesoKg: form.pesoKg ? parseFloat(form.pesoKg) : null,
        bultos: parseInt(form.bultos) || 1,
        observaciones: form.observaciones || undefined,
      }
      const url = envioSeleccionado ? `/api/logistica/${envioSeleccionado.id}` : "/api/logistica"
      const method = envioSeleccionado ? "PATCH" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) { const d = await res.json(); setError(d.error || "Error al guardar"); return }
      setDialogOpen(false)
      fetchEnvios()
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstado = async (id: number, nuevoEstado: string) => {
    await fetch(`/api/logistica/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado: nuevoEstado }) })
    fetchEnvios()
  }

  const eliminarEnvio = async (id: number) => {
    if (!confirm("¿Eliminar este envío?")) return
    await fetch(`/api/logistica/${id}`, { method: "DELETE" })
    fetchEnvios()
  }

  const guardarTransportista = async () => {
    if (!transportistaForm.nombre) { return }
    setGuardando(true)
    try {
      const res = await fetch("/api/logistica/transportistas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transportistaForm),
      })
      if (res.ok) {
        setTransportistaDialogOpen(false)
        setTransportistaForm(initialTransportistaForm)
        fetchTransportistas()
      }
    } finally {
      setGuardando(false)
    }
  }

  const estadisticas = {
    pendientes: envios.filter((e) => e.estado === "pendiente").length,
    enTransito: envios.filter((e) => e.estado === "en_transito").length,
    entregados: envios.filter((e) => e.estado === "entregado").length,
    totalBultos: envios.reduce((sum, e) => sum + e.bultos, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-emerald-500" />
            Logística
          </h1>
          <p className="text-muted-foreground text-sm">Gestión de envíos, transportistas y rutas</p>
        </div>
        <Button onClick={abrirDialogNuevo} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Envío
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Pendientes</p><p className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">En tránsito</p><p className="text-2xl font-bold text-blue-600">{estadisticas.enTransito}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Entregados</p><p className="text-2xl font-bold text-green-600">{estadisticas.entregados}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Total bultos</p><p className="text-2xl font-bold">{estadisticas.totalBultos}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="envios">
        <TabsList>
          <TabsTrigger value="envios" className="gap-2"><Package className="h-4 w-4" />Envíos</TabsTrigger>
          <TabsTrigger value="transportistas" className="gap-2"><Users className="h-4 w-4" />Transportistas</TabsTrigger>
        </TabsList>

        <TabsContent value="envios" className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por número o destino..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_transito">En tránsito</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
                <SelectItem value="devuelto">Devuelto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Transportista</TableHead>
                    <TableHead>Bultos</TableHead>
                    <TableHead>Embarque</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
                  ) : envios.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hay envíos registrados</TableCell></TableRow>
                  ) : envios.map((envio) => {
                    const est = ESTADOS_ENVIO[envio.estado] || { label: envio.estado, color: "bg-gray-100 text-gray-800" }
                    return (
                      <TableRow key={envio.id}>
                        <TableCell className="font-mono font-medium">{envio.numero}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {envio.direccionDestino}
                          </div>
                        </TableCell>
                        <TableCell>{envio.transportista?.nombre || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell>{envio.bultos}</TableCell>
                        <TableCell>{envio.fechaEmbarque ? new Date(envio.fechaEmbarque).toLocaleDateString("es-AR") : "—"}</TableCell>
                        <TableCell>
                          <Select value={envio.estado} onValueChange={(v) => cambiarEstado(envio.id, v)}>
                            <SelectTrigger className="h-7 w-36 text-xs">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${est.color}`}>{est.label}</span>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ESTADOS_ENVIO).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => abrirDialogEditar(envio)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => eliminarEnvio(envio.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transportistas" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setTransportistaDialogOpen(true)} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Agregar Transportista
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {transportistas.map((t) => (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.nombre}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  {t.cuit && <p>CUIT: {t.cuit}</p>}
                  {t.telefono && <p>Tel: {t.telefono}</p>}
                  {t.email && <p>{t.email}</p>}
                </CardContent>
              </Card>
            ))}
            {transportistas.length === 0 && (
              <p className="text-muted-foreground col-span-3 text-center py-8">No hay transportistas registrados</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Envío */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{envioSeleccionado ? "Editar Envío" : "Nuevo Envío"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Número *</Label>
                <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="E-001" />
              </div>
              <div className="space-y-1">
                <Label>Bultos</Label>
                <Input type="number" min={1} value={form.bultos} onChange={(e) => setForm({ ...form, bultos: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Dirección de destino *</Label>
              <Input value={form.direccionDestino} onChange={(e) => setForm({ ...form, direccionDestino: e.target.value })} placeholder="Av. Corrientes 1234, CABA" />
            </div>
            <div className="space-y-1">
              <Label>Transportista</Label>
              <Select value={form.transportistaId} onValueChange={(v) => setForm({ ...form, transportistaId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin transportista</SelectItem>
                  {transportistas.map((t) => <SelectItem key={t.id} value={t.id.toString()}>{t.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Fecha embarque</Label>
                <Input type="date" value={form.fechaEmbarque} onChange={(e) => setForm({ ...form, fechaEmbarque: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Fecha entrega estimada</Label>
                <Input type="date" value={form.fechaEntrega} onChange={(e) => setForm({ ...form, fechaEntrega: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Peso (kg)</Label>
              <Input type="number" step="0.1" value={form.pesoKg} onChange={(e) => setForm({ ...form, pesoKg: e.target.value })} placeholder="0.0" />
            </div>
            <div className="space-y-1">
              <Label>Observaciones</Label>
              <Input value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} placeholder="..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardarEnvio} disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Transportista */}
      <Dialog open={transportistaDialogOpen} onOpenChange={setTransportistaDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo Transportista</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Nombre *</Label>
              <Input value={transportistaForm.nombre} onChange={(e) => setTransportistaForm({ ...transportistaForm, nombre: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>CUIT</Label>
              <Input value={transportistaForm.cuit} onChange={(e) => setTransportistaForm({ ...transportistaForm, cuit: e.target.value })} placeholder="20-12345678-0" />
            </div>
            <div className="space-y-1">
              <Label>Teléfono</Label>
              <Input value={transportistaForm.telefono} onChange={(e) => setTransportistaForm({ ...transportistaForm, telefono: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={transportistaForm.email} onChange={(e) => setTransportistaForm({ ...transportistaForm, email: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransportistaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardarTransportista} disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
