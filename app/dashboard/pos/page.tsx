"use client"

/**
 * Sistema POS — Punto de Venta
 *
 * Diseño full-screen optimizado para touch y teclado:
 *   - Panel izquierdo (60%): búsqueda + grilla de productos
 *   - Panel derecho (40%): carrito + totales + cobro
 *
 * Modos de operación:
 *   mostrador → venta directa al mostrador (default)
 *   mesa      → integrado con hospitald / Mesas y Comandas
 *   kiosko    → pantalla sin sidebar, botones XXL
 *
 * Atajos de teclado:
 *   /  o  F1      → foco en búsqueda
 *   F12 / Enter   → abrir cobro (con carrito lleno)
 *   Esc           → limpiar búsqueda / cerrar modal
 *   + / -         → modificar cantidad del último ítem
 *   Del           → eliminar último ítem del carrito
 */

import {
  useState, useEffect, useCallback, useRef,
  type KeyboardEvent,
} from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  Search, ShoppingCart, Trash2, Plus, Minus, CreditCard,
  Banknote, Smartphone, Receipt, UtensilsCrossed, Store,
  Monitor, CheckCircle2, RefreshCw, X, ScanLine, Percent,
  ArrowLeft, Wallet, User, AlertTriangle, Printer,
  BarChart3, Lock,
} from "lucide-react"
import Link from "next/link"

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

type ModoPos = "mostrador" | "mesa" | "kiosko"
type TipoFactura = "A" | "B" | "C" | "ticket"

interface Producto {
  id: number
  nombre: string
  codigo: string
  codigoBarras?: string
  precioVenta: number
  porcentajeIva: number
  stock: number
  categoria?: { id: number; nombre: string }
  esPlato?: boolean
  imagenUrl?: string
}

interface Categoria {
  id: number
  nombre: string
}

interface ItemCarrito {
  productoId: number
  descripcion: string
  precio: number
  cantidad: number
  porcentajeIva: number
  descuento: number
}

interface Pago {
  medio: string
  monto: number
}

interface Mesa {
  id: number
  numero: number
  estado: string
  comandas: { id: number; lineas: { nombre: string; cantidad: number; precio: number }[] }[]
}

interface Cliente {
  id: number
  nombre: string
  condicionIva?: string
  cuit?: string
}

const MEDIOS_PAGO = [
  { key: "efectivo", label: "Efectivo", icon: Banknote, color: "bg-green-500 hover:bg-green-600" },
  { key: "tarjeta_debito", label: "Débito", icon: CreditCard, color: "bg-blue-500 hover:bg-blue-600" },
  { key: "tarjeta_credito", label: "Crédito", icon: CreditCard, color: "bg-purple-500 hover:bg-purple-600" },
  { key: "qr", label: "QR/MP", icon: Smartphone, color: "bg-sky-500 hover:bg-sky-600" },
  { key: "transferencia", label: "Transfer.", icon: Receipt, color: "bg-orange-500 hover:bg-orange-600" },
  { key: "cuenta_corriente", label: "Cta. Cte.", icon: Wallet, color: "bg-gray-500 hover:bg-gray-600" },
]

const NUMPAD_KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "⌫"]

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

export default function POSPage() {
  const { toast } = useToast()
  const searchRef = useRef<HTMLInputElement>(null)
  const montoEfectivoRef = useRef<HTMLInputElement>(null)

  // ── Estado general ──────────────────────────────────────────
  const [modo, setModo] = useState<ModoPos>("mostrador")
  const [cajaId, setCajaId] = useState<number | null>(null)
  const [cajaOk, setCajaOk] = useState<boolean | null>(null)

  // ── Productos ───────────────────────────────────────────────
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaActiva, setCategoriaActiva] = useState<number | "all">("all")
  const [busqueda, setBusqueda] = useState("")
  const [cargandoProductos, setCargandoProductos] = useState(false)

  // ── Carrito ─────────────────────────────────────────────────
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [descuentoGlobal, setDescuentoGlobal] = useState(0)

  // ── Cliente / Mesa ──────────────────────────────────────────
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteId, setClienteId] = useState<number | null>(null)
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [mesaId, setMesaId] = useState<number | null>(null)
  const [tipoFactura, setTipoFactura] = useState<TipoFactura>("ticket")

  // ── Cobro ───────────────────────────────────────────────────
  const [modalCobroOpen, setModalCobroOpen] = useState(false)
  const [pagos, setPagos] = useState<Pago[]>([{ medio: "efectivo", monto: 0 }])
  const [numpadTarget, setNumpadTarget] = useState<number>(0) // índice del pago activo
  const [numpadInput, setNumpadInput] = useState("")
  const [procesando, setProcesando] = useState(false)
  const [ventaExitosa, setVentaExitosa] = useState<{
    numeroCompleto: string; total: number; vuelto: number
    ivaDesglose?: { pct: string; neto: number; iva: number }[]
  } | null>(null)

  // ── Modal mesas (modo mesa) ─────────────────────────────────
  const [modalMesasOpen, setModalMesasOpen] = useState(false)

  // ── Error ───────────────────────────────────────────────────
  const [error, setError] = useState("")

  // ──────────────────────────────────────────────────────────────
  // Auth helper
  // ──────────────────────────────────────────────────────────────
  const authH = useCallback((): HeadersInit => {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : ""
    return t ? { Authorization: `Bearer ${t}` } : {}
  }, [])

  // ──────────────────────────────────────────────────────────────
  // Carga inicial
  // ──────────────────────────────────────────────────────────────
  const verificarCaja = useCallback(async () => {
    try {
      const res = await fetch("/api/pos/venta", { headers: authH() })
      const data = await res.json()
      setCajaOk(data.cajaAbierta)
      setCajaId(data.cajaId)
    } catch {
      setCajaOk(false)
    }
  }, [authH])

  const cargarProductos = useCallback(async (q = "") => {
    setCargandoProductos(true)
    try {
      const params = new URLSearchParams({ soloActivos: "true" })
      if (q) params.set("search", q)
      if (categoriaActiva !== "all") params.set("categoriaId", String(categoriaActiva))
      const res = await fetch(`/api/productos?${params}`, { headers: authH() })
      const data = await res.json()
      setProductos(Array.isArray(data) ? data.slice(0, 80) : [])
    } catch {
      /* silent */
    } finally {
      setCargandoProductos(false)
    }
  }, [authH, categoriaActiva])

  const cargarCategorias = useCallback(async () => {
    try {
      const res = await fetch("/api/maestros/categorias", { headers: authH() })
      const data = await res.json()
      setCategorias(Array.isArray(data) ? data : [])
    } catch { /* silent */ }
  }, [authH])

  const cargarClientes = useCallback(async () => {
    try {
      const res = await fetch("/api/clientes?soloActivos=true&limit=500", { headers: authH() })
      const data = await res.json()
      setClientes(Array.isArray(data) ? data : [])
    } catch { /* silent */ }
  }, [authH])

  const cargarMesas = useCallback(async () => {
    try {
      const res = await fetch("/api/hospitalidad", { headers: authH() })
      const data = await res.json()
      setMesas(data.mesas ?? [])
    } catch { /* silent */ }
  }, [authH])

  useEffect(() => {
    verificarCaja()
    cargarCategorias()
    cargarProductos()
    cargarClientes()
    if (modo === "mesa") cargarMesas()
  }, [verificarCaja, cargarCategorias, cargarProductos, cargarClientes, cargarMesas, modo])

  useEffect(() => { cargarProductos(busqueda) }, [busqueda, categoriaActiva, cargarProductos])

  // ──────────────────────────────────────────────────────────────
  // Keyboard shortcuts
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (modalCobroOpen) return
      if (e.key === "/" || e.key === "F1") {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
      if (e.key === "F12" && carrito.length > 0) {
        e.preventDefault()
        abrirCobro()
      }
      if (e.key === "Escape") {
        setBusqueda("")
        searchRef.current?.blur()
      }
      if (e.key === "Delete" && carrito.length > 0) {
        setCarrito((c) => c.slice(0, -1))
      }
      if (e.key === "+" && carrito.length > 0) {
        setCarrito((c) => c.map((item, i) => i === c.length - 1 ? { ...item, cantidad: item.cantidad + 1 } : item))
      }
      if (e.key === "-" && carrito.length > 0) {
        setCarrito((c) => c.map((item, i) =>
          i === c.length - 1 && item.cantidad > 1 ? { ...item, cantidad: item.cantidad - 1 } : item
        ))
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carrito, modalCobroOpen])

  // ──────────────────────────────────────────────────────────────
  // Carrito helpers
  // ──────────────────────────────────────────────────────────────
  const agregarProducto = (p: Producto) => {
    setCarrito((prev) => {
      const existing = prev.findIndex((i) => i.productoId === p.id)
      if (existing >= 0) {
        return prev.map((item, idx) =>
          idx === existing ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      }
      return [
        ...prev,
        {
          productoId: p.id,
          descripcion: p.nombre,
          precio: p.precioVenta,
          cantidad: 1,
          porcentajeIva: p.porcentajeIva ?? 21,
          descuento: 0,
        },
      ]
    })
  }

  const cambiarCantidad = (idx: number, delta: number) => {
    setCarrito((prev) =>
      prev
        .map((item, i) => i === idx ? { ...item, cantidad: Math.max(0, item.cantidad + delta) } : item)
        .filter((item) => item.cantidad > 0)
    )
  }

  const eliminarItem = (idx: number) => {
    setCarrito((prev) => prev.filter((_, i) => i !== idx))
  }

  const vaciarCarrito = () => {
    setCarrito([])
    setMesaId(null)
    setClienteId(null)
    setDescuentoGlobal(0)
    setError("")
    setBusqueda("")
    searchRef.current?.focus()
  }

  // ──────────────────────────────────────────────────────────────
  // Totales
  // ──────────────────────────────────────────────────────────────
  const calcTotales = () => {
    let subtotal = 0
    let totalIva = 0
    for (const item of carrito) {
      const base = item.precio * item.cantidad * (1 - (item.descuento + descuentoGlobal) / 100)
      const neto = base / (1 + item.porcentajeIva / 100)
      subtotal += neto
      totalIva += base - neto
    }
    const total = subtotal + totalIva
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      iva: parseFloat(totalIva.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    }
  }

  const { subtotal, iva, total } = calcTotales()

  // ──────────────────────────────────────────────────────────────
  // Cobro / Numpad
  // ──────────────────────────────────────────────────────────────
  const abrirCobro = () => {
    if (carrito.length === 0) return
    setPagos([{ medio: "efectivo", monto: total }])
    setNumpadTarget(0)
    setNumpadInput(String(total))
    setVentaExitosa(null)
    setError("")
    setModalCobroOpen(true)
    setTimeout(() => montoEfectivoRef.current?.select(), 100)
  }

  const numpadPress = (key: string) => {
    setNumpadInput((prev) => {
      let next: string
      if (key === "⌫") next = prev.slice(0, -1) || "0"
      else if (key === "." && prev.includes(".")) next = prev
      else if (prev === "0" && key !== ".") next = key
      else next = prev + key
      const val = parseFloat(next) || 0
      setPagos((ps) => ps.map((p, i) => i === numpadTarget ? { ...p, monto: val } : p))
      return next
    })
  }

  const agregarMedioPago = () => {
    const montoPendiente = Math.max(0, total - pagos.reduce((s, p) => s + p.monto, 0))
    setPagos((ps) => [...ps, { medio: "tarjeta_debito", monto: montoPendiente }])
    setNumpadTarget(pagos.length)
    setNumpadInput(String(montoPendiente))
  }

  const eliminarPago = (idx: number) => {
    if (pagos.length <= 1) return
    setPagos((ps) => ps.filter((_, i) => i !== idx))
    setNumpadTarget(0)
    setNumpadInput(String(pagos[0].monto))
  }

  const totalPagado = pagos.reduce((s, p) => s + p.monto, 0)
  const vuelto = Math.max(0, totalPagado - total)
  const faltaPagar = Math.max(0, total - totalPagado)

  // ──────────────────────────────────────────────────────────────
  // Ejecutar venta
  // ──────────────────────────────────────────────────────────────
  const ejecutarVenta = async () => {
    if (faltaPagar > 0.01) {
      setError(`Falta cubrir $${faltaPagar.toFixed(2)} del total`)
      return
    }
    if (!cajaId) {
      setError("No hay caja abierta")
      return
    }

    setProcesando(true)
    setError("")

    try {
      const body = {
        clienteId: clienteId ?? undefined,
        mesaId: mesaId ?? undefined,
        tipoFactura,
        lineas: carrito.map((i) => ({
          productoId: i.productoId,
          descripcion: i.descripcion,
          cantidad: i.cantidad,
          precioUnitario: i.precio,
          porcentajeIva: i.porcentajeIva,
          descuento: i.descuento,
        })),
        pagos,
        descuentoGlobal,
      }

      const res = await fetch("/api/pos/venta", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authH() },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Error al procesar la venta")
        return
      }

      // Computar desglose IVA desde el carrito para mostrar en ticket
      const ivaMap = new Map<number, { neto: number; iva: number }>()
      for (const item of carrito) {
        const base = item.precio * item.cantidad * (1 - (item.descuento + descuentoGlobal) / 100)
        const neto = base / (1 + item.porcentajeIva / 100)
        const ivaAmt = base - neto
        const existing = ivaMap.get(item.porcentajeIva)
        if (existing) { existing.neto += neto; existing.iva += ivaAmt }
        else ivaMap.set(item.porcentajeIva, { neto, iva: ivaAmt })
      }
      const ivaDesglose = [...ivaMap.entries()]
        .filter(([, v]) => v.iva > 0.001)
        .sort(([a], [b]) => b - a)
        .map(([pct, v]) => ({
          pct: `${pct}%`,
          neto: parseFloat(v.neto.toFixed(2)),
          iva: parseFloat(v.iva.toFixed(2)),
        }))

      setVentaExitosa({
        numeroCompleto: data.numeroCompleto,
        total: data.total,
        vuelto: data.vuelto,
        ivaDesglose,
      })

      // Recargar productos y caja después de venta exitosa
      cargarProductos(busqueda)
      verificarCaja()

    } catch (err: any) {
      setError("Error de conexión. Verificá la red.")
    } finally {
      setProcesando(false)
    }
  }

  const cerrarYNuevaVenta = () => {
    setModalCobroOpen(false)
    setVentaExitosa(null)
    vaciarCarrito()
    toast({ title: "Venta registrada", description: "Lista para la próxima venta" })
  }

  // ──────────────────────────────────────────────────────────────
  // Carga desde mesa
  // ──────────────────────────────────────────────────────────────
  const cargarDesdemesa = (mesa: Mesa) => {
    setMesaId(mesa.id)
    const comanda = mesa.comandas[0]
    if (comanda) {
      setCarrito(
        comanda.lineas.map((l) => ({
          productoId: 0,
          descripcion: l.nombre,
          precio: Number(l.precio),
          cantidad: l.cantidad,
          porcentajeIva: 21,
          descuento: 0,
        }))
      )
    }
    setModalMesasOpen(false)
  }

  // ──────────────────────────────────────────────────────────────
  // Render helpers
  // ──────────────────────────────────────────────────────────────
  const productosFiltrados = productos

  const fmt = (n: number) => n.toLocaleString("es-AR", { minimumFractionDigits: 2 })

  // ──────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col h-[calc(100vh-4rem)] overflow-hidden ${modo === "kiosko" ? "bg-black text-white" : ""}`}>

      {/* ── TOPBAR POS ──────────────────────────────────────── */}
      <div className={`flex items-center gap-3 px-4 py-2 border-b shrink-0 ${modo === "kiosko" ? "bg-gray-900 border-gray-700" : "bg-background"}`}>
        {/* Selector de modo */}
        <div className="flex rounded-lg border overflow-hidden">
          {([
            { key: "mostrador", icon: Store, label: "Mostrador" },
            { key: "mesa", icon: UtensilsCrossed, label: "Mesa" },
            { key: "kiosko", icon: Monitor, label: "Kiosko" },
          ] as { key: ModoPos; icon: React.ElementType; label: string }[]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setModo(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                modo === key
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tipo factura */}
        <Select value={tipoFactura} onValueChange={(v) => setTipoFactura(v as TipoFactura)}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ticket">Ticket (sin CAE)</SelectItem>
            <SelectItem value="B">Factura B</SelectItem>
            <SelectItem value="A">Factura A</SelectItem>
            <SelectItem value="C">Factura C</SelectItem>
          </SelectContent>
        </Select>

        {/* Estado caja + accesos rápidos */}
        <div className="flex items-center gap-1.5 ml-auto">
          {cajaOk === null ? (
            <Badge variant="outline" className="text-xs">Verificando caja...</Badge>
          ) : cajaOk ? (
            <Badge className="bg-green-500 text-xs">Caja abierta</Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">Sin caja — abrí la caja</Badge>
          )}
          <Button variant="ghost" size="sm" onClick={verificarCaja} className="h-7 w-7 p-0">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Link href="/dashboard/pos/cierre">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              Cierre X/Z
            </Button>
          </Link>
        </div>
      </div>

      {/* ── BODY ────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══ PANEL IZQUIERDO: Productos ══════════════════════ */}
        <div className={`flex flex-col ${modo === "kiosko" ? "w-full" : "w-[60%]"} border-r overflow-hidden`}>

          {/* Búsqueda */}
          <div className="flex gap-2 px-3 py-2 shrink-0 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchRef}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter" && productosFiltrados.length === 1) {
                    agregarProducto(productosFiltrados[0])
                    setBusqueda("")
                  }
                }}
                placeholder="Buscar por nombre, código o código de barras... (/ para enfocar)"
                className={`pl-9 ${modo === "kiosko" ? "h-12 text-base" : "h-9"}`}
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {modo === "mesa" && (
              <Button variant="outline" size="sm" onClick={() => { cargarMesas(); setModalMesasOpen(true) }}>
                <UtensilsCrossed className="h-4 w-4 mr-1" />
                {mesaId ? `Mesa ${mesas.find(m => m.id === mesaId)?.numero ?? "?"}` : "Elegir mesa"}
              </Button>
            )}
          </div>

          {/* Categorías */}
          {categorias.length > 0 && (
            <div className="flex gap-1.5 px-3 py-1.5 overflow-x-auto shrink-0 border-b no-scrollbar">
              <button
                onClick={() => setCategoriaActiva("all")}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  categoriaActiva === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                Todos
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaActiva(cat.id)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    categoriaActiva === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          )}

          {/* Grilla de productos */}
          <ScrollArea className="flex-1">
            <div className={`grid gap-2 p-3 ${
              modo === "kiosko"
                ? "grid-cols-2 sm:grid-cols-3"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
            }`}>
              {cargandoProductos ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
                ))
              ) : productosFiltrados.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <ScanLine className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin productos{busqueda ? ` para "${busqueda}"` : ""}</p>
                </div>
              ) : (
                productosFiltrados.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => agregarProducto(p)}
                    disabled={p.stock <= 0 && !p.esPlato}
                    className={`
                      flex flex-col items-center justify-center rounded-xl border-2 transition-all
                      text-center p-2 gap-1 select-none
                      ${modo === "kiosko" ? "min-h-[100px]" : "min-h-[80px]"}
                      ${p.stock <= 0 && !p.esPlato
                        ? "opacity-40 cursor-not-allowed border-dashed"
                        : "border-border hover:border-primary hover:bg-primary/5 active:scale-95 cursor-pointer"
                      }
                    `}
                  >
                    <span className={`font-semibold leading-tight ${modo === "kiosko" ? "text-sm" : "text-xs"} line-clamp-2`}>
                      {p.nombre}
                    </span>
                    <span className={`font-bold text-primary ${modo === "kiosko" ? "text-lg" : "text-sm"}`}>
                      ${fmt(p.precioVenta)}
                    </span>
                    {p.stock <= 0 && !p.esPlato && (
                      <span className="text-[10px] text-destructive">Sin stock</span>
                    )}
                    {p.stock > 0 && p.stock <= 3 && (
                      <span className="text-[10px] text-amber-500">Últimas {p.stock}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* ══ PANEL DERECHO: Carrito ═══════════════════════════ */}
        {modo !== "kiosko" && (
          <div className="flex flex-col w-[40%] overflow-hidden bg-muted/30">

            {/* Header carrito */}
            <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span className="font-semibold text-sm">
                  Carrito {carrito.length > 0 && <Badge variant="secondary">{carrito.length}</Badge>}
                </span>
              </div>
              {carrito.length > 0 && (
                <Button variant="ghost" size="sm" onClick={vaciarCarrito} className="h-7 text-xs text-muted-foreground">
                  <X className="h-3 w-3 mr-1" />Vaciar
                </Button>
              )}
            </div>

            {/* Cliente */}
            <div className="px-3 py-2 border-b shrink-0">
              <Select
                value={clienteId ? String(clienteId) : "__cf__"}
                onValueChange={(v) => setClienteId(v === "__cf__" ? null : Number(v))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <User className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Consumidor Final" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__cf__">Consumidor Final</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                      {c.condicionIva && <span className="text-muted-foreground ml-1 text-xs">({c.condicionIva})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Items del carrito */}
            <ScrollArea className="flex-1">
              {carrito.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-xs">Tocá un producto para agregarlo</p>
                  <p className="text-xs opacity-60 mt-1">Atajos: <kbd className="px-1 rounded bg-muted">/</kbd> buscar · <kbd className="px-1 rounded bg-muted">F12</kbd> cobrar</p>
                </div>
              ) : (
                <div className="px-3 py-2 space-y-1.5">
                  {carrito.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-background rounded-lg px-2 py-1.5 border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.descripcion}</p>
                        <p className="text-xs text-muted-foreground">${fmt(item.precio)} c/u</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost" size="icon"
                          className="h-6 w-6"
                          onClick={() => cambiarCantidad(idx, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-bold w-6 text-center">{item.cantidad}</span>
                        <Button
                          variant="ghost" size="icon"
                          className="h-6 w-6"
                          onClick={() => cambiarCantidad(idx, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-sm font-bold w-20 text-right shrink-0">
                        ${fmt(item.precio * item.cantidad)}
                      </span>
                      <Button
                        variant="ghost" size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => eliminarItem(idx)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Descuento global */}
            {carrito.length > 0 && (
              <div className="px-3 py-1.5 border-t shrink-0">
                <div className="flex items-center gap-2">
                  <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Desc. global:</span>
                  <div className="flex items-center gap-1 ml-auto">
                    {[0, 5, 10, 15, 20].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDescuentoGlobal(d)}
                        className={`px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
                          descuentoGlobal === d
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        {d}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Totales */}
            <div className="px-4 py-3 border-t bg-background shrink-0 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal neto</span>
                <span>${fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>IVA</span>
                <span>${fmt(iva)}</span>
              </div>
              {descuentoGlobal > 0 && (
                <div className="flex justify-between text-xs text-green-600">
                  <span>Descuento {descuentoGlobal}%</span>
                  <span>incluido</span>
                </div>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between font-bold text-lg">
                <span>TOTAL</span>
                <span className="text-primary">${fmt(total)}</span>
              </div>
            </div>

            {/* Botón cobrar */}
            <div className="px-3 pb-3 shrink-0">
              <Button
                className="w-full h-14 text-lg font-bold tracking-wide"
                disabled={carrito.length === 0 || !cajaOk}
                onClick={abrirCobro}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                COBRAR ${fmt(total)}
                <kbd className="ml-2 text-xs opacity-60 font-normal">F12</kbd>
              </Button>
              {!cajaOk && carrito.length > 0 && (
                <p className="text-xs text-destructive text-center mt-1">
                  Abrí la caja desde el módulo Caja para poder cobrar
                </p>
              )}
            </div>
          </div>
        )}

        {/* Carrito flotante en modo kiosko (bottom bar) */}
        {modo === "kiosko" && carrito.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 px-4 py-3 flex items-center gap-4 z-50">
            <div className="flex items-center gap-2 text-white">
              <ShoppingCart className="h-5 w-5" />
              <span className="text-sm">{carrito.reduce((s, i) => s + i.cantidad, 0)} items</span>
            </div>
            <span className="text-white font-bold text-xl ml-auto">${fmt(total)}</span>
            <Button className="h-12 px-8 text-base font-bold" onClick={abrirCobro} disabled={!cajaOk}>
              COBRAR
            </Button>
            <Button variant="ghost" className="h-12 text-gray-400" onClick={vaciarCarrito}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* ═══ MODAL: Cobro ═══════════════════════════════════════ */}
      <Dialog open={modalCobroOpen} onOpenChange={(open) => { if (!procesando) setModalCobroOpen(open) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {ventaExitosa ? "Venta registrada" : "Cobro"}
            </DialogTitle>
            {!ventaExitosa && (
              <DialogDescription>
                Total a cobrar: <strong>${fmt(total)}</strong>
              </DialogDescription>
            )}
          </DialogHeader>

          {/* ── Venta exitosa ── */}
          {ventaExitosa ? (
            <div className="space-y-3">
              <div className="flex flex-col items-center py-4 gap-2">
                <CheckCircle2 className="h-14 w-14 text-green-500" />
                <p className="text-xl font-bold">{ventaExitosa.numeroCompleto}</p>
                <p className="text-muted-foreground text-sm">Total cobrado: <strong>${fmt(ventaExitosa.total)}</strong></p>
                {ventaExitosa.vuelto > 0.01 && (
                  <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950/30 px-4 py-2 rounded-lg border border-yellow-200">
                    <Banknote className="h-5 w-5 text-yellow-600" />
                    <span className="font-bold text-yellow-700 dark:text-yellow-400 text-lg">
                      Vuelto: ${fmt(ventaExitosa.vuelto)}
                    </span>
                  </div>
                )}
              </div>

              {/* Desglose IVA del ticket */}
              {ventaExitosa.ivaDesglose && ventaExitosa.ivaDesglose.length > 0 && (
                <div className="border rounded-lg p-3 text-xs space-y-1">
                  <p className="font-semibold text-muted-foreground uppercase tracking-wide mb-2">Desglose IVA</p>
                  {ventaExitosa.ivaDesglose.map((r) => (
                    <div key={r.pct} className="flex justify-between">
                      <span className="text-muted-foreground">Neto {r.pct} — IVA</span>
                      <span>${fmt(r.neto)} — <strong>${fmt(r.iva)}</strong></span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />Imprimir
                </Button>
                <Button className="flex-1" onClick={cerrarYNuevaVenta}>
                  Nueva venta
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Medios de pago seleccionados */}
              <div className="space-y-2">
                {pagos.map((pago, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select
                      value={pago.medio}
                      onValueChange={(v) => setPagos((ps) => ps.map((p, i) => i === idx ? { ...p, medio: v } : p))}
                    >
                      <SelectTrigger className="w-36 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEDIOS_PAGO.map((m) => (
                          <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      className={`flex-1 h-9 text-right font-bold ${numpadTarget === idx ? "ring-2 ring-primary" : ""}`}
                      value={numpadTarget === idx ? numpadInput : pago.monto.toFixed(2)}
                      onFocus={() => { setNumpadTarget(idx); setNumpadInput(String(pago.monto)) }}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setPagos((ps) => ps.map((p, i) => i === idx ? { ...p, monto: val } : p))
                        setNumpadInput(e.target.value)
                      }}
                      ref={idx === 0 ? montoEfectivoRef : undefined}
                    />
                    {pagos.length > 1 && (
                      <Button
                        variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground"
                        onClick={() => eliminarPago(idx)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                {pagos.length < 3 && (
                  <Button
                    variant="outline" size="sm" className="w-full text-xs h-8"
                    onClick={agregarMedioPago}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />Agregar otro medio de pago
                  </Button>
                )}
              </div>

              {/* Botones rápidos de medios */}
              <div className="grid grid-cols-3 gap-2">
                {MEDIOS_PAGO.slice(0, 6).map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setPagos([{ medio: m.key, monto: total }])}
                    className={`flex flex-col items-center py-2 rounded-lg text-white text-xs font-medium transition-all active:scale-95 ${m.color}`}
                  >
                    <m.icon className="h-4 w-4 mb-0.5" />
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Numpad táctil */}
              <div className="grid grid-cols-3 gap-1.5">
                {NUMPAD_KEYS.map((k) => (
                  <button
                    key={k}
                    onClick={() => numpadPress(k)}
                    className="h-12 rounded-lg border bg-muted hover:bg-muted/70 active:bg-primary active:text-primary-foreground font-bold text-base transition-all"
                  >
                    {k}
                  </button>
                ))}
              </div>

              {/* Resumen */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total</span><span className="font-bold">${fmt(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Recibe</span><span className="font-bold">${fmt(totalPagado)}</span>
                </div>
                {vuelto > 0.01 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Vuelto</span><span>${fmt(vuelto)}</span>
                  </div>
                )}
                {faltaPagar > 0.01 && (
                  <div className="flex justify-between text-destructive font-bold">
                    <span>Falta</span><span>${fmt(faltaPagar)}</span>
                  </div>
                )}
              </div>

              <Button
                className="w-full h-12 text-base font-bold"
                disabled={faltaPagar > 0.01 || procesando || !cajaOk}
                onClick={ejecutarVenta}
              >
                {procesando ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                {procesando ? "Procesando..." : "Confirmar cobro"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL: Mesas ════════════════════════════════════════ */}
      <Dialog open={modalMesasOpen} onOpenChange={setModalMesasOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              Seleccionar mesa
            </DialogTitle>
            <DialogDescription>
              Elegí la mesa para cargar su comanda al POS
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {mesas.map((mesa) => (
              <button
                key={mesa.id}
                onClick={() => cargarDesdemesa(mesa)}
                className={`border-2 rounded-xl p-3 text-center transition-all hover:shadow-md ${
                  mesa.estado === "ocupada"
                    ? "border-blue-300 bg-blue-50 dark:bg-blue-950/30"
                    : "border-green-300 bg-green-50 dark:bg-green-950/30"
                }`}
              >
                <p className="font-bold">Mesa {mesa.numero}</p>
                <p className="text-xs text-muted-foreground capitalize">{mesa.estado}</p>
                {mesa.comandas[0] && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {mesa.comandas[0].lineas.length} items
                  </Badge>
                )}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setModalMesasOpen(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />Volver
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
