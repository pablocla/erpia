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
import { PosPendientesPanel } from "@/components/pos/pos-pendientes-panel"
import { PosPendientesDrawer } from "@/components/pos/pos-pendientes-drawer"
import { PosVentasHoyDrawer } from "@/components/pos/pos-ventas-hoy-drawer"
import { PosPluBar } from "@/components/pos/pos-plu-bar"
import { PosCartSheet } from "@/components/pos/pos-cart-sheet"
import type { PosAfipStatus } from "@/lib/pos/pos-afip-status"
import { tipoFacturaSugerido } from "@/lib/pos/pos-tipo-factura"
import {
  guardarVentaSuspendida,
  type VentaSuspendida,
} from "@/lib/pos/ventas-suspendidas"

const POS_DRAFT_KEY = "erp:pos:draft:v1"

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
  esGranEmpresa?: boolean
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
  const [afipStatus, setAfipStatus] = useState<PosAfipStatus | null>(null)
  const [ventasHoy, setVentasHoy] = useState(0)
  const [imprimiendoFiscal, setImprimiendoFiscal] = useState(false)

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
    facturaId?: number
    numeroCompleto: string
    total: number
    vuelto: number
    cae?: string
    vencimientoCAE?: string
    qrBase64?: string
    afipError?: string
    esFce?: boolean
    ivaDesglose?: { pct: string; neto: number; iva: number }[]
  } | null>(null)
  const [umbralMipyme, setUmbralMipyme] = useState(5_468_127)
  const [tipoManual, setTipoManual] = useState(false)

  // ── Modal mesas (modo mesa) ─────────────────────────────────
  const [modalMesasOpen, setModalMesasOpen] = useState(false)
  const [cartSheetOpen, setCartSheetOpen] = useState(false)

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
      setAfipStatus(data.afip ?? null)
      setVentasHoy(data.ventasHoy ?? 0)
    } catch {
      setCajaOk(false)
      setAfipStatus(null)
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
    fetch("/api/config/parametros-fiscales", { headers: authH() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const p = data.find((x: { clave: string }) => x.clave === "umbral_mipyme")
          if (p) setUmbralMipyme(Number(p.valor))
        }
      })
      .catch(() => { /* silencioso */ })
    try {
      const raw = localStorage.getItem(POS_DRAFT_KEY)
      if (raw) {
        const draft = JSON.parse(raw) as {
          items: ItemCarrito[]
          clienteId: number | null
          mesaId: number | null
          descuentoGlobal: number
          tipoFactura: TipoFactura
        }
        if (draft.items?.length) {
          setCarrito(draft.items)
          setClienteId(draft.clienteId)
          setMesaId(draft.mesaId)
          setDescuentoGlobal(draft.descuentoGlobal ?? 0)
          if (draft.tipoFactura) setTipoFactura(draft.tipoFactura)
        }
      }
    } catch { /* silencioso */ }
  }, [verificarCaja, cargarCategorias, cargarProductos, cargarClientes, cargarMesas, modo, authH])

  useEffect(() => {
    if (clienteId && !tipoManual) {
      const c = clientes.find((x) => x.id === clienteId)
      if (c?.condicionIva) setTipoFactura(tipoFacturaSugerido(c.condicionIva))
    }
  }, [clienteId, clientes, tipoManual])

  useEffect(() => {
    if (carrito.length === 0) {
      localStorage.removeItem(POS_DRAFT_KEY)
      return
    }
    localStorage.setItem(
      POS_DRAFT_KEY,
      JSON.stringify({
        items: carrito,
        clienteId,
        mesaId,
        descuentoGlobal,
        tipoFactura,
      }),
    )
  }, [carrito, clienteId, mesaId, descuentoGlobal, tipoFactura])

  useEffect(() => { cargarProductos(busqueda) }, [busqueda, categoriaActiva, cargarProductos])

  // ──────────────────────────────────────────────────────────────
  // Keyboard shortcuts & Barcode Scanner
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let barcodeBuffer = ""
    let barcodeTimeout: NodeJS.Timeout | null = null

    const handler = (e: globalThis.KeyboardEvent) => {
      if (modalCobroOpen) return
      
      // Barcode Scanner Integration
      if (e.key !== "Enter" && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        barcodeBuffer += e.key
        if (barcodeTimeout) clearTimeout(barcodeTimeout)
        barcodeTimeout = setTimeout(() => { barcodeBuffer = "" }, 50)
        // No return here, to allow normal typing in search if focused
      }
      if (e.key === "Enter" && barcodeBuffer.length >= 4) {
        e.preventDefault()
        const scannedCode = barcodeBuffer
        barcodeBuffer = ""
        const p = productos.find(prod => prod.codigoBarras === scannedCode || prod.codigo === scannedCode)
        if (p) {
          setCarrito((prev) => {
            const existing = prev.findIndex((i) => i.productoId === p.id)
            if (existing >= 0) return prev.map((item, idx) => idx === existing ? { ...item, cantidad: item.cantidad + 1 } : item)
            return [...prev, { productoId: p.id, descripcion: p.nombre, precio: p.precioVenta, cantidad: 1, porcentajeIva: p.porcentajeIva ?? 21, descuento: 0 }]
          })
          toast({ title: "Producto escaneado", description: p.nombre })
        } else {
          toast({ variant: "destructive", title: "No encontrado", description: `Código ${scannedCode} no existe` })
        }
        return
      }
      if (e.key === "Enter") barcodeBuffer = ""

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
  }, [carrito, modalCobroOpen, productos])

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

  const suspenderVenta = () => {
    if (carrito.length === 0) return
    guardarVentaSuspendida({
      items: carrito.map((i) => ({
        productoId: i.productoId,
        descripcion: i.descripcion,
        precio: i.precio,
        cantidad: i.cantidad,
        porcentajeIva: i.porcentajeIva,
        descuento: i.descuento,
      })),
      total,
      clienteId,
      mesaId,
      descuentoGlobal,
      tipoFactura,
    })
    vaciarCarrito()
    toast({ title: "Venta suspendida", description: "Podés recuperarla desde Pendientes del turno" })
  }

  const recuperarVenta = (venta: VentaSuspendida) => {
    setCarrito(
      venta.items.map((i) => ({
        productoId: i.productoId,
        descripcion: i.descripcion,
        precio: i.precio,
        cantidad: i.cantidad,
        porcentajeIva: i.porcentajeIva,
        descuento: i.descuento,
      }))
    )
    setClienteId(venta.clienteId ?? null)
    setMesaId(venta.mesaId ?? null)
    setDescuentoGlobal(venta.descuentoGlobal ?? 0)
    if (venta.tipoFactura) setTipoFactura(venta.tipoFactura as TipoFactura)
    toast({ title: "Venta recuperada", description: `${venta.items.length} ítem(s) cargados` })
  }

  // ──────────────────────────────────────────────────────────────
  // Totales (Precision Decimal Fix)
  // ──────────────────────────────────────────────────────────────
  const calcTotales = () => {
    let subtotalCents = 0
    let totalIvaCents = 0
    for (const item of carrito) {
      const base = item.precio * item.cantidad * (1 - (item.descuento + descuentoGlobal) / 100)
      const neto = base / (1 + item.porcentajeIva / 100)
      // Trabajamos con Math.round para evitar el Bug A-007 (IEEE 754 float precision)
      subtotalCents += Math.round(neto * 100)
      totalIvaCents += Math.round((base - neto) * 100)
    }
    const totalCents = subtotalCents + totalIvaCents
    return {
      subtotal: subtotalCents / 100,
      iva: totalIvaCents / 100,
      total: totalCents / 100,
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
    if (afipBloqueaFiscal) {
      setError("Configurá el certificado AFIP o usá Ticket (sin CAE)")
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

      // Computar desglose IVA desde el carrito para mostrar en ticket con precisión decimal
      const ivaMap = new Map<number, { netoCents: number; ivaCents: number }>()
      for (const item of carrito) {
        const base = item.precio * item.cantidad * (1 - (item.descuento + descuentoGlobal) / 100)
        const neto = base / (1 + item.porcentajeIva / 100)
        const ivaAmt = base - neto
        const existing = ivaMap.get(item.porcentajeIva)
        if (existing) { 
          existing.netoCents += Math.round(neto * 100)
          existing.ivaCents += Math.round(ivaAmt * 100)
        }
        else ivaMap.set(item.porcentajeIva, { netoCents: Math.round(neto * 100), ivaCents: Math.round(ivaAmt * 100) })
      }
      const ivaDesglose = [...ivaMap.entries()]
        .filter(([, v]) => v.ivaCents > 0)
        .sort(([a], [b]) => b - a)
        .map(([pct, v]) => ({
          pct: `${pct}%`,
          neto: v.netoCents / 100,
          iva: v.ivaCents / 100,
        }))

      setVentaExitosa({
        facturaId: data.facturaId,
        numeroCompleto: data.numeroCompleto,
        total: data.total,
        vuelto: data.vuelto,
        cae: data.cae,
        vencimientoCAE: data.vencimientoCAE,
        qrBase64: data.qrBase64,
        afipError: data.afipError,
        esFce: data.esFce,
        ivaDesglose,
      })
      localStorage.removeItem(POS_DRAFT_KEY)

      // Recargar productos y caja después de venta exitosa
      cargarProductos(busqueda)
      verificarCaja()

    } catch (err: any) {
      // Modo Offline Básico con IndexedDB
      try {
        const req = indexedDB.open("pos_offline_db", 1)
        req.onupgradeneeded = (e: any) => e.target.result.createObjectStore("ventas", { autoIncrement: true })
        req.onsuccess = (e: any) => {
          const db = e.target.result
          db.transaction("ventas", "readwrite").objectStore("ventas").add({ 
             fecha: new Date().toISOString(), 
             carrito, pagos, total, tipoFactura 
          })
          toast({ title: "Modo Offline Activo", description: "Venta guardada localmente (se enviará luego)." })
        }
        setVentaExitosa({
          numeroCompleto: `OFFLINE-${Date.now().toString().slice(-6)}`,
          total: total,
          vuelto: vuelto,
          ivaDesglose: [],
        })
      } catch {
        setError("Error de conexión. Verificá la red.")
      }
    } finally {
      setProcesando(false)
    }
  }

  const cerrarYNuevaVenta = () => {
    setModalCobroOpen(false)
    setVentaExitosa(null)
    localStorage.removeItem(POS_DRAFT_KEY)
    vaciarCarrito()
    toast({ title: "Venta registrada", description: "Lista para la próxima venta" })
  }

  const imprimirFiscal = async () => {
    if (!ventaExitosa?.facturaId) {
      window.print()
      return
    }
    setImprimiendoFiscal(true)
    try {
      const res = await fetch("/api/impresion/imprimir-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authH() },
        body: JSON.stringify({ facturaId: ventaExitosa.facturaId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Impresión fiscal",
          description: data.error ?? "No se pudo imprimir. Usá impresión navegador.",
        })
        window.print()
        return
      }
      toast({ title: "Ticket enviado", description: data.mensaje ?? "Impresora fiscal" })
    } catch {
      toast({
        variant: "destructive",
        title: "Sin conexión",
        description: "Usando impresión del navegador",
      })
      window.print()
    } finally {
      setImprimiendoFiscal(false)
    }
  }

  const afipBloqueaFiscal =
    tipoFactura !== "ticket" &&
    afipStatus?.semaforo === "error"

  const clienteActivo = clientes.find((c) => c.id === clienteId)
  const tipoSugerido = clienteActivo
    ? tipoFacturaSugerido(clienteActivo.condicionIva)
    : "B"
  const tipoMismatch =
    tipoFactura !== "ticket" && clienteActivo && tipoFactura !== tipoSugerido
  const requiereFce =
    tipoFactura !== "ticket" &&
    clienteActivo?.esGranEmpresa &&
    total >= umbralMipyme

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
    <div className={`flex flex-col h-full min-h-0 overflow-hidden ${modo === "kiosko" ? "bg-black text-white" : ""}`}>
      <style>{`
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body * { visibility: hidden; }
          #ticket-print, #ticket-print * { visibility: visible; }
          #ticket-print { position: absolute; left: 0; top: 0; width: 80mm; padding: 5mm; font-family: monospace; font-size: 12px; }
          .hide-on-print { display: none !important; }
        }
      `}</style>

      {/* ── TOPBAR POS ──────────────────────────────────────── */}
      <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 border-b shrink-0 overflow-x-auto scrollbar-thin ${modo === "kiosko" ? "bg-gray-900 border-gray-700" : "bg-background"}`}>
        {/* Selector de modo */}
        <div className="flex rounded-lg border overflow-hidden shrink-0">
          {([
            { key: "mostrador", icon: Store, label: "Mostrador" },
            { key: "mesa", icon: UtensilsCrossed, label: "Mesa" },
            { key: "kiosko", icon: Monitor, label: "Kiosko" },
          ] as { key: ModoPos; icon: React.ElementType; label: string }[]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setModo(key)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-medium transition-colors touch-manipulation min-h-[40px] ${
                modo === key
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tipo factura */}
        <Select
          value={tipoFactura}
          onValueChange={(v) => {
            setTipoManual(true)
            setTipoFactura(v as TipoFactura)
          }}
        >
          <SelectTrigger className="w-[7.5rem] sm:w-32 h-9 sm:h-8 text-xs shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ticket">Ticket (sin CAE)</SelectItem>
            <SelectItem value="B">Factura B</SelectItem>
            <SelectItem value="A">Factura A</SelectItem>
            <SelectItem value="C">Factura C</SelectItem>
          </SelectContent>
        </Select>

        {/* Semáforos + pendientes + accesos */}
        <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">
          {ventasHoy > 0 && (
            <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
              {ventasHoy} venta{ventasHoy !== 1 ? "s" : ""} hoy
            </Badge>
          )}
          {cajaOk === null ? (
            <Badge variant="outline" className="text-xs">Caja...</Badge>
          ) : cajaOk ? (
            <Badge className="bg-green-600 hover:bg-green-600 text-xs gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
              Caja OK
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
              Caja cerrada
            </Badge>
          )}
          {afipStatus && (
            <Badge
              className={`text-xs gap-1 ${
                afipStatus.semaforo === "ok"
                  ? "bg-green-600 hover:bg-green-600"
                  : afipStatus.semaforo === "atencion"
                    ? "bg-amber-500 hover:bg-amber-500 text-amber-950"
                    : "bg-destructive hover:bg-destructive"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
              {afipStatus.label}
            </Badge>
          )}
          <PosVentasHoyDrawer authHeaders={authH} onAnulada={verificarCaja} />
          <PosPendientesDrawer authHeaders={authH} onRefreshStatus={verificarCaja} />
          <Button variant="ghost" size="sm" onClick={verificarCaja} className="h-7 w-7 p-0">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Link href="/dashboard/pos/cierre" className="shrink-0">
            <Button variant="outline" size="sm" className="h-8 sm:h-7 text-xs gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cierre X/Z</span>
            </Button>
          </Link>
        </div>
      </div>

      {cajaOk === false && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-destructive/10 border-b border-destructive/30 shrink-0">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <Lock className="h-4 w-4 shrink-0" />
            <span>Caja cerrada — abrí la caja antes de vender</span>
          </div>
          <Link href="/dashboard/caja">
            <Button size="sm" variant="destructive" className="h-7 text-xs">
              Abrir caja
            </Button>
          </Link>
        </div>
      )}

      {afipBloqueaFiscal && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-destructive/10 border-b border-destructive/30 shrink-0">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Certificado AFIP no configurado — usá Ticket o configurá AFIP</span>
          </div>
          <Link href="/dashboard/configuracion?seccion=afip">
            <Button size="sm" variant="outline" className="h-7 text-xs">
              Configurar AFIP
            </Button>
          </Link>
        </div>
      )}

      {requiereFce && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 shrink-0">
          <div className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-100">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              Cliente Gran Empresa — total ≥ ${umbralMipyme.toLocaleString("es-AR")}: se emitirá FCE MiPyME
            </span>
          </div>
          <Link href="/dashboard/configuracion?seccion=fiscal">
            <Button size="sm" variant="outline" className="h-7 text-xs">
              Config FCE
            </Button>
          </Link>
        </div>
      )}

      {tipoMismatch && (
        <div className="px-4 py-1.5 bg-muted/50 border-b text-[11px] text-muted-foreground shrink-0">
          Sugerido para este cliente: <strong>Factura {tipoSugerido}</strong>
          <button
            type="button"
            className="ml-2 underline text-primary"
            onClick={() => {
              setTipoFactura(tipoSugerido)
              setTipoManual(false)
            }}
          >
            Aplicar
          </button>
        </div>
      )}

      {/* ── BODY ────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══ PANEL IZQUIERDO: Productos ══════════════════════ */}
        <div className={`flex flex-col ${modo === "kiosko" ? "w-full" : "w-full lg:w-[60%]"} border-r overflow-hidden`}>

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
                placeholder="Buscar producto o escanear…"
                className={`pl-9 ${modo === "kiosko" ? "h-12 text-base" : "h-11 sm:h-9 text-base sm:text-sm"}`}
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

          <PosPluBar
            authHeaders={authH}
            onAgregar={(p) =>
              agregarProducto({
                id: p.id,
                nombre: p.nombre,
                codigo: "",
                precioVenta: p.precioVenta,
                porcentajeIva: p.porcentajeIva,
                stock: p.stock,
              })
            }
          />

          {/* Categorías */}
          {categorias.length > 0 && (
            <div className="flex gap-1.5 px-3 py-2 overflow-x-auto shrink-0 border-b scrollbar-thin">
              <button
                onClick={() => setCategoriaActiva("all")}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation ${
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
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation ${
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
            <div className={`grid gap-2 p-3 pb-24 lg:pb-3 ${
              modo === "kiosko"
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
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
                      ${modo === "kiosko" ? "min-h-[108px]" : "min-h-[92px] sm:min-h-[80px]"}
                      touch-manipulation active:scale-[0.97]
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
          <div className="hidden lg:flex flex-col w-[40%] overflow-hidden bg-muted/30">

            <PosPendientesPanel
              cajaOk={cajaOk}
              onRecuperar={recuperarVenta}
              onSuspender={suspenderVenta}
              puedeSuspender={carrito.length > 0}
            />

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
                disabled={carrito.length === 0 || !cajaOk || afipBloqueaFiscal}
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

        {/* Barra inferior móvil / tablet */}
        {modo !== "kiosko" && (
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 max-w-lg mx-auto">
              <button
                type="button"
                onClick={() => setCartSheetOpen(true)}
                className="flex items-center gap-2 min-h-[48px] px-3 rounded-xl border bg-card flex-1 touch-manipulation active:scale-[0.98]"
              >
                <ShoppingCart className="h-5 w-5 text-primary shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {carrito.length === 0 ? "Carrito vacío" : `${carrito.reduce((s, i) => s + i.cantidad, 0)} ítems`}
                  </p>
                  <p className="font-bold text-base leading-none">${fmt(total)}</p>
                </div>
              </button>
              <Button
                className="h-12 px-5 text-base font-bold shrink-0"
                onClick={abrirCobro}
                disabled={carrito.length === 0 || !cajaOk || afipBloqueaFiscal}
              >
                COBRAR
              </Button>
            </div>
          </div>
        )}

        {/* Kiosko: barra clásica */}
        {modo === "kiosko" && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 px-4 py-3 flex items-center gap-4 z-50 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-2 text-white">
              <ShoppingCart className="h-5 w-5" />
              <span className="text-sm">{carrito.reduce((s, i) => s + i.cantidad, 0)} items</span>
            </div>
            <span className="text-white font-bold text-xl ml-auto">${fmt(total)}</span>
            <Button className="h-12 px-8 text-base font-bold touch-manipulation" onClick={abrirCobro} disabled={!cajaOk || afipBloqueaFiscal}>
              COBRAR
            </Button>
            <Button variant="ghost" className="h-12 w-12 text-gray-400 touch-manipulation" onClick={vaciarCarrito}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <PosCartSheet
        open={cartSheetOpen}
        onOpenChange={setCartSheetOpen}
        carrito={carrito}
        clientes={clientes}
        clienteId={clienteId}
        onClienteChange={setClienteId}
        descuentoGlobal={descuentoGlobal}
        onDescuentoChange={setDescuentoGlobal}
        subtotal={subtotal}
        iva={iva}
        total={total}
        fmt={fmt}
        onCantidad={cambiarCantidad}
        onEliminar={eliminarItem}
        onVaciar={vaciarCarrito}
        onCobrar={abrirCobro}
        cajaOk={cajaOk}
        afipBloqueaFiscal={afipBloqueaFiscal}
      />

      {/* ═══ MODAL: Cobro ═══════════════════════════════════════ */}
      <Dialog open={modalCobroOpen} onOpenChange={(open) => { if (!procesando) setModalCobroOpen(open) }}>
        <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-md max-h-[min(92dvh,640px)] overflow-y-auto">
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
            <div className="space-y-3" id="ticket-print">
              <div className="flex flex-col items-center py-4 gap-2">
                <CheckCircle2 className="h-14 w-14 text-green-500 hide-on-print" />
                <h3 className="font-bold text-xl text-center hidden print:block">TICKET DE VENTA</h3>
                <p className="text-xl font-bold">{ventaExitosa.numeroCompleto}</p>
                {ventaExitosa.esFce && (
                  <Badge className="bg-amber-500/90 text-amber-950">FCE MiPyME</Badge>
                )}
                <p className="text-muted-foreground text-sm">Total cobrado: <strong>${fmt(ventaExitosa.total)}</strong></p>
                {ventaExitosa.cae && (
                  <p className="text-xs font-mono">
                    CAE: {ventaExitosa.cae}
                    {ventaExitosa.vencimientoCAE && (
                      <span className="text-muted-foreground ml-2">
                        vence {new Date(ventaExitosa.vencimientoCAE).toLocaleDateString("es-AR")}
                      </span>
                    )}
                  </p>
                )}
                {ventaExitosa.afipError && (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg border border-amber-200 hide-on-print">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{ventaExitosa.afipError} — reintentá desde Pendientes</span>
                  </div>
                )}
                {ventaExitosa.qrBase64 && (
                  <div className="hide-on-print">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ventaExitosa.qrBase64} alt="QR AFIP" className="h-24 w-24 mx-auto rounded border" />
                  </div>
                )}
                {ventaExitosa.vuelto > 0.01 && (
                  <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950/30 px-4 py-2 rounded-lg border border-yellow-200 hide-on-print">
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
              
              {/* Mensaje pie ticket impreso */}
              <div className="text-center text-xs mt-4 hidden print:block border-t pt-2">
                <p>¡Gracias por su compra!</p>
              </div>

              <div className="flex gap-2 hide-on-print">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => void imprimirFiscal()}
                  disabled={imprimiendoFiscal}
                >
                  {imprimiendoFiscal ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Printer className="h-4 w-4 mr-2" />
                  )}
                  {ventaExitosa.facturaId ? "Imprimir fiscal" : "Imprimir"}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MEDIOS_PAGO.slice(0, 6).map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setPagos([{ medio: m.key, monto: total }])}
                    className={`flex flex-col items-center py-3 sm:py-2 rounded-lg text-white text-xs font-medium transition-all active:scale-95 touch-manipulation min-h-[52px] ${m.color}`}
                  >
                    <m.icon className="h-5 w-5 sm:h-4 sm:w-4 mb-0.5" />
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Numpad táctil */}
              <div className="grid grid-cols-3 gap-2">
                {NUMPAD_KEYS.map((k) => (
                  <button
                    key={k}
                    onClick={() => numpadPress(k)}
                    className="h-14 sm:h-12 rounded-lg border bg-muted hover:bg-muted/70 active:bg-primary active:text-primary-foreground font-bold text-lg sm:text-base transition-all touch-manipulation"
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
                disabled={faltaPagar > 0.01 || procesando || !cajaOk || afipBloqueaFiscal}
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
