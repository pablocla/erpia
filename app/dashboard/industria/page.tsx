"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Factory, Plus, Search, Pencil, PlayCircle, PauseCircle, CheckCircle2, Layers } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"

interface Producto {
  id: number
  nombre: string
  codigo: string
}

interface BOM {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  producto?: Producto
  componentes: { id: number; descripcion: string; cantidad: number; unidad: string; producto?: Producto }[]
}

interface OrdenProduccion {
  id: number
  numero: string
  estado: string
  cantidad: number
  cantidadProd: number
  fechaInicio?: string
  fechaFinPlan?: string
  fechaFinReal?: string
  observaciones?: string
  bom?: { id: number; nombre: string; codigo: string }
  producto?: Producto
}

const ESTADOS_ORDEN: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  borrador: { label: "Borrador", variant: "secondary" },
  en_proceso: { label: "En proceso", variant: "default" },
  pausada: { label: "Pausada", variant: "outline" },
  terminada: { label: "Terminada", variant: "default" },
  anulada: { label: "Anulada", variant: "destructive" },
}

const ESTADO_COLORS: Record<string, string> = {
  borrador: "bg-gray-100 text-gray-700",
  en_proceso: "bg-blue-100 text-blue-700",
  pausada: "bg-yellow-100 text-yellow-700",
  terminada: "bg-green-100 text-green-700",
  anulada: "bg-red-100 text-red-700",
}

const initialOrdenForm = {
  numero: "", cantidad: "", bomId: "", productoId: "", fechaInicio: "", fechaFinPlan: "", observaciones: "",
}

const initialBomForm = {
  codigo: "", nombre: "", descripcion: "", productoId: "",
}

export default function IndustriaPage() {
  const [ordenes, setOrdenes] = useState<OrdenProduccion[]>([])
  const [boms, setBoms] = useState<BOM[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [ordenDialogOpen, setOrdenDialogOpen] = useState(false)
  const [bomDialogOpen, setBomDialogOpen] = useState(false)
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenProduccion | null>(null)
  const [form, setForm] = useState(initialOrdenForm)
  const [bomForm, setBomForm] = useState(initialBomForm)
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  const fetchOrdenes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (filtroEstado !== "todos") params.set("estado", filtroEstado)
      const res = await fetch(`/api/industria?${params}`)
      if (res.ok) setOrdenes(await res.json())
    } finally {
      setLoading(false)
    }
  }, [search, filtroEstado])

  const fetchBoms = useCallback(async () => {
    const res = await fetch("/api/industria/bom")
    if (res.ok) setBoms(await res.json())
  }, [])

  const fetchProductos = useCallback(async () => {
    const res = await fetch("/api/productos")
    if (res.ok) setProductos(await res.json())
  }, [])

  useEffect(() => { fetchOrdenes(); fetchBoms(); fetchProductos() }, [fetchOrdenes, fetchBoms, fetchProductos])

  useKeyboardShortcuts(erpShortcuts({ onRefresh: fetchOrdenes, onNew: () => { setOrdenSeleccionada(null); setForm(initialOrdenForm); setError(""); setOrdenDialogOpen(true) } }))

  const abrirDialogNuevaOrden = () => {
    setOrdenSeleccionada(null)
    setForm(initialOrdenForm)
    setError("")
    setOrdenDialogOpen(true)
  }

  const guardarOrden = async () => {
    if (!form.numero || !form.cantidad) { setError("Número y cantidad son obligatorios"); return }
    setGuardando(true); setError("")
    try {
      const payload = {
        numero: form.numero,
        cantidad: parseFloat(form.cantidad),
        bomId: form.bomId ? parseInt(form.bomId) : null,
        productoId: form.productoId ? parseInt(form.productoId) : null,
        fechaInicio: form.fechaInicio || null,
        fechaFinPlan: form.fechaFinPlan || null,
        observaciones: form.observaciones || undefined,
      }
      const url = ordenSeleccionada ? `/api/industria/${ordenSeleccionada.id}` : "/api/industria"
      const method = ordenSeleccionada ? "PATCH" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) { const d = await res.json(); setError(d.error || "Error al guardar"); return }
      setOrdenDialogOpen(false)
      fetchOrdenes()
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstado = async (id: number, estado: string) => {
    const data: Record<string, unknown> = { estado }
    if (estado === "terminada") data.fechaFinReal = new Date().toISOString()
    await fetch(`/api/industria/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    fetchOrdenes()
  }

  const guardarBom = async () => {
    if (!bomForm.codigo || !bomForm.nombre) return
    setGuardando(true)
    try {
      const res = await fetch("/api/industria/bom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: bomForm.codigo,
          nombre: bomForm.nombre,
          descripcion: bomForm.descripcion || undefined,
          productoId: bomForm.productoId ? parseInt(bomForm.productoId) : null,
        }),
      })
      if (res.ok) { setBomDialogOpen(false); setBomForm(initialBomForm); fetchBoms() }
    } finally {
      setGuardando(false)
    }
  }

  const estadisticas = {
    enProceso: ordenes.filter((o) => o.estado === "en_proceso").length,
    terminadas: ordenes.filter((o) => o.estado === "terminada").length,
    totalBoms: boms.length,
    eficiencia: ordenes.filter((o) => o.estado === "terminada").length > 0
      ? Math.round((ordenes.filter((o) => o.estado === "terminada" && o.cantidadProd >= o.cantidad).length / ordenes.filter((o) => o.estado === "terminada").length) * 100)
      : 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Factory className="h-6 w-6 text-orange-500" />
            Industria
          </h1>
          <p className="text-muted-foreground text-sm">Órdenes de producción y listas de materiales (BOM)</p>
        </div>
        <Button onClick={abrirDialogNuevaOrden} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Orden
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">En proceso</p><p className="text-2xl font-bold text-blue-600">{estadisticas.enProceso}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Terminadas</p><p className="text-2xl font-bold text-green-600">{estadisticas.terminadas}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">BOMs activas</p><p className="text-2xl font-bold">{estadisticas.totalBoms}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Eficiencia</p><p className="text-2xl font-bold text-emerald-600">{estadisticas.eficiencia}%</p></CardContent></Card>
      </div>

      <Tabs defaultValue="ordenes">
        <TabsList>
          <TabsTrigger value="ordenes" className="gap-2"><Factory className="h-4 w-4" />Órdenes de Producción</TabsTrigger>
          <TabsTrigger value="bom" className="gap-2"><Layers className="h-4 w-4" />Lista de Materiales (BOM)</TabsTrigger>
        </TabsList>

        <TabsContent value="ordenes" className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por número..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="en_proceso">En proceso</SelectItem>
                <SelectItem value="pausada">Pausada</SelectItem>
                <SelectItem value="terminada">Terminada</SelectItem>
                <SelectItem value="anulada">Anulada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="pt-4">
              <DataTable<OrdenProduccion>
                data={ordenes}
                columns={[
                  { key: "numero", header: "Número", sortable: true, cell: (o) => <span className="font-mono font-medium">{o.numero}</span> },
                  { key: "producto" as any, header: "Producto", cell: (o) => o.producto?.nombre || "—", exportFn: (o) => o.producto?.nombre ?? "" },
                  { key: "bom" as any, header: "BOM", cell: (o) => <span className="text-sm text-muted-foreground">{o.bom?.nombre || "—"}</span>, exportFn: (o) => o.bom?.nombre ?? "" },
                  { key: "cantidad", header: "Cantidad", align: "right", sortable: true },
                  { key: "cantidadProd", header: "Producido", cell: (o) => { const progreso = o.cantidad > 0 ? Math.round((o.cantidadProd / o.cantidad) * 100) : 0; return <div className="flex items-center gap-2"><span>{o.cantidadProd}</span><div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(progreso, 100)}%` }} /></div><span className="text-xs text-muted-foreground">{progreso}%</span></div> } },
                  { key: "fechaFinPlan", header: "Fecha plan", sortable: true, cell: (o) => o.fechaFinPlan ? new Date(o.fechaFinPlan).toLocaleDateString("es-AR") : "—" },
                  { key: "estado", header: "Estado", cell: (o) => <span className={`px-2 py-0.5 rounded text-xs font-medium ${ESTADO_COLORS[o.estado] || "bg-gray-100 text-gray-700"}`}>{ESTADOS_ORDEN[o.estado]?.label || o.estado}</span> },
                  { key: "acciones" as any, header: "", cell: (o) => (
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      {o.estado === "borrador" && <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600" title="Iniciar" onClick={() => cambiarEstado(o.id, "en_proceso")}><PlayCircle className="h-3.5 w-3.5" /></Button>}
                      {o.estado === "en_proceso" && <><Button size="icon" variant="ghost" className="h-7 w-7 text-yellow-600" title="Pausar" onClick={() => cambiarEstado(o.id, "pausada")}><PauseCircle className="h-3.5 w-3.5" /></Button><Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" title="Terminar" onClick={() => cambiarEstado(o.id, "terminada")}><CheckCircle2 className="h-3.5 w-3.5" /></Button></>}
                      {o.estado === "pausada" && <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600" title="Reanudar" onClick={() => cambiarEstado(o.id, "en_proceso")}><PlayCircle className="h-3.5 w-3.5" /></Button>}
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Editar" onClick={() => { setOrdenSeleccionada(o); setForm({ numero: o.numero, cantidad: o.cantidad.toString(), bomId: o.bom?.id.toString() || "", productoId: o.producto?.id.toString() || "", fechaInicio: o.fechaInicio ? o.fechaInicio.substring(0, 10) : "", fechaFinPlan: o.fechaFinPlan ? o.fechaFinPlan.substring(0, 10) : "", observaciones: o.observaciones || "" }); setError(""); setOrdenDialogOpen(true) }}><Pencil className="h-3.5 w-3.5" /></Button>
                    </div>
                  ) },
                ] as DataTableColumn<OrdenProduccion>[]}
                rowKey="id"
                searchPlaceholder="Buscar orden..."
                searchKeys={["numero"]}
                exportFilename="ordenes-produccion"
                loading={loading}
                emptyMessage="No hay órdenes de producción"
                emptyIcon={<EmptyStateIllustration type="generico" compact title="Sin órdenes" description="Creá una orden de producción." />}
                defaultPageSize={25}
                compact
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bom" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setBomDialogOpen(true)} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Nueva BOM
            </Button>
          </div>
          <div className="grid gap-4">
            {boms.map((bom) => (
              <Card key={bom.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{bom.nombre}</CardTitle>
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{bom.codigo}</span>
                  </div>
                  {bom.producto && <p className="text-sm text-muted-foreground">Produce: {bom.producto.nombre}</p>}
                </CardHeader>
                <CardContent>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">COMPONENTES ({bom.componentes.length})</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {bom.componentes.map((c) => (
                      <div key={c.id} className="text-sm bg-muted/50 rounded px-2 py-1">
                        <span className="font-medium">{c.cantidad} {c.unidad}</span>
                        <span className="text-muted-foreground"> — {c.producto?.nombre || c.descripcion}</span>
                      </div>
                    ))}
                    {bom.componentes.length === 0 && <p className="text-muted-foreground text-sm col-span-3">Sin componentes cargados</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {boms.length === 0 && <p className="text-muted-foreground text-center py-8">No hay listas de materiales registradas</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Orden de Producción */}
      <Dialog open={ordenDialogOpen} onOpenChange={setOrdenDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{ordenSeleccionada ? "Editar Orden" : "Nueva Orden de Producción"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Número *</Label>
                <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="OP-001" />
              </div>
              <div className="space-y-1">
                <Label>Cantidad *</Label>
                <Input type="number" step="0.01" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Lista de Materiales (BOM)</Label>
              <Select value={form.bomId} onValueChange={(v) => setForm({ ...form, bomId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar BOM..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin BOM</SelectItem>
                  {boms.map((b) => <SelectItem key={b.id} value={b.id.toString()}>{b.nombre} ({b.codigo})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Producto a fabricar</Label>
              <Select value={form.productoId} onValueChange={(v) => setForm({ ...form, productoId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar producto..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin especificar</SelectItem>
                  {productos.map((p) => <SelectItem key={p.id} value={p.id.toString()}>{p.nombre} ({p.codigo})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Fecha inicio</Label>
                <Input type="date" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Fecha fin planificada</Label>
                <Input type="date" value={form.fechaFinPlan} onChange={(e) => setForm({ ...form, fechaFinPlan: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Observaciones</Label>
              <Input value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrdenDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardarOrden} disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog BOM */}
      <Dialog open={bomDialogOpen} onOpenChange={setBomDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva Lista de Materiales</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Código *</Label>
                <Input value={bomForm.codigo} onChange={(e) => setBomForm({ ...bomForm, codigo: e.target.value })} placeholder="BOM-001" />
              </div>
              <div className="space-y-1">
                <Label>Nombre *</Label>
                <Input value={bomForm.nombre} onChange={(e) => setBomForm({ ...bomForm, nombre: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Descripción</Label>
              <Input value={bomForm.descripcion} onChange={(e) => setBomForm({ ...bomForm, descripcion: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Producto que produce</Label>
              <Select value={bomForm.productoId} onValueChange={(v) => setBomForm({ ...bomForm, productoId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin especificar</SelectItem>
                  {productos.map((p) => <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBomDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardarBom} disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
