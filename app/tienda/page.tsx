"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ShoppingCart, Sparkles, Truck, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface ProductoCatalogo {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  precioVenta: number
  precioFinal?: number
  stock: number
  unidad: string
  categoria?: { id: number; nombre: string } | null
}

interface CartItem {
  productoId: number
  nombre: string
  precioUnitario: number
  cantidad: number
}

interface PedidoResponse {
  id: number
  numero: string
  estado: string
  total: number
}

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
})

const defaultEmpresaId = Number(process.env.NEXT_PUBLIC_ECOMMERCE_EMPRESA_ID ?? "1")

function normalizeCanalVenta(value?: string | null): string {
  const trimmed = value?.trim()
  if (!trimmed) return "ONLINE"
  const normalized = trimmed.replace(/[^a-z0-9]/gi, "").toLowerCase()
  if (normalized === "ecommerce" || normalized === "ecom") return "ONLINE"
  return trimmed
}

export default function TiendaPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const empresaId = Number(searchParams.get("empresaId") ?? defaultEmpresaId)
  const canalVentaCodigo = normalizeCanalVenta(searchParams.get("canal"))

  const [productos, setProductos] = useState<ProductoCatalogo[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [pedido, setPedido] = useState<PedidoResponse | null>(null)

  const [cliente, setCliente] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    direccionComplemento: "",
    codigoPostal: "",
    dni: "",
    cuit: "",
    observaciones: "",
  })

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.precioUnitario * item.cantidad, 0)
  }, [cart])

  const impuestos = useMemo(() => subtotal * 0.21, [subtotal])
  const total = useMemo(() => subtotal + impuestos, [subtotal, impuestos])

  useEffect(() => {
    if (Number.isNaN(empresaId)) return

    const controller = new AbortController()
    setLoading(true)

    const timeout = setTimeout(async () => {
      try {
        const url = new URL("/api/ecommerce/catalogo", window.location.origin)
        url.searchParams.set("empresaId", String(empresaId))
        url.searchParams.set("soloConStock", "true")
        url.searchParams.set("canalVentaCodigo", canalVentaCodigo)
        if (search.trim()) url.searchParams.set("search", search.trim())

        const response = await fetch(url.toString(), { signal: controller.signal })
        if (!response.ok) {
          throw new Error("No se pudo cargar catalogo")
        }
        const data = await response.json()
        setProductos(data.productos ?? [])
      } catch (error: any) {
        if (error?.name === "AbortError") return
        toast({ title: "Catalogo", description: "Error al cargar productos" })
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [empresaId, search, toast])

  const handleAdd = (producto: ProductoCatalogo) => {
    const precioUnitario = producto.precioFinal ?? producto.precioVenta
    setCart((prev) => {
      const existing = prev.find((item) => item.productoId === producto.id)
      if (existing) {
        return prev.map((item) =>
          item.productoId === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item,
        )
      }
      return [...prev, { productoId: producto.id, nombre: producto.nombre, precioUnitario, cantidad: 1 }]
    })
  }

  const updateCantidad = (productoId: number, cantidad: number) => {
    setCart((prev) => {
      if (cantidad <= 0) return prev.filter((item) => item.productoId !== productoId)
      return prev.map((item) => (item.productoId === productoId ? { ...item, cantidad } : item))
    })
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({ title: "Carrito vacio", description: "Agrega productos para continuar" })
      return
    }
    if (!cliente.nombre.trim()) {
      toast({ title: "Datos incompletos", description: "Completa el nombre" })
      return
    }

    try {
      const payload = {
        empresaId,
        canalVentaCodigo,
        observaciones: cliente.observaciones || undefined,
        cliente: {
          nombre: cliente.nombre,
          email: cliente.email || undefined,
          telefono: cliente.telefono || undefined,
          direccion: cliente.direccion || undefined,
          direccionComplemento: cliente.direccionComplemento || undefined,
          codigoPostal: cliente.codigoPostal || undefined,
          dni: cliente.dni || undefined,
          cuit: cliente.cuit || undefined,
        },
        lineas: cart.map((item) => ({ productoId: item.productoId, cantidad: item.cantidad })),
        autoConfirmar: true,
      }

      const response = await fetch("/api/ecommerce/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "No se pudo crear el pedido")
      }

      setPedido({
        id: data.pedido.id,
        numero: data.pedido.numero,
        estado: data.pedido.estado,
        total: data.pedido.total,
      })
      setCart([])
      toast({ title: "Pedido creado", description: `Pedido ${data.pedido.numero}` })
    } catch (error: any) {
      toast({ title: "Checkout", description: error?.message || "Error al crear pedido" })
    }
  }

  if (Number.isNaN(empresaId)) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(248,246,241,0.9),_transparent_55%),_linear-gradient(120deg,_rgba(248,248,246,1),_rgba(234,242,246,0.9))] px-6 py-20">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/70 bg-white/80 p-10 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.45)]">
          <h1 className="text-3xl font-[var(--font-fraunces)] text-slate-900">Ecommerce ERP</h1>
          <p className="mt-3 text-sm text-slate-600">Falta empresaId para mostrar el catalogo.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(248,246,241,0.9),_transparent_55%),_linear-gradient(120deg,_rgba(248,248,246,1),_rgba(234,242,246,0.9))]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <Badge className="w-fit bg-slate-900 text-white">Tienda oficial</Badge>
            <h1 className="text-4xl font-[var(--font-fraunces)] text-slate-900 md:text-5xl">
              Compras directas, stock en tiempo real.
            </h1>
            <p className="max-w-2xl text-base text-slate-600">
              Catalogo corporativo conectado al ERP. Pedidos confirmados, picking inmediato y trazabilidad de entrega.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="gap-2 px-4 py-2 text-slate-700">
              <Sparkles className="h-4 w-4" />
              Precios automaticos
            </Badge>
            <Badge variant="secondary" className="gap-2 px-4 py-2 text-slate-700">
              <Truck className="h-4 w-4" />
              Entrega 24/48
            </Badge>
            <Badge variant="secondary" className="gap-2 px-4 py-2 text-slate-700">
              <Package className="h-4 w-4" />
              Stock visible
            </Badge>
          </div>
        </header>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <Card className="relative overflow-hidden border-white/60 bg-white/80 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.45)]">
              <div className="pointer-events-none absolute -left-28 top-10 h-40 w-40 rounded-full bg-amber-200/50 blur-3xl" />
              <div className="pointer-events-none absolute -right-20 top-24 h-36 w-36 rounded-full bg-sky-200/60 blur-3xl" />
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">Buscar productos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Buscar por nombre, codigo o categoria"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                  <span>{productos.length} productos visibles</span>
                  <span>Empresa {empresaId}</span>
                  <span>Canal {canalVentaCodigo}</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-5 md:grid-cols-2">
              {loading && (
                <Card className="col-span-full border-dashed bg-white/70">
                  <CardContent className="py-10 text-center text-sm text-slate-500">Cargando catalogo...</CardContent>
                </Card>
              )}
              {!loading && productos.length === 0 && (
                <Card className="col-span-full border-dashed bg-white/70">
                  <CardContent className="py-10 text-center text-sm text-slate-500">Sin productos disponibles</CardContent>
                </Card>
              )}
              {!loading && productos.map((producto) => (
                <Card key={producto.id} className="border-white/70 bg-white/90 shadow-[0_25px_60px_-50px_rgba(15,23,42,0.4)]">
                  <CardHeader className="space-y-3">
                    <CardTitle className="text-base text-slate-900">{producto.nombre}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>SKU {producto.codigo}</span>
                      {producto.categoria?.nombre && (
                        <Badge variant="outline" className="text-[11px]">
                          {producto.categoria.nombre}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600">
                      {producto.descripcion || "Producto listo para entrega inmediata."}
                    </p>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-lg font-semibold text-slate-900">{currency.format(producto.precioFinal ?? producto.precioVenta)}</div>
                        <div className="text-xs text-slate-500">Stock {producto.stock} {producto.unidad}</div>
                      </div>
                      <Button onClick={() => handleAdd(producto)} disabled={producto.stock <= 0}>
                        Agregar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-white/60 bg-white/90 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.45)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                  <ShoppingCart className="h-4 w-4" />
                  Carrito
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
                    Sin items. Selecciona productos para armar tu pedido.
                  </div>
                )}
                {cart.map((item) => (
                  <div key={item.productoId} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white p-3">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{item.nombre}</div>
                      <div className="text-xs text-slate-500">{currency.format(item.precioUnitario)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => updateCantidad(item.productoId, item.cantidad - 1)}>-</Button>
                      <Input
                        className="h-8 w-14 text-center"
                        type="number"
                        min={1}
                        value={item.cantidad}
                        onChange={(event) => updateCantidad(item.productoId, Number(event.target.value))}
                      />
                      <Button variant="outline" size="sm" onClick={() => updateCantidad(item.productoId, item.cantidad + 1)}>+</Button>
                    </div>
                  </div>
                ))}
                <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>{currency.format(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Impuestos</span>
                    <span>{currency.format(impuestos)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                    <span>Total</span>
                    <span>{currency.format(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/60 bg-white/95 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.45)]">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">Checkout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Nombre y apellido"
                  value={cliente.nombre}
                  onChange={(event) => setCliente({ ...cliente, nombre: event.target.value })}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Email"
                    value={cliente.email}
                    onChange={(event) => setCliente({ ...cliente, email: event.target.value })}
                  />
                  <Input
                    placeholder="Telefono"
                    value={cliente.telefono}
                    onChange={(event) => setCliente({ ...cliente, telefono: event.target.value })}
                  />
                </div>
                <Input
                  placeholder="Direccion de entrega"
                  value={cliente.direccion}
                  onChange={(event) => setCliente({ ...cliente, direccion: event.target.value })}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Complemento"
                    value={cliente.direccionComplemento}
                    onChange={(event) => setCliente({ ...cliente, direccionComplemento: event.target.value })}
                  />
                  <Input
                    placeholder="Codigo postal"
                    value={cliente.codigoPostal}
                    onChange={(event) => setCliente({ ...cliente, codigoPostal: event.target.value })}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="DNI"
                    value={cliente.dni}
                    onChange={(event) => setCliente({ ...cliente, dni: event.target.value })}
                  />
                  <Input
                    placeholder="CUIT"
                    value={cliente.cuit}
                    onChange={(event) => setCliente({ ...cliente, cuit: event.target.value })}
                  />
                </div>
                <Textarea
                  placeholder="Observaciones"
                  value={cliente.observaciones}
                  onChange={(event) => setCliente({ ...cliente, observaciones: event.target.value })}
                />
                <Button className="w-full" onClick={handleCheckout}>
                  Confirmar pedido
                </Button>
              </CardContent>
            </Card>

            {pedido && (
              <Card className="border-white/60 bg-white/90 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.45)]">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">Pedido creado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  <div>Numero: {pedido.numero}</div>
                  <div>Estado: {pedido.estado}</div>
                  <div>Total: {currency.format(pedido.total)}</div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
