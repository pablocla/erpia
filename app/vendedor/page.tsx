"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Users, ShoppingBag, DollarSign, MapPin, Plus, Minus, Check,
  Phone, Search, Camera, Clock, ChevronRight, Package,
  AlertCircle, Wifi, WifiOff, LogOut, Truck, RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// ─── TIPOS ─────────────────────────────────────────────────────────────────────

interface Cliente {
  id: number
  nombre: string
  telefono?: string
  direccion?: string
  saldoCuentaCorriente: number
  ultimaCompra?: string
}

interface Producto {
  id: number
  codigo: string
  nombre: string
  precioVenta: number
  stock: number
  unidad: string
}

interface CartItem {
  productoId: number
  nombre: string
  precio: number
  cantidad: number
  unidad: string
}

interface VisitaPendiente {
  clienteId: number
  clienteNombre: string
  lat?: number
  lng?: number
  timestamp: number
  motivoNoVenta?: string
  pedido?: CartItem[]
  cobro?: { monto: number; medio: string; referencia?: string }
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

function useOnline() {
  const [online, setOnline] = useState(true)
  useEffect(() => {
    setOnline(navigator.onLine)
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener("online", on)
    window.addEventListener("offline", off)
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off) }
  }, [])
  return online
}

// ─── LOGIN VENDEDOR ─────────────────────────────────────────────────────────────

function LoginVendedor({ onLogin }: { onLogin: (token: string, empresaId: number) => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [empresaId, setEmpresaId] = useState("1")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async () => {
    if (!email || !password) { setError("Completá email y contraseña"); return }
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Credenciales incorrectas"); return }
      localStorage.setItem("token", data.token)
      localStorage.setItem("vendedor_empresaId", empresaId)
      onLogin(data.token, parseInt(empresaId) || 1)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-teal-600 flex items-center justify-center">
            <Truck className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-xl">App Vendedor</CardTitle>
          <p className="text-xs text-muted-foreground">Pedidos y cobranzas en campo</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <Alert variant="destructive"><AlertDescription className="text-xs">{error}</AlertDescription></Alert>}
          <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={handleLogin} disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── CARTERA DE CLIENTES ────────────────────────────────────────────────────────

function PanelCartera({
  token,
  onSeleccionarCliente,
}: {
  token: string
  onSeleccionarCliente: (c: Cliente) => void
}) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      params.set("limit", "50")
      const res = await fetch(`/api/clientes?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const d = await res.json(); setClientes(d.clientes ?? d) }
    } finally { setLoading(false) }
  }, [search, token])

  useEffect(() => {
    const t = setTimeout(fetchClientes, 300)
    return () => clearTimeout(t)
  }, [fetchClientes])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No se encontraron clientes</div>
      ) : (
        <div className="space-y-2">
          {clientes.map((c) => (
            <button
              key={c.id}
              className="w-full text-left p-4 rounded-xl border bg-card hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-colors"
              onClick={() => onSeleccionarCliente(c)}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{c.nombre}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    {c.direccion && <><MapPin className="h-3 w-3" />{c.direccion.substring(0, 30)}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.saldoCuentaCorriente < 0 && (
                    <Badge variant="destructive" className="text-[10px] h-5">
                      Deuda
                    </Badge>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TOMA DE PEDIDO ────────────────────────────────────────────────────────────

function PanelPedido({
  cliente,
  token,
  pendientes,
  onGuardarPendiente,
  onVolver,
}: {
  cliente: Cliente
  token: string
  pendientes: VisitaPendiente[]
  onGuardarPendiente: (v: VisitaPendiente) => void
  onVolver: () => void
}) {
  const [tab, setTab] = useState<"pedido" | "cobro" | "visita">("pedido")
  const [productos, setProductos] = useState<Producto[]>([])
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [cobro, setCobro] = useState({ monto: "", medio: "efectivo", referencia: "" })
  const [motivoNoVenta, setMotivoNoVenta] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState("")
  const [error, setError] = useState("")

  const fetchProductos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "100" })
      if (search) params.set("search", search)
      const res = await fetch(`/api/productos?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const d = await res.json(); setProductos(d.productos ?? d) }
    } finally { setLoading(false) }
  }, [search, token])

  useEffect(() => {
    const t = setTimeout(fetchProductos, 300)
    return () => clearTimeout(t)
  }, [fetchProductos])

  const getQty = (id: number) => cart.find((c) => c.productoId === id)?.cantidad ?? 0
  const updateCart = (p: Producto, delta: number) => {
    setCart((prev) => {
      const qty = (prev.find((c) => c.productoId === p.id)?.cantidad ?? 0) + delta
      if (qty <= 0) return prev.filter((c) => c.productoId !== p.id)
      const ex = prev.find((c) => c.productoId === p.id)
      if (ex) return prev.map((c) => c.productoId === p.id ? { ...c, cantidad: qty } : c)
      return [...prev, { productoId: p.id, nombre: p.nombre, precio: p.precioVenta, cantidad: 1, unidad: p.unidad }]
    })
  }

  const getGeo = (): Promise<{ lat: number; lng: number } | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null)
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000 }
      )
    })

  const registrarVisita = async () => {
    setEnviando(true); setError("")
    try {
      const geo = await getGeo()
      const visita: VisitaPendiente = {
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        lat: geo?.lat,
        lng: geo?.lng,
        timestamp: Date.now(),
        motivoNoVenta: motivoNoVenta || undefined,
        pedido: cart.length > 0 ? cart : undefined,
        cobro: cobro.monto ? { monto: parseFloat(cobro.monto), medio: cobro.medio, referencia: cobro.referencia || undefined } : undefined,
      }

      if (navigator.onLine) {
        // Enviar pedido al servidor
        if (cart.length > 0) {
          const total = cart.reduce((s, i) => s + i.precio * i.cantidad, 0)
          const count = Math.floor(Math.random() * 99999) // en prod usar numerador
          await fetch("/api/ventas/pedidos", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              clienteId: cliente.id,
              numero: `PED-RUT-${String(count).padStart(5, "0")}`,
              canal: "VENDEDOR_RUTA",
              total,
              lineas: cart.map((i) => ({
                productoId: i.productoId,
                descripcion: i.nombre,
                cantidad: i.cantidad,
                precioUnitario: i.precio,
                total: i.precio * i.cantidad,
              })),
            }),
          })
        }
        setExito(cart.length > 0 ? "Pedido enviado correctamente" : "Visita registrada")
      } else {
        // Guardar offline
        onGuardarPendiente(visita)
        setExito("Guardado offline — se sincronizará al recuperar señal")
      }
      setCart([])
      setMotivoNoVenta("")
      setCobro({ monto: "", medio: "efectivo", referencia: "" })
    } catch {
      setError("Error al registrar visita")
    } finally { setEnviando(false) }
  }

  const totalCarrito = cart.reduce((s, i) => s + i.precio * i.cantidad, 0)

  return (
    <div className="space-y-3">
      {/* Header cliente */}
      <div className="flex items-center justify-between">
        <div>
          <button className="text-xs text-teal-600 font-medium flex items-center gap-1" onClick={onVolver}>
            ← Volver
          </button>
          <h2 className="font-bold mt-0.5">{cliente.nombre}</h2>
          {cliente.telefono && (
            <a href={`tel:${cliente.telefono}`} className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />{cliente.telefono}
            </a>
          )}
        </div>
        {cliente.saldoCuentaCorriente < 0 && (
          <Badge variant="destructive" className="text-xs">
            Deuda {currency.format(Math.abs(cliente.saldoCuentaCorriente))}
          </Badge>
        )}
      </div>

      {exito && <Alert className="border-green-200 bg-green-50"><AlertDescription className="text-green-800 text-xs">{exito}</AlertDescription></Alert>}
      {error && <Alert variant="destructive"><AlertDescription className="text-xs">{error}</AlertDescription></Alert>}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {([["pedido", "Pedido"], ["cobro", "Cobro"], ["visita", "Visita"]] as [typeof tab, string][]).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${tab === k ? "bg-white dark:bg-slate-800 shadow-sm" : "text-muted-foreground"}`}
          >
            {l} {k === "pedido" && cart.length > 0 && `(${cart.length})`}
          </button>
        ))}
      </div>

      {tab === "pedido" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="text-center text-xs text-muted-foreground py-4">Cargando...</div>
            ) : productos.map((p) => {
              const qty = getQty(p.id)
              return (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.nombre}</p>
                    <p className="text-xs text-muted-foreground">{currency.format(p.precioVenta)} / {p.unidad} · Stock: {p.stock}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {qty > 0 && (
                      <>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCart(p, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-bold">{qty}</span>
                      </>
                    )}
                    <Button size="icon" variant={qty > 0 ? "outline" : "default"} className="h-7 w-7" onClick={() => updateCart(p, 1)} disabled={qty >= p.stock}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
          {cart.length > 0 && (
            <div className="rounded-xl border p-3 bg-teal-50 dark:bg-teal-900/10">
              <div className="flex justify-between text-sm font-bold text-teal-700">
                <span>{cart.length} productos</span>
                <span>{currency.format(totalCarrito)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "cobro" && (
        <div className="space-y-3">
          <Input
            placeholder="Monto cobrado..."
            type="number"
            value={cobro.monto}
            onChange={(e) => setCobro({ ...cobro, monto: e.target.value })}
            className="text-lg h-12 text-center font-bold"
          />
          <Select value={cobro.medio} onValueChange={(v) => setCobro({ ...cobro, medio: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="transferencia">Transferencia</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="tarjeta">Tarjeta</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Referencia / N° cheque..." value={cobro.referencia} onChange={(e) => setCobro({ ...cobro, referencia: e.target.value })} />
          <div className="p-3 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
            <Camera className="h-5 w-5 mx-auto mb-1 opacity-40" />
            Foto de comprobante (próximamente)
          </div>
        </div>
      )}

      {tab === "visita" && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl border bg-blue-50 dark:bg-blue-900/10 text-xs text-blue-700">
            <MapPin className="h-4 w-4 inline mr-1" />
            Se registrará tu ubicación al confirmar la visita
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Motivo de no venta (si no hubo pedido)</label>
            <Select value={motivoNoVenta} onValueChange={setMotivoNoVenta}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar motivo..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin motivo especial</SelectItem>
                <SelectItem value="ausente">Cliente ausente</SelectItem>
                <SelectItem value="stock_suficiente">Ya tiene stock suficiente</SelectItem>
                <SelectItem value="problema_pago">Problema de pago</SelectItem>
                <SelectItem value="fuera_de_ruta">Fuera de ruta</SelectItem>
                <SelectItem value="cerrado">Local cerrado</SelectItem>
                <SelectItem value="no_le_interesa">No le interesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea placeholder="Notas de la visita..." className="h-20 text-sm" />
        </div>
      )}

      <Button
        className="w-full bg-teal-600 hover:bg-teal-700 h-12"
        onClick={registrarVisita}
        disabled={enviando || (cart.length === 0 && !cobro.monto && tab !== "visita")}
      >
        {enviando ? "Registrando..." : (
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            {cart.length > 0 && cobro.monto ? "Enviar pedido + cobro" :
             cart.length > 0 ? "Enviar pedido" :
             cobro.monto ? "Registrar cobro" : "Registrar visita"}
          </span>
        )}
      </Button>
    </div>
  )
}

// ─── PANEL PENDIENTES OFFLINE ───────────────────────────────────────────────────

function PanelPendientes({
  pendientes,
  token,
  onSincronizado,
}: {
  pendientes: VisitaPendiente[]
  token: string
  onSincronizado: () => void
}) {
  const [sincronizando, setSincronizando] = useState(false)

  const sincronizar = async () => {
    setSincronizando(true)
    try {
      for (const v of pendientes) {
        if (v.pedido && v.pedido.length > 0) {
          const total = v.pedido.reduce((s, i) => s + i.precio * i.cantidad, 0)
          await fetch("/api/ventas/pedidos", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              clienteId: v.clienteId,
              numero: `PED-OFF-${v.timestamp}`,
              canal: "VENDEDOR_RUTA",
              total,
              lineas: v.pedido.map((i) => ({
                productoId: i.productoId,
                descripcion: i.nombre,
                cantidad: i.cantidad,
                precioUnitario: i.precio,
                total: i.precio * i.cantidad,
              })),
            }),
          })
        }
      }
      onSincronizado()
    } finally { setSincronizando(false) }
  }

  if (pendientes.length === 0) return null

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-xs text-orange-800">
        <strong>{pendientes.length} visita(s) offline</strong> pendiente(s) de sincronizar.
        <Button size="sm" variant="outline" className="ml-2 h-6 text-xs" onClick={sincronizar} disabled={sincronizando}>
          {sincronizando ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Sincronizar"}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

// ─── APP VENDEDOR PRINCIPAL ─────────────────────────────────────────────────────

export default function VendedorPage() {
  const [token, setToken] = useState<string | null>(null)
  const [empresaId, setEmpresaId] = useState(1)
  const [clienteActivo, setClienteActivo] = useState<Cliente | null>(null)
  const [tab, setTab] = useState<"cartera" | "stats">("cartera")
  const [pendientes, setPendientes] = useState<VisitaPendiente[]>([])
  const online = useOnline()

  useEffect(() => {
    const t = localStorage.getItem("token")
    const eid = localStorage.getItem("vendedor_empresaId")
    const pend = localStorage.getItem("vendedor_pendientes")
    if (t) setToken(t)
    if (eid) setEmpresaId(parseInt(eid) || 1)
    if (pend) { try { setPendientes(JSON.parse(pend)) } catch { } }
  }, [])

  const savePendiente = (v: VisitaPendiente) => {
    const nuevos = [...pendientes, v]
    setPendientes(nuevos)
    localStorage.setItem("vendedor_pendientes", JSON.stringify(nuevos))
  }

  const clearPendientes = () => {
    setPendientes([])
    localStorage.removeItem("vendedor_pendientes")
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    setToken(null)
  }

  if (!token) return <LoginVendedor onLogin={(t, eid) => { setToken(t); setEmpresaId(eid) }} />

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-teal-700 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            <span className="font-semibold text-sm">App Vendedor</span>
            {!online && <WifiOff className="h-4 w-4 text-orange-300" />}
            {online && <Wifi className="h-4 w-4 text-green-300" />}
          </div>
          <Button variant="ghost" size="sm" className="text-white hover:bg-teal-600" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Pendientes offline */}
        <PanelPendientes pendientes={pendientes} token={token} onSincronizado={clearPendientes} />

        {clienteActivo ? (
          <PanelPedido
            cliente={clienteActivo}
            token={token}
            pendientes={pendientes}
            onGuardarPendiente={savePendiente}
            onVolver={() => setClienteActivo(null)}
          />
        ) : (
          <>
            {/* KPIs del día */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="bg-teal-50 border-teal-200 dark:bg-teal-900/20">
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold text-teal-700">0</p>
                  <p className="text-[10px] text-teal-600">Visitas hoy</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200 dark:bg-green-900/20">
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold text-green-700">0</p>
                  <p className="text-[10px] text-green-600">Pedidos</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20">
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold text-blue-700">$0</p>
                  <p className="text-[10px] text-blue-600">Cobrado</p>
                </CardContent>
              </Card>
            </div>

            <PanelCartera token={token} onSeleccionarCliente={setClienteActivo} />
          </>
        )}
      </div>

      {/* Bottom nav */}
      {!clienteActivo && (
        <nav className="sticky bottom-0 bg-white dark:bg-slate-900 border-t flex">
          {([
            ["cartera", Users, "Mi Cartera"],
            ["stats", Package, "Mi Día"],
          ] as [typeof tab, typeof Users, string][]).map(([k, Icon, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-[10px] transition-colors ${tab === k ? "text-teal-600" : "text-muted-foreground"}`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
