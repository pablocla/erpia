"use client"

import { useState, useEffect, useCallback } from "react"
import { ShoppingCart, FileText, CreditCard, LogOut, Package, ChevronRight, Clock, CheckCircle2, AlertCircle, Search, Plus, Minus, Trash2, RefreshCw, Briefcase, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BrandLogo } from "@/components/marketing/brand-logo"

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
  codigo: string
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
  pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200",
  confirmado: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
  en_preparacion: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200",
  despachado: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200",
  entregado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200",
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_preparacion: "En preparación",
  despachado: "En Tránsito",
  entregado: "Entregado",
  cancelado: "Cancelado",
}

// ─── LOGIN ──────────────────────────────────────────────────────────────────────

function LoginPortal({ onLogin }: { onLogin: (c: ClientePortal, empresaId: number) => void }) {
  const [cuit, setCuit] = useState("")
  const [empresaId, setEmpresaId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
      if (!res.ok) { setError(data.error || "CUIT no encontrado en esta empresa."); return }
      localStorage.setItem("portal_cliente", JSON.stringify(data.cliente))
      localStorage.setItem("portal_empresaId", String(parseInt(empresaId) || 1))
      onLogin(data.cliente, parseInt(empresaId) || 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:flex flex-col justify-center space-y-6 pl-8">
          <BrandLogo size="lg" variant="group-full" />
          <h1 className="text-4xl font-[var(--font-fraunces)] font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            Portal B2B Mayorista
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Gestioná tus compras mayoristas, revisá tu saldo de cuenta corriente y dale seguimiento a tus pedidos en tiempo real.
          </p>
          <ul className="space-y-3 mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">
            <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500"/> Sincronizado con el ERP central</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500"/> Catálogo de alta densidad</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500"/> Estado de cuenta al instante</li>
          </ul>
        </div>
        
        <Card className="w-full max-w-md shadow-2xl mx-auto border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="text-center pb-6">
            <div className="md:hidden mx-auto mb-6">
              <BrandLogo size="md" variant="group-full" />
            </div>
            <CardTitle className="text-2xl font-bold">Acceso Clientes</CardTitle>
            <CardDescription className="text-base">Ingresá con tu CUIT para operar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">CUIT de la Empresa</label>
              <Input
                placeholder="Ej: 30-12345678-9"
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="text-center text-xl tracking-widest h-14"
                maxLength={13}
              />
            </div>
            <Button className="w-full h-12 text-base font-bold shadow-md" onClick={handleLogin} disabled={loading}>
              {loading ? "Verificando identidad..." : "Ingresar al Portal"}
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-4">
              Sistema de Autogestión B2B <br/> Contactá a tu ejecutivo de cuentas si tenés problemas para ingresar.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── DASHBOARD FINANCIERO ──────────────────────────────────────────────────────

function DashboardFinanciero({ cliente }: { cliente: ClientePortal }) {
  const saldo = cliente.saldoCuentaCorriente
  const limite = cliente.limiteCredito
  const disponible = limite > 0 ? limite - Math.abs(Math.min(saldo, 0)) : null
  
  const saldoNegativo = saldo < 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="border-slate-200 shadow-sm dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm text-muted-foreground font-medium">Razón Social</p>
            <p className="font-bold text-slate-900 dark:text-white truncate" title={cliente.nombre}>{cliente.nombre}</p>
            <p className="text-xs text-muted-foreground mt-0.5">CUIT {cliente.cuit}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className={`border shadow-sm ${saldoNegativo ? "border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30" : "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/10 dark:border-emerald-900/30"}`}>
        <CardContent className="p-5 flex items-center gap-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${saldoNegativo ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Saldo Cta. Corriente</p>
            <p className={`text-2xl font-bold tracking-tight ${saldoNegativo ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {currency.format(Math.abs(saldo))}
            </p>
            <p className="text-xs font-semibold mt-0.5">{saldoNegativo ? "Deuda Pendiente" : saldo === 0 ? "Al día" : "A favor"}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
            <Briefcase className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Crédito Disponible</p>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {disponible !== null ? currency.format(disponible) : "Ilimitado"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Límite Total: {limite > 0 ? currency.format(limite) : "Sin Límite"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── TAB CATÁLOGO (ALTA DENSIDAD) ───────────────────────────────────────────────

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
        const res = await fetch(`/api/ecommerce/catalogo?${params}`) // Usamos el mismo endpoint OPO de ecommerce
        if (res.ok) { const d = await res.json(); setProductos(d.productos ?? d) }
      } finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [empresaId, search])

  const getQty = (id: number) => cart.find((c) => c.productoId === id)?.cantidad ?? 0

  return (
    <Card className="border-slate-200 shadow-sm dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 border-b">
        <div>
          <CardTitle className="text-lg">Catálogo Mayorista</CardTitle>
          <CardDescription>Seleccioná las cantidades para agregar al pedido</CardDescription>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por SKU o Nombre..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white dark:bg-slate-950" />
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            Cargando catálogo...
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium text-lg">No se encontraron productos</p>
            <p className="text-sm">Probá con otra búsqueda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100 dark:bg-slate-950">
                <TableRow>
                  <TableHead className="w-24">SKU</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right w-32">Precio Neto</TableHead>
                  <TableHead className="text-right w-24">Stock</TableHead>
                  <TableHead className="text-center w-40">Pedido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productos.map((p) => {
                  const qty = getQty(p.id)
                  return (
                    <TableRow key={p.id} className={`group ${p.stock <= 0 ? "opacity-50 bg-slate-50 dark:bg-slate-900/50" : ""}`}>
                      <TableCell className="font-mono text-xs text-muted-foreground align-middle">{p.codigo}</TableCell>
                      <TableCell className="align-middle">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{p.nombre}</div>
                        {p.categoria && <span className="text-[10px] uppercase font-bold tracking-wider text-primary">{p.categoria.nombre}</span>}
                      </TableCell>
                      <TableCell className="text-right font-medium align-middle">{currency.format(p.precioVenta)}</TableCell>
                      <TableCell className="text-right text-xs align-middle">
                        <span className={`px-2 py-1 rounded-md ${p.stock < 10 && p.stock > 0 ? "bg-amber-100 text-amber-700 font-bold" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                          {p.stock} {p.unidad}
                        </span>
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        {qty === 0 ? (
                          <Button size="sm" variant="outline" onClick={() => onAddToCart(p)} disabled={p.stock <= 0} className="w-full h-8 shadow-sm transition-all hover:border-primary hover:text-primary">
                            <Plus className="h-3 w-3 mr-1" /> Pedir
                          </Button>
                        ) : (
                          <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-md p-0.5">
                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded text-primary hover:bg-primary/20" onClick={() => onUpdateCart(p.id, qty - 1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-bold text-sm text-primary">{qty}</span>
                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded text-primary hover:bg-primary/20" onClick={() => onUpdateCart(p.id, qty + 1)} disabled={qty >= p.stock}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
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
  const impuestos = subtotal * 0.21
  const total = subtotal + impuestos

  const confirmar = async () => {
    setEnviando(true); setError("")
    try {
      const res = await fetch("/api/ecommerce/checkout", { // Usamos el checkout unificado
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId,
          canalVentaCodigo: "B2B_PORTAL",
          observaciones: obs,
          cliente: { cuit: cliente.cuit, nombre: cliente.nombre },
          lineas: cart.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
          autoConfirmar: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Error al enviar el pedido"); return }
      setPedidoOk(data.pedido.numero)
      onOrderPlaced()
    } finally { setEnviando(false) }
  }

  if (pedidoOk) {
    return (
      <Card className="border-emerald-200 shadow-md mx-auto max-w-lg bg-white dark:bg-slate-900">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">¡Orden Generada!</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Tu pedido <strong className="text-slate-900 dark:text-white font-mono">#{pedidoOk}</strong> ya está en nuestro sistema.</p>
          </div>
          <Button onClick={() => setPedidoOk(null)} variant="outline" className="mt-4">Realizar otro pedido</Button>
        </CardContent>
      </Card>
    )
  }

  if (cart.length === 0) {
    return (
      <Card className="border-dashed bg-slate-50 dark:bg-slate-900/50">
        <CardContent className="text-center py-20 text-muted-foreground flex flex-col items-center">
          <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium text-slate-900 dark:text-slate-100">Borrador Vacío</p>
          <p className="text-sm">Buscá productos en el catálogo para armar el pedido.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid lg:grid-cols-[1fr_350px] gap-6">
      <Card className="border-slate-200 shadow-sm dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b pb-4">
          <CardTitle>Detalle del Pedido</CardTitle>
          <CardDescription>Revisá las cantidades antes de confirmar</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/50 dark:bg-slate-950/50">
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Precio Neto</TableHead>
                <TableHead className="text-center w-32">Cantidad</TableHead>
                <TableHead className="text-right">Subtotal Neto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.map((item) => (
                <TableRow key={item.productoId}>
                  <TableCell className="align-middle">
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">{item.nombre}</div>
                    <div className="font-mono text-xs text-muted-foreground">{item.codigo}</div>
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell align-middle text-muted-foreground">{currency.format(item.precio)}</TableCell>
                  <TableCell className="align-middle">
                    <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 rounded-md p-0.5">
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded text-slate-600 dark:text-slate-300" onClick={() => onUpdateCart(item.productoId, item.cantidad - 1)}>
                        {item.cantidad === 1 ? <Trash2 className="h-3 w-3 text-red-500" /> : <Minus className="h-3 w-3" />}
                      </Button>
                      <span className="w-8 text-center font-bold text-sm">{item.cantidad}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded text-slate-600 dark:text-slate-300" onClick={() => onUpdateCart(item.productoId, item.cantidad + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold align-middle">{currency.format(item.precio * item.cantidad)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-xl dark:border-slate-800 h-fit sticky top-24 bg-white dark:bg-slate-900">
        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b pb-4">
          <CardTitle>Resumen Operativo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>Subtotal Neto</span>
              <span className="font-medium">{currency.format(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>IVA (21%)</span>
              <span className="font-medium">{currency.format(impuestos)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold text-slate-900 dark:text-white">
              <span>Total Estimado</span>
              <span>{currency.format(total)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Condiciones Adicionales</label>
            <Textarea placeholder="Ej: Entrega por depósito lateral..." value={obs} onChange={(e) => setObs(e.target.value)} className="resize-none h-20 bg-slate-50 dark:bg-slate-950" />
          </div>

          <Button className="w-full h-12 text-base font-bold shadow-md" onClick={confirmar} disabled={enviando}>
            {enviando ? "Procesando Orden..." : "Generar Pedido"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── TAB PEDIDOS (TIMELINE) ────────────────────────────────────────────────────

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

  if (loading) return <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

  if (pedidos.length === 0) return (
    <Card className="border-dashed bg-slate-50 dark:bg-slate-900/50">
      <CardContent className="text-center py-20 text-muted-foreground flex flex-col items-center">
        <Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
        <p className="text-lg font-medium text-slate-900 dark:text-slate-100">Historial Limpio</p>
        <p className="text-sm">Todavía no tenés pedidos registrados.</p>
      </CardContent>
    </Card>
  )

  return (
    <Card className="border-slate-200 shadow-sm dark:border-slate-800 bg-white dark:bg-slate-900">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b bg-slate-50 dark:bg-slate-900/50">
        <div>
          <CardTitle>Historial de Pedidos</CardTitle>
          <CardDescription>Seguimiento de compras y despachos</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPedidos} className="gap-2 hidden md:flex shadow-sm bg-white">
          <RefreshCw className="h-4 w-4" /> Refrescar
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {pedidos.map((p) => (
            <div key={p.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${ESTADO_COLOR[p.estado] || "bg-slate-100"}`}>
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-mono font-bold text-slate-900 dark:text-white text-base">#{p.numero}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("es-AR", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 md:gap-8">
                  <Badge variant="outline" className={`hidden md:inline-flex px-3 py-1 uppercase tracking-wider text-[10px] font-bold ${ESTADO_COLOR[p.estado]}`}>
                    {ESTADO_LABEL[p.estado] || p.estado}
                  </Badge>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white text-lg">{currency.format(p.total)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider md:hidden mt-1">{ESTADO_LABEL[p.estado] || p.estado}</p>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${expanded === p.id ? "rotate-90" : ""}`} />
                </div>
              </div>
              
              {expanded === p.id && p.lineas?.length > 0 && (
                <div className="mt-4 ml-16 pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-3 py-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Detalle de Artículos</p>
                  <div className="bg-white dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 p-3">
                    {p.lineas.map((l, i) => (
                      <div key={i} className="flex justify-between text-sm text-slate-700 dark:text-slate-300 py-1.5 border-b last:border-0 border-slate-100 dark:border-slate-800">
                        <span><span className="font-bold text-slate-900 dark:text-white mr-2">{l.cantidad}x</span> {l.descripcion}</span>
                        <span className="font-mono text-muted-foreground">{currency.format(l.precioUnitario * l.cantidad)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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
      return [...prev, { productoId: p.id, nombre: p.nombre, precio: p.precioVenta, cantidad: 1, unidad: p.unidad, codigo: p.codigo }]
    })
  }

  const updateCart = (id: number, qty: number) => {
    if (qty <= 0) setCart((prev) => prev.filter((c) => c.productoId !== id))
    else setCart((prev) => prev.map((c) => c.productoId === id ? { ...c, cantidad: qty } : c))
  }

  const cartCount = cart.reduce((s, c) => s + c.cantidad, 0)

  if (!cliente) return <LoginPortal onLogin={handleLogin} />

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo size="sm" variant="group-full" showByClaver={false} />
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
            <span className="font-bold text-sm tracking-wide hidden sm:block text-slate-800 dark:text-slate-200 uppercase">Portal Clientes</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{cliente.nombre}</p>
              <p className="text-[10px] text-muted-foreground font-mono">CUIT {cliente.cuit}</p>
            </div>
            <Button variant="outline" size="sm" className="relative shadow-sm bg-white dark:bg-slate-900 border-slate-200" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8">
        
        <DashboardFinanciero cliente={cliente} />

        <Tabs value={tab} onValueChange={setTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-3 max-w-md bg-slate-200/60 dark:bg-slate-800/60 p-1.5 rounded-xl">
            <TabsTrigger value="catalogo" className="rounded-lg data-[state=active]:shadow-md font-semibold tracking-wide">Realizar Pedido</TabsTrigger>
            <TabsTrigger value="carrito" className="rounded-lg data-[state=active]:shadow-md font-semibold tracking-wide relative">
              Borrador
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold shadow-md border-2 border-white dark:border-slate-900 ring-2 ring-primary/20">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="rounded-lg data-[state=active]:shadow-md font-semibold tracking-wide">Historial</TabsTrigger>
          </TabsList>

          <div className="mt-8">
            <TabsContent value="catalogo" className="m-0 focus-visible:outline-none">
              <TabCatalogo empresaId={empresaId} cart={cart} onAddToCart={addToCart} onUpdateCart={updateCart} />
            </TabsContent>
            <TabsContent value="carrito" className="m-0 focus-visible:outline-none">
              <TabCarrito
                cart={cart}
                cliente={cliente}
                empresaId={empresaId}
                onUpdateCart={updateCart}
                onOrderPlaced={() => { setCart([]); setTab("pedidos") }}
              />
            </TabsContent>
            <TabsContent value="pedidos" className="m-0 focus-visible:outline-none">
              <TabPedidos clienteId={cliente.id} empresaId={empresaId} />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      {/* Navegación Móvil Inferior */}
      <nav className="md:hidden sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex px-2 py-2 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {[
          { key: "catalogo", icon: Plus, label: "Nueva Orden" },
          { key: "carrito", icon: ShoppingCart, label: `Borrador${cartCount > 0 ? ` (${cartCount})` : ""}` },
          { key: "pedidos", icon: Clock, label: "Historial" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex-1 py-3 flex flex-col items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider transition-all rounded-xl ${tab === item.key ? "text-primary bg-primary/10 shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
