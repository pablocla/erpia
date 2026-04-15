"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Search, Edit2, PackageX, AlertTriangle, RefreshCw, TrendingUp, TrendingDown, SlidersHorizontal, Download, ToggleRight } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useConfirm } from "@/hooks/use-confirm"
import { useToast } from "@/hooks/use-toast"
import { FilterPanel, type FilterField, type FilterValues } from "@/components/filter-panel"

interface Categoria {
  id: number
  nombre: string
}

interface Producto {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  precioVenta: number
  precioCompra: number
  porcentajeIva: number
  stock: number
  stockMinimo: number
  unidad: string
  activo: boolean
  esPlato?: boolean
  esInsumo?: boolean
  categoria?: Categoria
}

const UNIDADES = ["unidad", "kg", "gramo", "litro", "ml", "metro", "cm", "caja", "pack", "par"]

const initialForm = {
  codigo: "",
  nombre: "",
  descripcion: "",
  precioVenta: "",
  precioCompra: "",
  porcentajeIva: "21",
  stock: "0",
  stockMinimo: "0",
  unidad: "unidad",
  categoriaId: "",
  esPlato: false,
  esInsumo: false,
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState("")
  const [soloStockBajo, setSoloStockBajo] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [ajusteDialogOpen, setAjusteDialogOpen] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [form, setForm] = useState(initialForm)
  const [ajuste, setAjuste] = useState({ cantidad: "", tipo: "entrada", motivo: "" })
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({})
  const { toast } = useToast()

  const authHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const cargarProductos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (filtroCategoria) params.set("categoriaId", filtroCategoria)
      const res = await fetch(`/api/productos?${params}`, { headers: authHeaders() })
      const data = await res.json()
      setProductos(Array.isArray(data) ? data : [])
    } catch {
      setError("Error al cargar productos")
    } finally {
      setLoading(false)
    }
  }, [search, filtroCategoria, authHeaders])

  useEffect(() => {
    cargarProductos()
  }, [cargarProductos])

  useKeyboardShortcuts(erpShortcuts({ onRefresh: cargarProductos, onNew: () => { setProductoSeleccionado(null); setForm(initialForm); setError(""); setDialogOpen(true) } }))

  useEffect(() => {
    fetch("/api/categorias", { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setCategorias(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [authHeaders])

  const productosFiltrados = soloStockBajo
    ? productos.filter((p) => p.stock <= p.stockMinimo)
    : productos

  const abrirEditar = (producto: Producto) => {
    setProductoSeleccionado(producto)
    setForm({
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion || "",
      precioVenta: producto.precioVenta.toString(),
      precioCompra: producto.precioCompra.toString(),
      porcentajeIva: producto.porcentajeIva.toString(),
      stock: producto.stock.toString(),
      stockMinimo: producto.stockMinimo.toString(),
      unidad: producto.unidad,
      categoriaId: producto.categoria?.id.toString() || "",
      esPlato: Boolean(producto.esPlato),
      esInsumo: Boolean(producto.esInsumo),
    })
    setDialogOpen(true)
  }

  const abrirNuevo = () => {
    setProductoSeleccionado(null)
    setForm(initialForm)
    setError("")
    setDialogOpen(true)
  }

  const guardarProducto = async () => {
    setError("")
    if (!form.codigo || !form.nombre || !form.precioVenta) {
      setError("Código, nombre y precio de venta son obligatorios")
      return
    }
    setGuardando(true)
    try {
      const url = productoSeleccionado ? `/api/productos/${productoSeleccionado.id}` : "/api/productos"
      const method = productoSeleccionado ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Error al guardar")
        toast({ title: "Error al guardar producto", description: data.error || "Ocurrió un error", variant: "destructive" })
        return
      }
      setDialogOpen(false)
      cargarProductos()
      toast({ title: productoSeleccionado ? "Producto actualizado" : "Producto creado", description: "Los datos se guardaron correctamente" })
    } catch {
      setError("Error de conexión")
      toast({ title: "Error de conexión", description: "No se pudo conectar con el servidor", variant: "destructive" })
    } finally {
      setGuardando(false)
    }
  }

  const ajustarStock = async () => {
    if (!productoSeleccionado || !ajuste.cantidad) return
    setGuardando(true)
    try {
      const res = await fetch(`/api/productos/${productoSeleccionado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(ajuste),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Error al ajustar stock")
        return
      }
      setAjusteDialogOpen(false)
      setAjuste({ cantidad: "", tipo: "entrada", motivo: "" })
      cargarProductos()
    } catch {
      setError("Error de conexión")
    } finally {
      setGuardando(false)
    }
  }

  const { confirm, ConfirmDialog } = useConfirm()

  const desactivarProducto = async (id: number) => {
    const ok = await confirm({
      title: "Desactivar producto",
      description: "¿Desactivar este producto? No aparecerá en ventas ni compras.",
      confirmLabel: "Desactivar",
      variant: "destructive",
    })
    if (!ok) return
    await fetch(`/api/productos/${id}`, { method: "DELETE", headers: authHeaders() })
    cargarProductos()
    toast({ title: "Producto desactivado", description: "El producto ya no aparecerá en ventas ni compras" })
  }

  const stockBajoCount = productos.filter((p) => p.stock <= p.stockMinimo).length

  const filterFields: FilterField[] = [
    { key: "stockBajo", label: "Stock bajo", type: "boolean" },
    { key: "activo", label: "Activo", type: "boolean" },
    { key: "porcentajeIva", label: "IVA", type: "select", options: [
      { value: "21", label: "21%" },
      { value: "10.5", label: "10.5%" },
      { value: "27", label: "27%" },
      { value: "0", label: "0% Exento" },
    ]},
  ]

  const productosConFiltros = useMemo(() => {
    return productosFiltrados.filter((p) => {
      if (filters.stockBajo === true && p.stock > p.stockMinimo) return false
      if (filters.activo !== undefined && p.activo !== filters.activo) return false
      if (filters.porcentajeIva && String(p.porcentajeIva) !== String(filters.porcentajeIva)) return false
      return true
    })
  }, [productosFiltrados, filters])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="text-muted-foreground">Gestión de inventario y precios</p>
        </div>
        <Button onClick={abrirNuevo}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {stockBajoCount > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{stockBajoCount} producto(s)</strong> con stock bajo o agotado.
            <Button
              variant="link"
              className="text-orange-700 p-0 h-auto ml-2"
              onClick={() => setSoloStockBajo(true)}
            >
              Ver
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-48">
              <Label className="mb-1 block">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Nombre, código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="w-48">
              <Label className="mb-1 block">Categoría</Label>
              <Select value={filtroCategoria || "__todas__"} onValueChange={(v) => setFiltroCategoria(v === "__todas__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__todas__">Todas</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant={soloStockBajo ? "default" : "outline"}
              onClick={() => setSoloStockBajo(!soloStockBajo)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Stock Bajo
            </Button>
            <Button variant="ghost" onClick={cargarProductos}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <FilterPanel fields={filterFields} values={filters} onChange={setFilters} />

      {/* Tabla con DataTable Enterprise */}
      <Card>
        <CardContent className="pt-4">
          <DataTable<Producto>
            data={productosConFiltros}
            columns={[
              {
                key: "codigo",
                header: "Código",
                sortable: true,
                cell: (p) => <span className="font-mono text-sm">{p.codigo}</span>,
              },
              {
                key: "nombre",
                header: "Nombre",
                sortable: true,
                cell: (p) => (
                  <div>
                    <p className="font-medium">{p.nombre}</p>
                    {p.descripcion && (
                      <p className="text-xs text-muted-foreground truncate max-w-48">{p.descripcion}</p>
                    )}
                  </div>
                ),
              },
              {
                key: "categoria",
                header: "Categoría",
                cell: (p) => p.categoria ? (
                  <Badge variant="secondary">{p.categoria.nombre}</Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                ),
                exportFn: (p) => p.categoria?.nombre ?? "",
              },
              {
                key: "precioCompra",
                header: "P. Compra",
                align: "right",
                sortable: true,
                cell: (p) => `$${p.precioCompra.toFixed(2)}`,
              },
              {
                key: "precioVenta",
                header: "P. Venta",
                align: "right",
                sortable: true,
                cell: (p) => <span className="font-medium">${p.precioVenta.toFixed(2)}</span>,
              },
              {
                key: "porcentajeIva",
                header: "IVA",
                cell: (p) => `${p.porcentajeIva}%`,
              },
              {
                key: "stock",
                header: "Stock",
                align: "right",
                sortable: true,
                cell: (p) => {
                  const stockBajo = p.stock <= p.stockMinimo
                  return (
                    <span className={stockBajo ? "text-red-600 font-bold" : ""}>
                      {p.stock} {p.unidad}
                      {stockBajo && <AlertTriangle className="inline h-3 w-3 ml-1 text-red-500" />}
                    </span>
                  )
                },
              },
              {
                key: "activo",
                header: "Estado",
                cell: (p) => p.activo ? (
                  <Badge className="bg-green-100 text-green-800">Activo</Badge>
                ) : (
                  <Badge variant="secondary">Inactivo</Badge>
                ),
                exportFn: (p) => p.activo ? "Activo" : "Inactivo",
              },
              {
                key: "acciones" as keyof Producto,
                header: "Acciones",
                align: "right",
                hidden: false,
                cell: (p) => (
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Ajustar stock"
                      onClick={(e) => { e.stopPropagation(); setProductoSeleccionado(p); setAjusteDialogOpen(true) }}
                    >
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Editar" onClick={(e) => { e.stopPropagation(); abrirEditar(p) }}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {p.activo && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Desactivar"
                        onClick={(e) => { e.stopPropagation(); desactivarProducto(p.id) }}
                      >
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ),
              },
            ] as DataTableColumn<Producto>[]}
            rowKey="id"
            searchPlaceholder="Buscar productos..."
            searchKeys={["codigo", "nombre"]}
            selectable
            bulkActions={(selected, clear) => (
              <>
                <Button variant="outline" size="sm" onClick={() => {
                  const h = "codigo,nombre,precioVenta,precioCompra,stock,unidad,activo"
                  const rows = selected.map((p) => [p.codigo, p.nombre, p.precioVenta, p.precioCompra, p.stock, p.unidad, p.activo ? "Activo" : "Inactivo"].map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
                  const blob = new Blob(["\uFEFF" + [h, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" })
                  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "productos-seleccionados.csv"; a.click()
                  clear()
                }}>
                  <Download className="h-4 w-4 mr-1" /> Exportar ({selected.length})
                </Button>
                <Button variant="outline" size="sm" onClick={async () => {
                  const activos = selected.filter((p) => p.activo)
                  if (!activos.length) return
                  await Promise.all(activos.map((p) => fetch(`/api/productos/${p.id}`, { method: "DELETE", headers: authHeaders() })))
                  cargarProductos(); clear()
                }}>
                  <ToggleRight className="h-4 w-4 mr-1" /> Desactivar ({selected.filter((p) => p.activo).length})
                </Button>
              </>
            )}
            exportFilename="productos"
            loading={loading}
            emptyMessage="No hay productos"
            emptyIcon={<EmptyStateIllustration type="productos" compact actionLabel="Nuevo Producto" onAction={abrirNuevo} />}
            defaultPageSize={25}
            compact
            onRowClick={abrirEditar}
          />
        </CardContent>
      </Card>

      {/* Dialog nuevo/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{productoSeleccionado ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Código *</Label>
              <Input
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                placeholder="PRD001"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={form.categoriaId || "__ninguna__"} onValueChange={(v) => setForm({ ...form, categoriaId: v === "__ninguna__" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ninguna__">Sin categoría</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Nombre del producto"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Descripción</Label>
              <Input
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Descripción opcional"
              />
            </div>

            <div className="space-y-2">
              <Label>Precio de Compra</Label>
              <Input
                type="number"
                value={form.precioCompra}
                onChange={(e) => setForm({ ...form, precioCompra: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Precio de Venta *</Label>
              <Input
                type="number"
                value={form.precioVenta}
                onChange={(e) => setForm({ ...form, precioVenta: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label>IVA %</Label>
              <Select value={form.porcentajeIva} onValueChange={(v) => setForm({ ...form, porcentajeIva: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% - Exento</SelectItem>
                  <SelectItem value="10.5">10.5%</SelectItem>
                  <SelectItem value="21">21%</SelectItem>
                  <SelectItem value="27">27%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select value={form.unidad} onValueChange={(v) => setForm({ ...form, unidad: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 flex flex-wrap gap-6 items-center">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={Boolean(form.esPlato)}
                  onChange={(e) => setForm({ ...form, esPlato: e.target.checked })}
                />
                Es plato (gastronomía)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={Boolean(form.esInsumo)}
                  onChange={(e) => setForm({ ...form, esInsumo: e.target.checked })}
                />
                Es insumo (recetas)
              </label>
            </div>

            {!productoSeleccionado && (
              <>
                <div className="space-y-2">
                  <Label>Stock inicial</Label>
                  <Input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock mínimo</Label>
                  <Input
                    type="number"
                    value={form.stockMinimo}
                    onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
                    min="0"
                  />
                </div>
              </>
            )}

            {productoSeleccionado && (
              <div className="space-y-2">
                <Label>Stock mínimo</Label>
                <Input
                  type="number"
                  value={form.stockMinimo}
                  onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
                  min="0"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarProducto} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog ajuste stock */}
      <Dialog open={ajusteDialogOpen} onOpenChange={setAjusteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Stock — {productoSeleccionado?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg text-sm">
              Stock actual: <strong>{productoSeleccionado?.stock} {productoSeleccionado?.unidad}</strong>
            </div>
            <div className="space-y-2">
              <Label>Tipo de movimiento</Label>
              <Select value={ajuste.tipo} onValueChange={(v) => setAjuste({ ...ajuste, tipo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada (aumentar stock)</SelectItem>
                  <SelectItem value="salida">Salida (reducir stock)</SelectItem>
                  <SelectItem value="ajuste">Ajuste (establecer valor exacto)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                value={ajuste.cantidad}
                onChange={(e) => setAjuste({ ...ajuste, cantidad: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input
                value={ajuste.motivo}
                onChange={(e) => setAjuste({ ...ajuste, motivo: e.target.value })}
                placeholder="Ej: Compra, inventario, merma..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setAjusteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={ajustarStock} disabled={guardando || !ajuste.cantidad}>
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </div>
  )
}
