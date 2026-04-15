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
import { Badge } from "@/components/ui/badge"
import { ScanLine, Plus, Search, CheckCircle2, Clock, AlertCircle, ListChecks } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"

interface LineaPicking {
  id: number
  descripcion: string
  cantidadPedida: number
  cantidadPicada: number
  ubicacion?: string
  estado: string
  producto?: { id: number; nombre: string; codigo: string }
}

interface ListaPicking {
  id: number
  numero: string
  estado: string
  prioridad: string
  zonaAlmacen?: string
  operario?: string
  notas?: string
  remito?: { id: number; numero: number }
  lineas: LineaPicking[]
}

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  en_proceso: "bg-blue-100 text-blue-700",
  completada: "bg-green-100 text-green-700",
  anulada: "bg-red-100 text-red-700",
}

const PRIORIDAD_COLORS: Record<string, string> = {
  baja: "bg-gray-100 text-gray-600",
  normal: "bg-blue-50 text-blue-600",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700",
}

interface NuevaLinea {
  descripcion: string
  cantidadPedida: string
  ubicacion: string
  productoId: string
}

interface Producto {
  id: number
  nombre: string
  codigo: string
}

const initialForm = {
  numero: "", prioridad: "normal", zonaAlmacen: "", operario: "", notas: "",
}

export default function PickingPage() {
  const [listas, setListas] = useState<ListaPicking[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false)
  const [listaSeleccionada, setListaSeleccionada] = useState<ListaPicking | null>(null)
  const [form, setForm] = useState(initialForm)
  const [lineas, setLineas] = useState<NuevaLinea[]>([{ descripcion: "", cantidadPedida: "1", ubicacion: "", productoId: "" }])
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  const fetchListas = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (filtroEstado !== "todos") params.set("estado", filtroEstado)
      const res = await fetch(`/api/picking?${params}`)
      if (res.ok) setListas(await res.json())
    } finally {
      setLoading(false)
    }
  }, [search, filtroEstado])

  const fetchProductos = useCallback(async () => {
    const res = await fetch("/api/productos")
    if (res.ok) setProductos(await res.json())
  }, [])

  useEffect(() => { fetchListas(); fetchProductos() }, [fetchListas, fetchProductos])

  useKeyboardShortcuts(erpShortcuts({ onRefresh: fetchListas, onNew: () => { setForm(initialForm); setError(""); setDialogOpen(true) } }))

  const agregarLinea = () => setLineas([...lineas, { descripcion: "", cantidadPedida: "1", ubicacion: "", productoId: "" }])
  const actualizarLinea = (idx: number, campo: keyof NuevaLinea, valor: string) => {
    const nuevas = [...lineas]
    nuevas[idx] = { ...nuevas[idx], [campo]: valor }
    setLineas(nuevas)
  }
  const quitarLinea = (idx: number) => setLineas(lineas.filter((_, i) => i !== idx))

  const guardarLista = async () => {
    if (!form.numero) { setError("El número es obligatorio"); return }
    const lineasValidas = lineas.filter((l) => l.descripcion.trim())
    if (lineasValidas.length === 0) { setError("Debe agregar al menos un artículo"); return }
    setGuardando(true); setError("")
    try {
      const payload = {
        numero: form.numero,
        prioridad: form.prioridad,
        zonaAlmacen: form.zonaAlmacen || undefined,
        operario: form.operario || undefined,
        notas: form.notas || undefined,
        lineas: lineasValidas.map((l) => ({
          descripcion: l.descripcion,
          cantidadPedida: parseFloat(l.cantidadPedida) || 1,
          ubicacion: l.ubicacion || undefined,
          productoId: l.productoId ? parseInt(l.productoId) : null,
        })),
      }
      const res = await fetch("/api/picking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) { const d = await res.json(); setError(d.error || "Error al guardar"); return }
      setDialogOpen(false)
      fetchListas()
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstado = async (id: number, estado: string) => {
    await fetch(`/api/picking/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado }) })
    fetchListas()
    if (listaSeleccionada?.id === id) {
      const res = await fetch(`/api/picking/${id}`)
      if (res.ok) setListaSeleccionada(await res.json())
    }
  }

  const actualizarCantidadPicada = async (lista: ListaPicking, lineaId: number, cantidad: number) => {
    const lineasActualizadas = lista.lineas.map((l) => l.id === lineaId ? { ...l, cantidadPicada: cantidad } : l)
    setListaSeleccionada({ ...lista, lineas: lineasActualizadas })
  }

  const confirmarPicking = async () => {
    if (!listaSeleccionada) return
    setGuardando(true)
    try {
      const allDone = listaSeleccionada.lineas.every((l) => l.cantidadPicada >= l.cantidadPedida)
      await fetch(`/api/picking/${listaSeleccionada.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: allDone ? "completada" : "en_proceso",
          lineas: listaSeleccionada.lineas.map((l) => ({ id: l.id, cantidadPicada: l.cantidadPicada })),
        }),
      })
      setDetalleDialogOpen(false)
      fetchListas()
    } finally {
      setGuardando(false)
    }
  }

  const estadisticas = {
    pendientes: listas.filter((l) => l.estado === "pendiente").length,
    enProceso: listas.filter((l) => l.estado === "en_proceso").length,
    completadas: listas.filter((l) => l.estado === "completada").length,
    urgentes: listas.filter((l) => l.prioridad === "urgente" && l.estado !== "completada").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScanLine className="h-6 w-6 text-violet-500" />
            Picking
          </h1>
          <p className="text-muted-foreground text-sm">Armado de pedidos y control de recogida en almacén</p>
        </div>
        <Button onClick={() => { setForm(initialForm); setLineas([{ descripcion: "", cantidadPedida: "1", ubicacion: "", productoId: "" }]); setError(""); setDialogOpen(true) }} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Lista
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Pendientes</p><p className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">En proceso</p><p className="text-2xl font-bold text-blue-600">{estadisticas.enProceso}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Completadas</p><p className="text-2xl font-bold text-green-600">{estadisticas.completadas}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground flex items-center gap-1"><AlertCircle className="h-3 w-3 text-red-500" />Urgentes</p><p className="text-2xl font-bold text-red-600">{estadisticas.urgentes}</p></CardContent></Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_proceso">En proceso</SelectItem>
            <SelectItem value="completada">Completada</SelectItem>
            <SelectItem value="anulada">Anulada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="pt-4">
          <DataTable<ListaPicking>
            data={listas}
            columns={[
              { key: "numero", header: "Número", sortable: true, cell: (l) => <span className="font-mono font-medium">{l.numero}</span> },
              { key: "zonaAlmacen", header: "Zona", cell: (l) => l.zonaAlmacen || "—" },
              { key: "operario", header: "Operario", cell: (l) => l.operario || "—" },
              { key: "prioridad", header: "Prioridad", cell: (l) => <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORIDAD_COLORS[l.prioridad] || ""}`}>{l.prioridad}</span> },
              { key: "lineas" as any, header: "Items", cell: (l) => l.lineas.length, exportFn: (l) => String(l.lineas.length) },
              { key: "progreso" as any, header: "Progreso", cell: (l) => { const total = l.lineas.length; const completos = l.lineas.filter((ln) => ln.cantidadPicada >= ln.cantidadPedida).length; const pct = total > 0 ? Math.round((completos / total) * 100) : 0; return <div className="flex items-center gap-2"><div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} /></div><span className="text-xs text-muted-foreground">{completos}/{total}</span></div> } },
              { key: "estado", header: "Estado", cell: (l) => <span className={`px-2 py-0.5 rounded text-xs font-medium ${ESTADO_COLORS[l.estado] || "bg-gray-100 text-gray-700"}`}>{l.estado}</span> },
              { key: "acciones" as any, header: "", cell: (l) => <div className="flex gap-1" onClick={e => e.stopPropagation()}><Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setListaSeleccionada(l); setDetalleDialogOpen(true) }}><ListChecks className="h-3 w-3" /> Picar</Button>{l.estado === "pendiente" && <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600" title="Iniciar" onClick={() => cambiarEstado(l.id, "en_proceso")}><Clock className="h-3.5 w-3.5" /></Button>}</div> },
            ] as DataTableColumn<ListaPicking>[]}
            rowKey="id"
            searchPlaceholder="Buscar lista..."
            searchKeys={["numero", "operario", "zonaAlmacen"]}
            exportFilename="listas-picking"
            loading={loading}
            emptyMessage="No hay listas de picking"
            emptyIcon={<EmptyStateIllustration type="generico" compact title="Sin listas" description="Creá una lista de picking." />}
            defaultPageSize={25}
            compact
          />
        </CardContent>
      </Card>

      {/* Dialog Nueva Lista */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Lista de Picking</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Número *</Label>
                <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="PK-001" />
              </div>
              <div className="space-y-1">
                <Label>Prioridad</Label>
                <Select value={form.prioridad} onValueChange={(v) => setForm({ ...form, prioridad: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Zona / Almacén</Label>
                <Input value={form.zonaAlmacen} onChange={(e) => setForm({ ...form, zonaAlmacen: e.target.value })} placeholder="Pasillo A" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Operario asignado</Label>
              <Input value={form.operario} onChange={(e) => setForm({ ...form, operario: e.target.value })} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Artículos a picar *</Label>
                <Button type="button" variant="outline" size="sm" onClick={agregarLinea} className="gap-1 h-7 text-xs">
                  <Plus className="h-3 w-3" /> Agregar
                </Button>
              </div>
              <div className="space-y-2">
                {lineas.map((l, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4 space-y-1">
                      {idx === 0 && <Label className="text-xs">Descripción</Label>}
                      <Input value={l.descripcion} onChange={(e) => actualizarLinea(idx, "descripcion", e.target.value)} placeholder="Artículo..." className="h-8 text-sm" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      {idx === 0 && <Label className="text-xs">Cantidad</Label>}
                      <Input type="number" step="0.01" value={l.cantidadPedida} onChange={(e) => actualizarLinea(idx, "cantidadPedida", e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="col-span-3 space-y-1">
                      {idx === 0 && <Label className="text-xs">Ubicación</Label>}
                      <Input value={l.ubicacion} onChange={(e) => actualizarLinea(idx, "ubicacion", e.target.value)} placeholder="A-01-01" className="h-8 text-sm" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      {idx === 0 && <Label className="text-xs">Producto</Label>}
                      <Select value={l.productoId} onValueChange={(v) => actualizarLinea(idx, "productoId", v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Vincular..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sin vincular</SelectItem>
                          {productos.map((p) => <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1">
                      {lineas.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => quitarLinea(idx)}>×</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardarLista} disabled={guardando}>{guardando ? "Guardando..." : "Crear Lista"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalle / Picar */}
      <Dialog open={detalleDialogOpen} onOpenChange={setDetalleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5" />
              Lista {listaSeleccionada?.numero} — Picking
            </DialogTitle>
          </DialogHeader>
          {listaSeleccionada && (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Zona: <strong>{listaSeleccionada.zonaAlmacen || "—"}</strong></span>
                <span>Operario: <strong>{listaSeleccionada.operario || "—"}</strong></span>
                <span>
                  Prioridad: <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${PRIORIDAD_COLORS[listaSeleccionada.prioridad]}`}>{listaSeleccionada.prioridad}</span>
                </span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artículo</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Picado</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listaSeleccionada.lineas.map((linea) => {
                    const completo = linea.cantidadPicada >= linea.cantidadPedida
                    return (
                      <TableRow key={linea.id} className={completo ? "bg-green-50 dark:bg-green-900/10" : ""}>
                        <TableCell>
                          <p className="font-medium">{linea.descripcion}</p>
                          {linea.producto && <p className="text-xs text-muted-foreground">{linea.producto.codigo}</p>}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{linea.ubicacion || "—"}</TableCell>
                        <TableCell className="font-medium">{linea.cantidadPedida}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            max={linea.cantidadPedida}
                            value={linea.cantidadPicada}
                            onChange={(e) => actualizarCantidadPicada(listaSeleccionada, linea.id, parseFloat(e.target.value) || 0)}
                            className="h-7 w-20 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          {completo
                            ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                            : <Clock className="h-4 w-4 text-yellow-500" />
                          }
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {listaSeleccionada.estado !== "completada" && listaSeleccionada.estado !== "anulada" && (
                    <Button variant="outline" onClick={() => cambiarEstado(listaSeleccionada.id, "anulada")} className="text-destructive">
                      Anular
                    </Button>
                  )}
                </div>
                <Button onClick={confirmarPicking} disabled={guardando} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {guardando ? "Guardando..." : "Confirmar Picking"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
