"use client"

import { useState, useEffect, useCallback } from "react"
import { ShoppingCart, FileText, CreditCard, LogOut, Package, ChevronRight, Clock, CheckCircle2, AlertCircle, Search, Plus, Minus, Trash2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

// ─── TIPOS ─────────────────────────────────────────────────────────────────────

interface ClientePortal {
  id: number
  nombre: string
  cuit: string
  saldoCuentaCorriente: number
  limiteCredito: number
  condicionIva: string
}

interface Producto {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  precioVenta: number
  stock: number
  unidad: string
  categoria?: { nombre: string }
}

interface CartItem {
  productoId: number
  nombre: string
  precio: number
  cantidad: number
  unidad: string
}

interface Pedido {
  id: number
  numero: string
  estado: string
  total: number
  createdAt: string
  lineas: { descripcion: string; cantidad: number; precioUnitario: number }[]
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 })

const ESTADO_COLOR: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  confirmado: "bg-blue-100 text-blue-700",
  en_preparacion: "bg-purple-100 text-purple-700",
  despachado: "bg-orange-100 text-orange-700",
  entregado: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_preparacion: "En preparación",
  despachado: "Despachado",
  entregado: "Entregado",
  cancelado: "Cancelado",
}

// ─── LOGIN ──────────────────────────────────────────────────────────────────────

function LoginPortal({ onLogin }: { onLogin: (c: ClientePortal, empresaId: number) => void }) {
  const [cuit, setCuit] = useState("")
  const [empresaId, setEmpresaId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Pre-fill empresaId from env or query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const eid = params.get("empresa") || process.env.NEXT_PUBLIC_ECOMMERCE_EMPRESA_ID || "1"
    setEmpresaId(eid)
  }, [])

  const handleLogin = async () => {
    if (!cuit.trim()) { setError("Ingresá tu CUIT"); return }
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/portal/verify-cuit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuit: cuit.trim().replace(/-/g, ""), empresaId: parseInt(empresaId) || 1 }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "CUIT no encontrado"); return }
      localStorage.setItem("portal_cliente", JSON.stringify(data.cliente))
      localStorage.setItem("portal_empresaId", String(parseInt(empresaId) || 1))
      onLogin(data.cliente, parseInt(empresaId) || 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-primary flex items-center justify-center">
            <ShoppingCart className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Portal de Clientes</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Ingresá con tu CUIT para hacer pedidos y consultar tu cuenta</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="space-y-2">
            <label className="text-sm font-medium">CUIT</label>
            <Input
              placeholder="20-12345678-9"
              value={cuit}
              onChange={(e) => setCuit(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="text-center text-lg tracking-widest"
              maxLength={13}
            />
          </div>
          <Button className="w-full" size="lg" onClick={handleLogin} disabled={loading}>
            {loading ? "Verificando..." : "Ingresar"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            ¿Problemas para ingresar? Contactá a tu vendedor.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── HEADER PORTAL ─────────────────────────────────────────────────────────────

function PortalHeader({ cliente, cartCount, onLogout }: { cliente: ClientePortal; cartCount: number; onLogout: () => void }) {
  const saldoNegativo = cliente.saldoCuentaCorriente < 0
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{cliente.nombre}</p>
          <p className="text-xs text-muted-foreground">CUIT {cliente.cuit}</p>
        </div>
        <div className="flex items-center gap-2">
          {saldoNegativo && (
            <Badge variant="destructive" className="hidden sm:flex gap-1 text-xs">
              <AlertCircle className="h-3 w-3" />
              Deuda {currency.format(Math.abs(cliente.saldoCuentaCorriente))}
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="relative" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

// ─── TAB CATÁLOGO ──────────────────────────────────────────────────────────────

function TabCatalogo({
  empresaId,
  cart,
  onAddToCart,
  onUpdateCart,
}: {
  empresaId: number
  cart: CartItem[]
  onAddToCart: (p: Producto) => void
  onUpdateCart: (id: number, qty: number) => void
}) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ empresaId: String(empresaId), soloConStock: "true" })
        if (search) params.set("search", search)
        const res = await fetch(`/api/portal/catalogo?${params}`)
        if (res.ok) { const d = await res.json(); setProductos(d.productos ?? d) }
      } finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [empresaId, search])

  const getQty = (id: number) => cart.find((c) => c.productoId === id)?.cantidad ?? 0

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar productos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : productos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No hay productos disponibles</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {productos.map((p) => {
            const qty = getQty(p.id)
            return (
              <Card key={p.id} className={`transition-all ${p.stock <= 0 ? "opacity-50" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm leading-tight">{p.nombre}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.codigo}</p>
                      {p.categoria && <Badge variant="secondary" className="mt-1 text-[10px] h-4">{p.categoria.nombre}</Badge>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-base">{currency.format(p.precioVenta)}</p>
                      <p className="text-[10px] text-muted-foreground">x {p.unidad}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Stock: {p.stock} {p.unidad}</span>
                    {qty === 0 ? (
                      <Button size="sm" onClick={() => onAddToCart(p)} disabled={p.stock <= 0} className="h-8 gap-1">
                        <Plus className="h-3 w-3" /> Agregar
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => onUpdateCart(p.id, qty - 1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium text-sm">{qty}</span>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => onUpdateCart(p.id, qty + 1)} disabled={qty >= p.stock}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── TAB CARRITO ───────────────────────────────────────────────────────────────

function TabCarrito({
  cart,
  cliente,
  empresaId,
  onUpdateCart,
  onOrderPlaced,
}: {
  cart: CartItem[]
  cliente: ClientePortal
  empresaId: number
  onUpdateCart: (id: number, qty: number) => void
  onOrderPlaced: () => void
}) {
  const [obs, setObs] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState("")
  const [pedidoOk, setPedidoOk] = useState<string | null>(null)

  const subtotal = cart.reduce((s, i) => s + i.precio * i.cantidad, 0)

  const confirmar = async () => {
    setEnviando(true); setError("")
    try {
      const res = await fetch("/api/portal/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId,
          clienteId: cliente.id,
          observaciones: obs,
          lineas: cart.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, precioUnitario: i.precio })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Error al enviar el pedido"); return }
      setPedidoOk(data.numero)
      onOrderPlaced()
    } finally { setEnviando(false) }
  }

  if (pedidoOk) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <div>
          <p className="text-xl font-bold">¡Pedido enviado!</p>
          <p className="text-muted-foreground mt-1">Tu pedido <strong>{pedidoOk}</strong> fue recibido.</p>
          <p className="text-sm text-muted-foreground">Te avisaremos cuando esté en preparación.</p>
        </div>
        <Button onClick={() => setPedidoOk(null)} variant="outline">Hacer otro pedido</Button>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>Tu carrito está vacío</p>
        <p className="text-sm">Andá al catálogo para agregar productos</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="space-y-2">
        {cart.map((item) => (
          <div key={item.productoId} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{item.nombre}</p>
              <p className="text-xs text-muted-foreground">{currency.format(item.precio)} x {item.unidad}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => onUpdateCart(item.productoId, item.cantidad - 1)}>
                {item.cantidad === 1 ? <Trash2 className="h-3 w-3 text-destructive" /> : <Minus className="h-3 w-3" />}
              </Button>
              <span className="w-7 text-center font-medium text-sm">{item.cantidad}</span>
              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => onUpdateCart(item.productoId, item.cantidad + 1)}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <span className="text-sm font-semibold w-20 text-right">{currency.format(item.precio * item.cantidad)}</span>
          </div>
        ))}
      </div>
      <Separator />
      <div className="flex justify-between text-lg font-bold">
        <span>Total</span>
        <span>{currency.format(subtotal)}</span>
      </div>
      <Input placeholder="Observaciones (opcional)..." value={obs} onChange={(e) => setObs(e.target.value)} />
      <Button className="w-full" size="lg" onClick={confirmar} disabled={enviando}>
        {enviando ? "Enviando pedido..." : "Confirmar pedido"}
      </Button>
    </div>
  )
}

// ─── TAB PEDIDOS ───────────────────────────────────────────────────────────────

function TabPedidos({ clienteId, empresaId }: { clienteId: number; empresaId: number }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

  const fetchPedidos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/portal/pedidos?clienteId=${clienteId}&empresaId=${empresaId}`)
      if (res.ok) setPedidos(await res.json())
    } finally { setLoading(false) }
  }, [clienteId, empresaId])

  useEffect(() => { fetchPedidos() }, [fetchPedidos])

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>

  if (pedidos.length === 0) return (
    <div className="text-center py-12 text-muted-foreground">
      <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p>No tenés pedidos aún</p>
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={fetchPedidos} className="gap-1 text-xs">
          <RefreshCw className="h-3 w-3" /> Actualizar
        </Button>
      </div>
      {pedidos.map((p) => (
        <Card key={p.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-mono font-semibold text-sm">{p.numero}</p>
                <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("es-AR")}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLOR[p.estado] || "bg-gray-100 text-gray-700"}`}>
                  {ESTADO_LABEL[p.estado] || p.estado}
                </span>
                <span className="font-bold text-sm">{currency.format(p.total)}</span>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded === p.id ? "rotate-90" : ""}`} />
              </div>
            </div>
            {expanded === p.id && p.lineas?.length > 0 && (
              <div className="mt-3 pt-3 border-t space-y-1">
                {p.lineas.map((l, i) => (
                  <div key={i} className="flex justify-between text-xs text-muted-foreground">
                    <span>{l.descripcion} ×{l.cantidad}</span>
                    <span>{currency.format(l.precioUnitario * l.cantidad)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── TAB CUENTA ────────────────────────────────────────────────────────────────

function TabCuenta({ cliente, empresaId }: { cliente: ClientePortal; empresaId: number }) {
  const saldo = cliente.saldoCuentaCorriente
  const limite = cliente.limiteCredito
  const disponible = limite > 0 ? limite - Math.abs(Math.min(saldo, 0)) : null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className={saldo < 0 ? "border-red-200 bg-red-50 dark:bg-red-900/10" : "border-green-200 bg-green-50 dark:bg-green-900/10"}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Saldo cuenta corriente</p>
            <p className={`text-xl font-bold mt-1 ${saldo < 0 ? "text-red-600" : "text-green-600"}`}>
              {currency.format(Math.abs(saldo))}
            </p>
            <p className="text-xs text-muted-foreground">{saldo < 0 ? "Deuda" : saldo === 0 ? "Al día" : "A favor"}</p>
          </CardContent>
        </Card>
        {disponible !== null && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Crédito disponible</p>
              <p className="text-xl font-bold mt-1">{currency.format(disponible)}</p>
              <p className="text-xs text-muted-foreground">Límite: {currency.format(limite)}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" /> Datos fiscales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Razón social</span>
            <span className="font-medium">{cliente.nombre}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">CUIT</span>
            <span className="font-mono">{cliente.cuit}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Condición IVA</span>
            <span>{cliente.condicionIva}</span>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <CreditCard className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Para pagar saldos, transferí a la cuenta bancaria de tu distribuidor o coordiná con tu vendedor.
        </AlertDescription>
      </Alert>
    </div>
  )
}

// ─── PORTAL PRINCIPAL ──────────────────────────────────────────────────────────

export default function PortalPage() {
  const [cliente, setCliente] = useState<ClientePortal | null>(null)
  const [empresaId, setEmpresaId] = useState(1)
  const [cart, setCart] = useState<CartItem[]>([])
  const [tab, setTab] = useState("catalogo")

  useEffect(() => {
    const stored = localStorage.getItem("portal_cliente")
    const eid = localStorage.getItem("portal_empresaId")
    if (stored) { try { setCliente(JSON.parse(stored)) } catch { } }
    if (eid) setEmpresaId(parseInt(eid) || 1)
  }, [])

  const handleLogin = (c: ClientePortal, eid: number) => {
    setCliente(c)
    setEmpresaId(eid)
  }

  const handleLogout = () => {
    localStorage.removeItem("portal_cliente")
    localStorage.removeItem("portal_empresaId")
    setCliente(null)
    setCart([])
  }

  const addToCart = (p: Producto) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.productoId === p.id)
      if (ex) return prev.map((c) => c.productoId === p.id ? { ...c, cantidad: c.cantidad + 1 } : c)
      return [...prev, { productoId: p.id, nombre: p.nombre, precio: p.precioVenta, cantidad: 1, unidad: p.unidad }]
    })
  }

  const updateCart = (id: number, qty: number) => {
    if (qty <= 0) setCart((prev) => prev.filter((c) => c.productoId !== id))
    else setCart((prev) => prev.map((c) => c.productoId === id ? { ...c, cantidad: qty } : c))
  }

  const cartCount = cart.reduce((s, c) => s + c.cantidad, 0)

  if (!cliente) return <LoginPortal onLogin={handleLogin} />

  return (
    <div className="flex flex-col min-h-screen">
      <PortalHeader cliente={cliente} cartCount={cartCount} onLogout={handleLogout} />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full grid grid-cols-4 mb-4">
            <TabsTrigger value="catalogo" className="text-xs sm:text-sm">Catálogo</TabsTrigger>
            <TabsTrigger value="carrito" className="relative text-xs sm:text-sm">
              Carrito
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="text-xs sm:text-sm">Mis Pedidos</TabsTrigger>
            <TabsTrigger value="cuenta" className="text-xs sm:text-sm">Mi Cuenta</TabsTrigger>
          </TabsList>

          <TabsContent value="catalogo">
            <TabCatalogo empresaId={empresaId} cart={cart} onAddToCart={addToCart} onUpdateCart={updateCart} />
          </TabsContent>
          <TabsContent value="carrito">
            <TabCarrito
              cart={cart}
              cliente={cliente}
              empresaId={empresaId}
              onUpdateCart={updateCart}
              onOrderPlaced={() => { setCart([]); setTab("pedidos") }}
            />
          </TabsContent>
          <TabsContent value="pedidos">
            <TabPedidos clienteId={cliente.id} empresaId={empresaId} />
          </TabsContent>
          <TabsContent value="cuenta">
            <TabCuenta cliente={cliente} empresaId={empresaId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom nav bar for mobile */}
      <nav className="sm:hidden sticky bottom-0 bg-white dark:bg-slate-900 border-t flex">
        {[
          { key: "catalogo", icon: Package, label: "Catálogo" },
          { key: "carrito", icon: ShoppingCart, label: `Carrito${cartCount > 0 ? ` (${cartCount})` : ""}` },
          { key: "pedidos", icon: Clock, label: "Pedidos" },
          { key: "cuenta", icon: CreditCard, label: "Cuenta" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-[10px] transition-colors ${tab === item.key ? "text-primary" : "text-muted-foreground"}`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
