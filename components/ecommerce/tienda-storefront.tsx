"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ShoppingCart,
  Sparkles,
  Truck,
  Package,
  Search,
  CheckCircle2,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Building2,
  Banknote,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { cn } from "@/lib/utils"
import type { MedioPagoEcommerce, MediosPagoConfig, TransferenciaInstrucciones } from "@/lib/ecommerce/types"

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

interface TiendaStorefrontProps {
  empresaId: number
  slug?: string | null
  canalVentaCodigo?: string
  pagoReturn?: string | null
  pedidoReturn?: string | null
}

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
})

const MEDIOS_DEFAULT: MediosPagoConfig = {
  mercadopago: true,
  transferencia: true,
  confirmarSinPago: true,
}

function normalizeCanalVenta(value?: string | null): string {
  const trimmed = value?.trim()
  if (!trimmed) return "ONLINE"
  const normalized = trimmed.replace(/[^a-z0-9]/gi, "").toLowerCase()
  if (normalized === "ecommerce" || normalized === "ecom") return "ONLINE"
  return trimmed
}

export function TiendaStorefront({
  empresaId,
  slug,
  canalVentaCodigo: canalProp,
  pagoReturn,
  pedidoReturn,
}: TiendaStorefrontProps) {
  const { toast } = useToast()
  const canalVentaCodigo = normalizeCanalVenta(canalProp)

  const [productos, setProductos] = useState<ProductoCatalogo[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [pedido, setPedido] = useState<PedidoResponse | null>(null)
  const [transferencia, setTransferencia] = useState<TransferenciaInstrucciones | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const [tiendaNombre, setTiendaNombre] = useState<string | null>(null)
  const [mediosPago, setMediosPago] = useState<MediosPagoConfig>(MEDIOS_DEFAULT)
  const [medioPago, setMedioPago] = useState<MedioPagoEcommerce>("confirmar_sin_pago")

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

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.precioUnitario * item.cantidad, 0), [cart])
  const impuestos = useMemo(() => subtotal * 0.21, [subtotal])
  const total = useMemo(() => subtotal + impuestos, [subtotal, impuestos])
  const cartItemCount = useMemo(() => cart.reduce((acc, item) => acc + item.cantidad, 0), [cart])

  useEffect(() => {
    if (pagoReturn === "ok" && pedidoReturn) {
      setPedido({ id: 0, numero: pedidoReturn, estado: "confirmado", total: 0 })
      toast({ title: "Pago recibido", description: `Tu pedido #${pedidoReturn} fue confirmado.` })
    }
  }, [pagoReturn, pedidoReturn, toast])

  useEffect(() => {
    if (Number.isNaN(empresaId)) return
    const configUrl = slug
      ? `/api/ecommerce/tienda/${slug}`
      : `/api/ecommerce/tienda?empresaId=${empresaId}`

    fetch(configUrl)
      .then((r) => r.json())
      .then((data) => {
        const medios = data.mediosPago ?? MEDIOS_DEFAULT
        setMediosPago(medios)
        if (data.nombreTienda) setTiendaNombre(data.nombreTienda)
        if (medios.mercadopago) setMedioPago("mercadopago")
        else if (medios.transferencia) setMedioPago("transferencia")
        else setMedioPago("confirmar_sin_pago")
      })
      .catch(() => {})
  }, [empresaId, slug])

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
        if (!response.ok) throw new Error("No se pudo cargar catalogo")
        const data = await response.json()
        setProductos(data.productos ?? [])
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") return
        toast({ title: "Catálogo", description: "Error al cargar productos", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [empresaId, search, canalVentaCodigo, toast])

  const handleAdd = (producto: ProductoCatalogo) => {
    const precioUnitario = producto.precioFinal ?? producto.precioVenta
    setCart((prev) => {
      const existing = prev.find((item) => item.productoId === producto.id)
      if (existing) {
        return prev.map((item) =>
          item.productoId === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item,
        )
      }
      return [...prev, { productoId: producto.id, nombre: producto.nombre, precioUnitario, cantidad: 1 }]
    })
    toast({ title: "Agregado al carrito", description: producto.nombre })
  }

  const updateCantidad = (productoId: number, cantidad: number) => {
    setCart((prev) => {
      if (cantidad <= 0) return prev.filter((item) => item.productoId !== productoId)
      return prev.map((item) => (item.productoId === productoId ? { ...item, cantidad } : item))
    })
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({ title: "Carrito vacío", description: "Agregá productos para continuar", variant: "destructive" })
      return
    }
    if (!cliente.nombre.trim()) {
      toast({ title: "Datos incompletos", description: "Completá el nombre para continuar", variant: "destructive" })
      return
    }

    setCheckoutLoading(true)
    try {
      const payload: Record<string, unknown> = {
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
      }

      if (medioPago === "confirmar_sin_pago") {
        payload.autoConfirmar = true
        payload.medioPago = "confirmar_sin_pago"
      } else {
        payload.medioPago = medioPago
        payload.autoConfirmar = false
      }

      const response = await fetch("/api/ecommerce/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || "No se pudo crear el pedido")

      if (data.pago?.tipo === "mercadopago" && data.pago.initPoint) {
        window.location.href = data.pago.initPoint
        return
      }

      if (data.pago?.tipo === "transferencia" && data.pago.transferencia) {
        setTransferencia(data.pago.transferencia)
      }

      setPedido({
        id: data.pedido.id,
        numero: data.pedido.numero,
        estado: data.pedido.estado,
        total: data.pedido.total,
      })
      setCart([])
      setIsCartOpen(false)

      const titulo =
        data.pedido.estado === "pendiente_pago" ? "Pedido registrado" : "Pedido confirmado"
      toast({ title: titulo, description: `Tu pedido #${data.pedido.numero} fue recibido.` })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al crear pedido"
      toast({ title: "Checkout", description: message, variant: "destructive" })
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (Number.isNaN(empresaId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md p-6 text-center">
          <CardTitle>Ecommerce ERP</CardTitle>
          <CardDescription className="mt-2">Falta empresaId para mostrar el catálogo.</CardDescription>
        </Card>
      </div>
    )
  }

  if (pedido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-lg shadow-xl text-center p-8">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-6" />
          <CardTitle className="text-3xl mb-2">
            {pedido.estado === "pendiente_pago" ? "Pedido registrado" : "¡Pedido confirmado!"}
          </CardTitle>
          <CardDescription className="text-lg">
            Tu orden <strong className="text-foreground">#{pedido.numero}</strong> fue recibida.
          </CardDescription>

          {transferencia && (
            <div className="mt-6 bg-amber-50 dark:bg-amber-950/30 rounded-xl p-5 text-left border border-amber-200 text-sm space-y-2">
              <p className="font-semibold text-amber-900 dark:text-amber-100">Transferencia bancaria</p>
              <p className="text-muted-foreground">{transferencia.mensaje}</p>
              {transferencia.alias && <p>Alias: <strong>{transferencia.alias}</strong></p>}
              {transferencia.cbu && <p>CBU: <strong>{transferencia.cbu}</strong></p>}
              <p>Referencia: <strong>{transferencia.referencia}</strong></p>
            </div>
          )}

          <div className="mt-8 bg-slate-50 dark:bg-slate-900 rounded-xl p-6 text-left border">
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground">Estado</span>
              <Badge variant="secondary" className="capitalize">{pedido.estado.replace(/_/g, " ")}</Badge>
            </div>
            {pedido.total > 0 && (
              <div className="flex justify-between items-center font-medium">
                <span className="text-muted-foreground">Total</span>
                <span className="text-xl">{currency.format(pedido.total)}</span>
              </div>
            )}
          </div>

          <Button
            className="mt-8 w-full"
            size="lg"
            onClick={() => {
              setPedido(null)
              setTransferencia(null)
            }}
          >
            Volver a la Tienda
          </Button>
        </Card>
      </div>
    )
  }

  const mediosDisponibles: { id: MedioPagoEcommerce; label: string; icon: typeof CreditCard }[] = []
  if (mediosPago.mercadopago) mediosDisponibles.push({ id: "mercadopago", label: "Mercado Pago", icon: CreditCard })
  if (mediosPago.transferencia) mediosDisponibles.push({ id: "transferencia", label: "Transferencia", icon: Building2 })
  if (mediosPago.confirmarSinPago) mediosDisponibles.push({ id: "confirmar_sin_pago", label: "Confirmar sin pago online", icon: Banknote })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex-shrink-0">
            <BrandLogo size="sm" variant="group-full" showByClaver={false} />
            {tiendaNombre && (
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{tiendaNombre}</p>
            )}
          </div>

          <div className="flex-1 max-w-xl hidden md:block relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="w-full pl-10 bg-slate-100 dark:bg-slate-800 border-none focus-visible:ring-1"
              placeholder="Buscar productos, categorías o SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative pl-4 pr-5 h-10 border-slate-200 shadow-sm rounded-full bg-white hover:bg-slate-50">
                <ShoppingCart className="h-4 w-4 mr-2" />
                <span className="font-semibold">{currency.format(total)}</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
              <SheetHeader className="p-6 border-b text-left">
                <SheetTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Tu Carrito
                </SheetTitle>
                <SheetDescription>Revisá los items antes de finalizar la compra.</SheetDescription>
              </SheetHeader>

              <ScrollArea className="flex-1 p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
                    <ShoppingCart className="h-12 w-12 opacity-20 mb-4" />
                    <p>El carrito está vacío</p>
                    <Button variant="link" onClick={() => setIsCartOpen(false)}>Continuar comprando</Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map((item) => (
                      <div key={item.productoId} className="flex gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-foreground truncate">{item.nombre}</h4>
                          <p className="text-sm font-semibold mt-1">{currency.format(item.precioUnitario)}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-md p-1 h-9">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={() => updateCantidad(item.productoId, item.cantidad - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">{item.cantidad}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={() => updateCantidad(item.productoId, item.cantidad + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => updateCantidad(item.productoId, 0)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {cart.length > 0 && (
                <div className="p-6 border-t bg-slate-50 dark:bg-slate-900">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{currency.format(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IVA (21%)</span>
                      <span>{currency.format(impuestos)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{currency.format(total)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Datos de facturación</h4>
                    <Input placeholder="Nombre completo" value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} />
                    <Input placeholder="Email (opcional)" type="email" value={cliente.email} onChange={(e) => setCliente({ ...cliente, email: e.target.value })} />
                    <Input placeholder="CUIT/DNI (opcional)" value={cliente.cuit || cliente.dni} onChange={(e) => setCliente({ ...cliente, cuit: e.target.value })} />

                    {mediosDisponibles.length > 1 && (
                      <div className="pt-2 space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Medio de pago</h4>
                        <div className="grid gap-2">
                          {mediosDisponibles.map((m) => {
                            const Icon = m.icon
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => setMedioPago(m.id)}
                                className={cn(
                                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                                  medioPago === m.id
                                    ? "border-primary bg-primary/5"
                                    : "border-slate-200 hover:bg-slate-100 dark:border-slate-700",
                                )}
                              >
                                <Icon className="h-4 w-4 shrink-0 text-primary" />
                                <span>{m.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <Button className="w-full mt-4" size="lg" onClick={handleCheckout} disabled={checkoutLoading}>
                      {checkoutLoading
                        ? "Procesando..."
                        : medioPago === "mercadopago"
                          ? "Pagar con Mercado Pago"
                          : medioPago === "transferencia"
                            ? "Confirmar y ver datos de transferencia"
                            : "Finalizar compra"}
                    </Button>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <section className="relative overflow-hidden bg-slate-950 text-white pb-20 pt-16 md:pt-28 md:pb-32 px-4 border-b-8 border-primary">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 px-4 py-1.5 text-sm rounded-full backdrop-blur-md">
            <Sparkles className="w-4 h-4 mr-2" /> {tiendaNombre ?? "Tienda Online Claver"}
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-[var(--font-fraunces)] font-bold tracking-tight mb-6 leading-tight">
            Todo lo que tu negocio necesita, <br className="hidden md:block" /> a un clic de distancia.
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 font-light">
            Catálogo conectado al ERP. Stock en vivo, precios actualizados y checkout integrado.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-5 py-2.5 backdrop-blur-md border border-white/10">
              <Package className="h-4 w-4 text-primary" /> Stock en vivo
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-5 py-2.5 backdrop-blur-md border border-white/10">
              <Truck className="h-4 w-4 text-primary" /> Envíos coordinados
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-12 -mt-10 relative z-20">
        <div className="md:hidden mb-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            className="w-full pl-12 h-14 rounded-2xl bg-white shadow-xl shadow-slate-200/50 border-slate-100 text-lg"
            placeholder="Buscar en la tienda..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-[var(--font-fraunces)] font-semibold text-slate-900 dark:text-white">
            {search ? `Resultados para "${search}"` : "Productos destacados"}
          </h2>
          <span className="text-sm text-muted-foreground font-medium bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full">
            {productos.length} items
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-32 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <Package className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No encontramos productos</h3>
            <p className="text-muted-foreground mt-1">Intentá con otra búsqueda o categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productos.map((producto) => (
              <Card key={producto.id} className="group overflow-hidden border-transparent bg-white shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 flex flex-col h-full rounded-2xl dark:bg-slate-900 dark:hover:border-slate-700">
                <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 relative p-6 flex items-center justify-center overflow-hidden">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 shadow-inner rotate-3 group-hover:rotate-6 group-hover:scale-110 transition-transform duration-500 flex items-center justify-center">
                    <Package className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                  </div>
                  {producto.stock < 10 && producto.stock > 0 && (
                    <Badge variant="destructive" className="absolute top-3 right-3 shadow-md">Últimos {producto.stock}</Badge>
                  )}
                  {!producto.stock && (
                    <Badge variant="secondary" className="absolute top-3 right-3">Sin stock</Badge>
                  )}
                </div>
                <CardContent className="p-5 flex-1 flex flex-col">
                  {producto.categoria?.nombre && (
                    <span className="text-[10px] font-bold tracking-wider uppercase text-primary mb-2 block">
                      {producto.categoria.nombre}
                    </span>
                  )}
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 leading-tight mb-2 line-clamp-2">
                    {producto.nombre}
                  </h3>
                  <div className="mt-auto pt-4 flex items-end justify-between">
                    <div>
                      {producto.precioFinal && producto.precioFinal !== producto.precioVenta && (
                        <p className="text-xs text-muted-foreground line-through mb-0.5">
                          {currency.format(producto.precioVenta)}
                        </p>
                      )}
                      <p className="text-xl font-bold text-slate-900 dark:text-white">
                        {currency.format(producto.precioFinal ?? producto.precioVenta)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="rounded-full shadow-md"
                      onClick={() => handleAdd(producto)}
                      disabled={producto.stock <= 0}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}