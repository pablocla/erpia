"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ChevronRight, Plus, RefreshCw, Trash2, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"

type ListaPrecio = {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
}

type Producto = {
  id: number
  codigo: string
  nombre: string
  precioVenta: number
}

type Cliente = {
  id: number
  nombre: string
  cuit?: string | null
  listaPrecioId?: number | null
}

type EscalonPrecio = {
  id: number
  cantidadDesde: number
  cantidadHasta: number | null
  precio: number
  descuentoPct: number
}

type ItemListaPrecio = {
  id: number
  precio: number
  descuento: number
  productoId: number
  producto: Producto
  escalones?: EscalonPrecio[]
  escalonesExpanded?: boolean
}

export default function ListasPrecioPage() {
  const [listas, setListas] = useState<ListaPrecio[]>([])
  const [items, setItems] = useState<ItemListaPrecio[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [listaActivaId, setListaActivaId] = useState<string>("")
  const [productoId, setProductoId] = useState<string>("")
  const [precio, setPrecio] = useState<string>("")
  const [descuento, setDescuento] = useState<string>("0")
  const [buscadorProducto, setBuscadorProducto] = useState("")
  const [buscadorCliente, setBuscadorCliente] = useState("")
  const [clientesSeleccionados, setClientesSeleccionados] = useState<number[]>([])

  // Nuevo escalón a agregar
  const [escalonItemId, setEscalonItemId] = useState<number | null>(null)
  const [escalonDesde, setEscalonDesde] = useState<string>("")
  const [escalonHasta, setEscalonHasta] = useState<string>("")
  const [escalonPrecio, setEscalonPrecio] = useState<string>("")

  const headers = () => {
    const token = localStorage.getItem("token")
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  const cargar = async () => {
    setLoading(true)
    try {
      const [resListas, resProductos, resClientes] = await Promise.all([
        fetch("/api/maestros/listas-precio?take=200", { headers: headers() }),
        fetch("/api/productos", { headers: headers() }),
        fetch("/api/clientes", { headers: headers() }),
      ])
      const dataListas = await resListas.json()
      const dataProductos = await resProductos.json()
      const dataClientes = await resClientes.json()

      const listasData = Array.isArray(dataListas.data) ? dataListas.data : []
      setListas(listasData)
      setProductos(Array.isArray(dataProductos) ? dataProductos : [])
      setClientes(Array.isArray(dataClientes) ? dataClientes : [])

      if (!listaActivaId && listasData.length > 0) {
        setListaActivaId(String(listasData[0].id))
      }
    } finally {
      setLoading(false)
    }
  }

  const cargarItems = async (id: string) => {
    if (!id) {
      setItems([])
      return
    }
    const res = await fetch(`/api/precios/items?listaPrecioId=${id}`, { headers: headers() })
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
  }

  const crear = async () => {
    if (!nombre.trim()) return
    await fetch("/api/maestros/listas-precio", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        activo: true,
      }),
    })
    setNombre("")
    setDescripcion("")
    await cargar()
  }

  const toggleActiva = async (item: ListaPrecio) => {
    await fetch("/api/maestros/listas-precio", {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ id: item.id, activo: !item.activo }),
    })
    await cargar()
  }

  const guardarItem = async () => {
    if (!listaActivaId || !productoId || Number(precio) <= 0) return

    await fetch("/api/precios/items", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        listaPrecioId: Number(listaActivaId),
        productoId: Number(productoId),
        precio: Number(precio),
        descuento: Number(descuento || 0),
      }),
    })

    setProductoId("")
    setPrecio("")
    setDescuento("0")
    await cargarItems(listaActivaId)
  }

  const actualizarItem = async (itemId: number, data: { precio?: number; descuento?: number }) => {
    await fetch("/api/precios/items", {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ id: itemId, ...data }),
    })
    await cargarItems(listaActivaId)
  }

  const eliminarItem = async (itemId: number) => {
    await fetch(`/api/precios/items?id=${itemId}`, { method: "DELETE", headers: headers() })
    await cargarItems(listaActivaId)
  }

  // ─── ESCALONES ───────────────────────────────────────────────────────────────

  const toggleEscalones = async (item: ItemListaPrecio) => {
    if (item.escalonesExpanded) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, escalonesExpanded: false } : i)),
      )
      return
    }

    const res = await fetch(`/api/precios/escalones?itemListaPrecioId=${item.id}`, { headers: headers() })
    const data = await res.json()
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, escalones: Array.isArray(data) ? data : [], escalonesExpanded: true }
          : i,
      ),
    )
    setEscalonItemId(item.id)
  }

  const agregarEscalon = async (itemId: number) => {
    if (!escalonDesde || !escalonPrecio) return
    await fetch("/api/precios/escalones", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        itemListaPrecioId: itemId,
        cantidadDesde: Number(escalonDesde),
        cantidadHasta: escalonHasta ? Number(escalonHasta) : null,
        precio: Number(escalonPrecio),
        descuentoPct: 0,
      }),
    })
    setEscalonDesde("")
    setEscalonHasta("")
    setEscalonPrecio("")
    // Recargar escalones del item
    const res = await fetch(`/api/precios/escalones?itemListaPrecioId=${itemId}`, { headers: headers() })
    const data = await res.json()
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, escalones: Array.isArray(data) ? data : [] } : i)),
    )
  }

  const eliminarEscalon = async (escalonId: number, itemId: number) => {
    await fetch(`/api/precios/escalones?id=${escalonId}`, { method: "DELETE", headers: headers() })
    const res = await fetch(`/api/precios/escalones?itemListaPrecioId=${itemId}`, { headers: headers() })
    const data = await res.json()
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, escalones: Array.isArray(data) ? data : [] } : i)),
    )
  }

  // ─── CLIENTES ────────────────────────────────────────────────────────────────

  const toggleCliente = (clienteId: number, checked: boolean) => {
    setClientesSeleccionados((prev) =>
      checked ? [...prev, clienteId] : prev.filter((id) => id !== clienteId),
    )
  }

  const asignarListaAClientes = async () => {
    if (!listaActivaId || clientesSeleccionados.length === 0) return

    await fetch("/api/clientes/lista-precio", {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({
        listaPrecioId: Number(listaActivaId),
        clienteIds: clientesSeleccionados,
      }),
    })

    setClientesSeleccionados([])
    await cargar()
  }

  const productosFiltrados = productos.filter(
    (p) =>
      !buscadorProducto ||
      p.nombre.toLowerCase().includes(buscadorProducto.toLowerCase()) ||
      p.codigo.toLowerCase().includes(buscadorProducto.toLowerCase()),
  )

  const clientesFiltrados = clientes.filter(
    (c) =>
      !buscadorCliente ||
      c.nombre.toLowerCase().includes(buscadorCliente.toLowerCase()) ||
      (c.cuit || "").includes(buscadorCliente),
  )

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: cargar,
  }))

  useEffect(() => {
    void cargar()
  }, [])

  useEffect(() => {
    if (listaActivaId) {
      void cargarItems(listaActivaId)
    }
  }, [listaActivaId])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Listas de Precio</h1>
          <p className="text-muted-foreground">Precios por segmento, descuentos y escalones por volumen.</p>
        </div>
        <Button variant="outline" onClick={cargar} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva lista</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Minorista" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Descripción</Label>
            <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Precios de mostrador" />
          </div>
          <div className="sm:col-span-3">
            <Button onClick={crear}>
              <Plus className="h-4 w-4 mr-2" />
              Crear lista
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listas existentes ({listas.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {listas.map((item) => (
            <div key={item.id} className="border rounded-lg px-3 py-2 flex items-center justify-between">
              <div>
                <p className="font-medium">{item.nombre}</p>
                <p className="text-xs text-muted-foreground">{item.descripcion || "Sin descripción"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Activa</span>
                <Switch checked={item.activo} onCheckedChange={() => toggleActiva(item)} />
              </div>
            </div>
          ))}
          {listas.length === 0 && <p className="text-sm text-muted-foreground">No hay listas cargadas.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items de lista de precio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1 lg:col-span-2">
              <Label>Lista activa</Label>
              <Select value={listaActivaId || undefined} onValueChange={setListaActivaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar lista" />
                </SelectTrigger>
                <SelectContent>
                  {listas.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 lg:col-span-3">
              <Label>Buscar producto</Label>
              <Input
                value={buscadorProducto}
                onChange={(e) => setBuscadorProducto(e.target.value)}
                placeholder="Código o nombre"
              />
            </div>

            <div className="space-y-1 lg:col-span-2">
              <Label>Producto</Label>
              <Select value={productoId || undefined} onValueChange={setProductoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {productosFiltrados.slice(0, 100).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.codigo} - {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Precio</Label>
              <Input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} min="0" step="0.01" />
            </div>

            <div className="space-y-1">
              <Label>Desc. %</Label>
              <Input type="number" value={descuento} onChange={(e) => setDescuento(e.target.value)} min="0" max="100" step="0.01" />
            </div>

            <div className="flex items-end">
              <Button onClick={guardarItem} className="w-full">Guardar item</Button>
            </div>
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="border rounded-lg overflow-hidden">
                {/* Row principal del item */}
                <div className="px-3 py-2 grid gap-2 md:grid-cols-5 md:items-center">
                  <div className="md:col-span-2">
                    <p className="font-medium text-sm">{item.producto.codigo} - {item.producto.nombre}</p>
                    <p className="text-xs text-muted-foreground">Base: ${Number(item.producto.precioVenta).toFixed(2)}</p>
                  </div>

                  <Input
                    type="number"
                    defaultValue={Number(item.precio)}
                    min="0"
                    step="0.01"
                    onBlur={(e) => {
                      const nuevo = Number(e.target.value)
                      if (nuevo > 0 && nuevo !== Number(item.precio)) {
                        void actualizarItem(item.id, { precio: nuevo })
                      }
                    }}
                  />

                  <Input
                    type="number"
                    defaultValue={Number(item.descuento)}
                    min="0"
                    max="100"
                    step="0.01"
                    onBlur={(e) => {
                      const nuevo = Number(e.target.value)
                      if (nuevo >= 0 && nuevo <= 100 && nuevo !== Number(item.descuento)) {
                        void actualizarItem(item.id, { descuento: nuevo })
                      }
                    }}
                  />

                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleEscalones(item)}
                      title="Escalones por volumen"
                    >
                      <TrendingDown className="h-4 w-4 mr-1" />
                      {item.escalonesExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      {item.escalones && item.escalones.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">{item.escalones.length}</Badge>
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => eliminarItem(item.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                {/* Panel de escalones (expandible) */}
                {item.escalonesExpanded && (
                  <div className="bg-muted/30 border-t px-4 py-3 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Escalones de precio por cantidad
                    </p>

                    {/* Escalones existentes */}
                    {(item.escalones ?? []).length > 0 ? (
                      <div className="space-y-1">
                        {(item.escalones ?? []).map((e) => (
                          <div key={e.id} className="flex items-center gap-2 text-sm bg-background rounded px-3 py-1.5">
                            <span className="font-mono text-xs text-muted-foreground w-32">
                              {e.cantidadDesde}
                              {e.cantidadHasta ? `–${e.cantidadHasta}` : "+"} uds.
                            </span>
                            <span className="font-medium">${Number(e.precio).toFixed(2)}</span>
                            {Number(e.descuentoPct) > 0 && (
                              <Badge variant="outline" className="text-xs">{Number(e.descuentoPct)}% desc.</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-auto h-6 w-6"
                              onClick={() => eliminarEscalon(e.id, item.id)}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin escalones. El precio único aplica para cualquier cantidad.</p>
                    )}

                    {/* Agregar nuevo escalón */}
                    <div className="grid grid-cols-4 gap-2 items-end pt-1">
                      <div className="space-y-1">
                        <Label className="text-xs">Desde (uds.)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={escalonItemId === item.id ? escalonDesde : ""}
                          onChange={(e) => { setEscalonItemId(item.id); setEscalonDesde(e.target.value) }}
                          placeholder="6"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Hasta (vacío = sin límite)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={escalonItemId === item.id ? escalonHasta : ""}
                          onChange={(e) => { setEscalonItemId(item.id); setEscalonHasta(e.target.value) }}
                          placeholder="12"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Precio unitario</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={escalonItemId === item.id ? escalonPrecio : ""}
                          onChange={(e) => { setEscalonItemId(item.id); setEscalonPrecio(e.target.value) }}
                          placeholder="85.00"
                          className="h-8 text-sm"
                        />
                      </div>
                      <Button size="sm" className="h-8" onClick={() => agregarEscalon(item.id)}>
                        <Plus className="h-3 w-3 mr-1" />
                        Agregar
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ejemplo: 1–5 uds. → $100 | 6–12 uds. → $85 | 13+ uds. → $70 (tramo sin límite)
                    </p>
                  </div>
                )}
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-muted-foreground">No hay items configurados para esta lista.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asignación masiva a clientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-2">
              <Label>Buscar cliente</Label>
              <Input
                value={buscadorCliente}
                onChange={(e) => setBuscadorCliente(e.target.value)}
                placeholder="Nombre o CUIT"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={() => setClientesSeleccionados(clientesFiltrados.slice(0, 100).map((c) => c.id))}
              >
                Seleccionar visibles
              </Button>
              <Button variant="ghost" onClick={() => setClientesSeleccionados([])}>
                Limpiar
              </Button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
            {clientesFiltrados.slice(0, 120).map((cliente) => (
              <label key={cliente.id} className="flex items-center justify-between gap-3 border rounded-md p-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{cliente.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {cliente.cuit || "Sin CUIT"} · Lista actual: {cliente.listaPrecioId ? `#${cliente.listaPrecioId}` : "sin asignar"}
                  </p>
                </div>
                <Checkbox
                  checked={clientesSeleccionados.includes(cliente.id)}
                  onCheckedChange={(v) => toggleCliente(cliente.id, Boolean(v))}
                />
              </label>
            ))}
            {clientesFiltrados.length === 0 && <p className="text-sm text-muted-foreground">No hay clientes para mostrar.</p>}
          </div>

          <Button onClick={asignarListaAClientes} disabled={!listaActivaId || clientesSeleccionados.length === 0}>
            Aplicar lista activa a {clientesSeleccionados.length} cliente(s)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
