"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Plus, UtensilsCrossed, Trash2 } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useConfirm } from "@/hooks/use-confirm"

interface Categoria {
  id: number
  nombre: string
}

interface Producto {
  id: number
  codigo: string
  nombre: string
  precioVenta: number
  porcentajeIva: number
  unidad: string
  categoria?: Categoria
}

interface ComponenteReceta {
  id: number
  productoId: number | null
  cantidad: number
  unidad: string
  producto?: Producto
}

interface Receta {
  id: number
  descripcion?: string | null
  componentes: ComponenteReceta[]
}

interface Plato {
  producto: Producto
  receta: Receta | null
}

interface Insumo {
  id: number
  nombre: string
  codigo: string
  unidad: string
}

const UNIDADES = ["unidad", "kg", "gramo", "litro", "ml", "porcion", "caja", "pack"]

const initialForm = {
  codigo: "",
  nombre: "",
  precioVenta: "",
  porcentajeIva: "21",
  unidad: "porcion",
  categoriaId: "",
  descripcion: "",
}

const initialLinea = { productoId: "", cantidad: "1", unidad: "unidad" }

export default function PlatosPage() {
  const [platos, setPlatos] = useState<Plato[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")
  const [platoSeleccionado, setPlatoSeleccionado] = useState<Plato | null>(null)
  const [form, setForm] = useState(initialForm)
  const [componentes, setComponentes] = useState([initialLinea])

  const authHeaders = useCallback((): HeadersInit => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const cargarPlatos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/hospitalidad/platos", { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setPlatos(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  const cargarInsumos = useCallback(async () => {
    const res = await fetch("/api/productos?esInsumo=true", { headers: authHeaders() })
    if (res.ok) {
      const data = await res.json()
      setInsumos(Array.isArray(data) ? data : [])
    }
  }, [authHeaders])

  const cargarCategorias = useCallback(async () => {
    const res = await fetch("/api/categorias", { headers: authHeaders() })
    if (res.ok) {
      const data = await res.json()
      setCategorias(Array.isArray(data) ? data : [])
    }
  }, [authHeaders])

  useEffect(() => {
    cargarPlatos()
    cargarInsumos()
    cargarCategorias()
  }, [cargarPlatos, cargarInsumos, cargarCategorias])

  useKeyboardShortcuts(erpShortcuts({ onRefresh: cargarPlatos, onNew: () => { setPlatoSeleccionado(null); setForm(initialForm); setComponentes([initialLinea]); setError(""); setDialogOpen(true) } }))

  const abrirNuevo = () => {
    setPlatoSeleccionado(null)
    setForm(initialForm)
    setComponentes([initialLinea])
    setError("")
    setDialogOpen(true)
  }

  const abrirEditar = (plato: Plato) => {
    setPlatoSeleccionado(plato)
    setForm({
      codigo: plato.producto.codigo,
      nombre: plato.producto.nombre,
      precioVenta: plato.producto.precioVenta.toString(),
      porcentajeIva: plato.producto.porcentajeIva.toString(),
      unidad: plato.producto.unidad,
      categoriaId: plato.producto.categoria?.id?.toString() || "",
      descripcion: plato.receta?.descripcion ?? "",
    })
    const lineas = plato.receta?.componentes?.length
      ? plato.receta.componentes.map((c) => ({
          productoId: c.productoId ? String(c.productoId) : "",
          cantidad: c.cantidad.toString(),
          unidad: c.unidad || "unidad",
        }))
      : [initialLinea]
    setComponentes(lineas)
    setError("")
    setDialogOpen(true)
  }

  const agregarLinea = () => setComponentes((prev) => [...prev, initialLinea])
  const quitarLinea = (idx: number) => setComponentes((prev) => prev.filter((_, i) => i !== idx))

  const actualizarLinea = (idx: number, field: keyof typeof initialLinea, value: string) => {
    setComponentes((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)))
  }

  const guardarPlato = async () => {
    setError("")
    if (!form.codigo || !form.nombre || !form.precioVenta) {
      setError("Código, nombre y precio son obligatorios")
      return
    }

    const lineasValidas = componentes.filter((c) => c.productoId && Number(c.cantidad) > 0)
    if (lineasValidas.length === 0) {
      setError("Debe agregar al menos un insumo a la receta")
      return
    }

    const payload = {
      productoId: platoSeleccionado?.producto.id,
      producto: {
        codigo: form.codigo,
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        precioVenta: Number(form.precioVenta),
        porcentajeIva: Number(form.porcentajeIva),
        unidad: form.unidad,
        categoriaId: form.categoriaId ? Number(form.categoriaId) : null,
      },
      receta: {
        descripcion: form.descripcion || undefined,
        componentes: lineasValidas.map((c) => ({
          productoId: Number(c.productoId),
          cantidad: Number(c.cantidad),
          unidad: c.unidad || "unidad",
        })),
      },
    }

    setGuardando(true)
    try {
      const res = await fetch("/api/hospitalidad/platos", {
        method: platoSeleccionado ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Error al guardar")
        return
      }
      setDialogOpen(false)
      cargarPlatos()
    } catch {
      setError("Error de conexión")
    } finally {
      setGuardando(false)
    }
  }

  const { confirm, ConfirmDialog } = useConfirm()

  const desactivarPlato = async (plato: Plato) => {
    const ok = await confirm({
      title: "Desactivar plato",
      description: `¿Desactivar el plato ${plato.producto.nombre}?`,
      confirmLabel: "Desactivar",
      variant: "destructive",
    })
    if (!ok) return
    const res = await fetch(`/api/hospitalidad/platos?productoId=${plato.producto.id}`, {
      method: "DELETE",
      headers: authHeaders(),
    })
    if (res.ok) cargarPlatos()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-amber-500" />
            Platos y Recetas
          </h1>
          <p className="text-muted-foreground text-sm">ABM de platos gastronómicos e insumos</p>
        </div>
        <Button onClick={abrirNuevo} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Plato
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platos ({platos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner className="h-6 w-6" />
            </div>
          ) : (
            <DataTable<Plato>
              data={platos}
              columns={[
                { key: "producto" as any, header: "Código", sortable: true, cell: (p) => <span className="font-mono text-xs">{p.producto.codigo}</span>, exportFn: (p) => p.producto.codigo },
                { key: "nombre" as any, header: "Plato", cell: (p) => p.producto.nombre, exportFn: (p) => p.producto.nombre },
                { key: "precio" as any, header: "Precio", sortable: true, cell: (p) => `$${p.producto.precioVenta.toFixed(2)}`, exportFn: (p) => String(p.producto.precioVenta) },
                { key: "receta" as any, header: "Receta", cell: (p) => `${p.receta?.componentes?.length ?? 0} insumos` },
                { key: "acciones" as any, header: "Acciones", cell: (p) => <div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); abrirEditar(p) }}>Editar</Button><Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); desactivarPlato(p) }}><Trash2 className="h-4 w-4 text-red-500" /></Button></div> },
              ] as DataTableColumn<Plato>[]}
              rowKey={(p) => String(p.producto.id)}
              searchPlaceholder="Buscar plato..."
              searchKeys={["producto"] as any}
              exportFilename="platos"
              emptyMessage="Sin platos cargados"
              emptyIcon={<EmptyStateIllustration type="generico" compact title="Sin platos" description="Creá tu primer plato." />}
              compact
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{platoSeleccionado ? "Editar Plato" : "Nuevo Plato"}</DialogTitle>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Código *</Label>
              <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })} />
            </div>
            <div className="space-y-2">
              <Label>Precio *</Label>
              <Input type="number" value={form.precioVenta} onChange={(e) => setForm({ ...form, precioVenta: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Nombre *</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Descripción</Label>
              <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>IVA %</Label>
              <Select value={form.porcentajeIva} onValueChange={(v) => setForm({ ...form, porcentajeIva: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="10.5">10.5%</SelectItem>
                  <SelectItem value="21">21%</SelectItem>
                  <SelectItem value="27">27%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select value={form.unidad} onValueChange={(v) => setForm({ ...form, unidad: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Categoría</Label>
              <Select value={form.categoriaId || "__ninguna__"} onValueChange={(v) => setForm({ ...form, categoriaId: v === "__ninguna__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Sin categoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ninguna__">Sin categoría</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <Label>Receta (insumos)</Label>
              <Button variant="outline" size="sm" onClick={agregarLinea}>Agregar insumo</Button>
            </div>
            <div className="space-y-2">
              {componentes.map((linea, idx) => (
                <div key={idx} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-center">
                  <Select
                    value={linea.productoId || "__none__"}
                    onValueChange={(v) => actualizarLinea(idx, "productoId", v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Insumo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Seleccionar insumo</SelectItem>
                      {insumos.map((insumo) => (
                        <SelectItem key={insumo.id} value={String(insumo.id)}>{insumo.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={linea.cantidad}
                    onChange={(e) => actualizarLinea(idx, "cantidad", e.target.value)}
                    placeholder="Cant"
                  />
                  <Select
                    value={linea.unidad}
                    onValueChange={(v) => actualizarLinea(idx, "unidad", v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNIDADES.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => quitarLinea(idx)}
                    disabled={componentes.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardarPlato} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </div>
  )
}
