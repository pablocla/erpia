"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit2, PackageX, AlertTriangle, RefreshCw, TrendingUp, TrendingDown, SlidersHorizontal } from "lucide-react"

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

  const authHeaders = useCallback(() => {
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
        return
      }
      setDialogOpen(false)
      cargarProductos()
    } catch {
      setError("Error de conexión")
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

  const desactivarProducto = async (id: number) => {
    if (!confirm("¿Desactivar este producto?")) return
    await fetch(`/api/productos/${id}`, { method: "DELETE", headers: authHeaders() })
    cargarProductos()
  }

  const stockBajoCount = productos.filter((p) => p.stock <= p.stockMinimo).length

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

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>{productosFiltrados.length} producto(s)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Cargando...</div>
          ) : productosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <PackageX className="h-12 w-12 mx-auto mb-2 opacity-30" />
              No hay productos
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">P. Compra</TableHead>
                  <TableHead className="text-right">P. Venta</TableHead>
                  <TableHead>IVA</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productosFiltrados.map((p) => {
                  const stockBajo = p.stock <= p.stockMinimo
                  return (
                    <TableRow key={p.id} className={!p.activo ? "opacity-50" : ""}>
                      <TableCell className="font-mono text-sm">{p.codigo}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{p.nombre}</p>
                          {p.descripcion && (
                            <p className="text-xs text-muted-foreground truncate max-w-48">{p.descripcion}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.categoria ? (
                          <Badge variant="secondary">{p.categoria.nombre}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">${p.precioCompra.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">${p.precioVenta.toFixed(2)}</TableCell>
                      <TableCell>{p.porcentajeIva}%</TableCell>
                      <TableCell className="text-right">
                        <span className={stockBajo ? "text-red-600 font-bold" : ""}>
                          {p.stock} {p.unidad}
                        </span>
                        {stockBajo && <AlertTriangle className="inline h-3 w-3 ml-1 text-red-500" />}
                      </TableCell>
                      <TableCell>
                        {p.activo ? (
                          <Badge className="bg-green-100 text-green-800">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Ajustar stock"
                            onClick={() => {
                              setProductoSeleccionado(p)
                              setAjusteDialogOpen(true)
                            }}
                          >
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Editar" onClick={() => abrirEditar(p)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {p.activo && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Desactivar"
                              onClick={() => desactivarProducto(p.id)}
                            >
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
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
    </div>
  )
}
