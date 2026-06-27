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
  useState, useEffect, useCallback, useRef, useMemo,
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
  BarChart3, Lock, BookOpen, ChevronDown, ChevronUp, Ticket, Package,
} from "lucide-react"
import Link from "next/link"
import { PosPendientesPanel } from "@/components/pos/pos-pendientes-panel"
import { PosPendientesDrawer } from "@/components/pos/pos-pendientes-drawer"
import { PosVentasHoyDrawer } from "@/components/pos/pos-ventas-hoy-drawer"
import { PosPluBar } from "@/components/pos/pos-plu-bar"
import { PosCartSheet } from "@/components/pos/pos-cart-sheet"
import { PosAlertStrip, type PosAlertItem } from "@/components/pos/pos-alert-strip"
import {
  vibrarAgregarProducto, ordenarClientesPos, labelCajaBadge, mensajeCajaBloqueada,
  type CajaMotivo,
} from "@/lib/pos/pos-feedback"
import { parseApiList } from "@/lib/api/parse-list-response"
import { usePosLayout } from "@/hooks/use-pos-layout"
import { useAlmacenRosario } from "@/hooks/use-almacen-rosario"
import type { PosAfipStatus } from "@/lib/pos/pos-afip-status"
import { tipoFacturaSugerido } from "@/lib/pos/pos-tipo-factura"
import {
  guardarVentaSuspendida,
  type VentaSuspendida,
} from "@/lib/pos/ventas-suspendidas"
import { FiscalEmissionResult, type FiscalEmissionData } from "@/components/fiscal/fiscal-emission-result"
import { FiscalTicketView } from "@/components/fiscal/fiscal-ticket-view"
import { FiscalOutputActions } from "@/components/fiscal/fiscal-output-actions"
import { BalanzaNumpad } from "@/components/pos/balanza-numpad"
import { PosBarcodeCamera } from "@/components/pos/pos-barcode-camera"
import { PosTicketTermico } from "@/components/pos/ticket-termico"
import { PosVariantePicker } from "@/components/pos/pos-variante-picker"
import { PosEnvasesDialog } from "@/components/pos/pos-envases-dialog"
import { PosSkuGateButton } from "@/components/pos/pos-sku-gate-button"
import type { TicketLegalData } from "@/lib/fiscal/ticket-legal"
import type { SalidaComprobante } from "@/lib/fiscal/emission-config"
import type { VarianteGrupo } from "@/lib/pos/pos-catalogo-grupos"
import { beepEscaneoError, beepEscaneoOk } from "@/lib/pos/barcode-feedback"
import { productoRequiereCantidadVariable } from "@/lib/pos/producto-cantidad-variable"
import { useAuthStore } from "@/lib/stores"

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
  unidad?: string
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
  numeroVale?: string
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
  fiadoHabilitado?: boolean
  limiteCredito?: number
  saldoCuentaCorriente?: number
}

const MEDIOS_PAGO = [
  { key: "efectivo", label: "Efectivo", icon: Banknote, color: "bg-green-500 hover:bg-green-600" },
  { key: "tarjeta_debito", label: "Débito", icon: CreditCard, color: "bg-blue-500 hover:bg-blue-600" },
  { key: "tarjeta_credito", label: "Crédito", icon: CreditCard, color: "bg-purple-500 hover:bg-purple-600" },
  { key: "qr", label: "QR/MP", icon: Smartphone, color: "bg-sky-500 hover:bg-sky-600" },
  { key: "transferencia", label: "Transfer.", icon: Receipt, color: "bg-orange-500 hover:bg-orange-600" },
  { key: "cuenta_corriente", label: "Cta. Cte.", icon: Wallet, color: "bg-gray-500 hover:bg-gray-600" },
  { key: "vale", label: "Vale", icon: Ticket, color: "bg-amber-500 hover:bg-amber-600" },
]

const NUMPAD_KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "⌫"]

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

export default function POSPage() {
  const { toast } = useToast()
  const { promos: promosHoy, refreshPromos } = useAlmacenRosario()
  const searchRef = useRef<HTMLInputElement>(null)
  const montoEfectivoRef = useRef<HTMLInputElement>(null)

  // ── Estado general ──────────────────────────────────────────
  const [modo, setModo] = useState<ModoPos>("mostrador")
  const { layout: posLayout } = usePosLayout(modo)
  const [cajaId, setCajaId] = useState<number | null>(null)
  const [cajaOk, setCajaOk] = useState<boolean | null>(null)
  const [cajaMotivo, setCajaMotivo] = useState<CajaMotivo | null>(null)
  const [fiadoActivo, setFiadoActivo] = useState(false)
  const [envasesActivo, setEnvasesActivo] = useState(false)
  const [valesActivo, setValesActivo] = useState(false)
  const [envasesDialogOpen, setEnvasesDialogOpen] = useState(false)
  const [valeInfo, setValeInfo] = useState<Record<number, { saldo: number; numero: string }>>({})
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
    esExportacion?: boolean
    modalidadAuth?: "CAE" | "CAEA" | "NINGUNA"
    pendienteCae?: boolean
    esTicket?: boolean
    tipo?: string
    ivaDesglose?: { pct: string; neto: number; iva: number }[]
    lineas?: { descripcion: string; cantidad: number; precio: number }[]
    medioPago?: string
    empresaNombre?: string
  } | null>(null)
  const [ticketLegal, setTicketLegal] = useState<TicketLegalData | null>(null)
  const [salidaComprobante, setSalidaComprobante] = useState<SalidaComprobante>("preguntar")
  const [imprimirAuto, setImprimirAuto] = useState(false)
  const [propina, setPropina] = useState(0)
  const [catalogoGrupos, setCatalogoGrupos] = useState<{
    variantes: VarianteGrupo[]
    productoIdsConVariantes: number[]
    productoIdsCombo: number[]
  } | null>(null)
  const [grupoVariante, setGrupoVariante] = useState<VarianteGrupo | null>(null)
  const [variantePickerOpen, setVariantePickerOpen] = useState(false)
  const [indicesCobro, setIndicesCobro] = useState<number[] | null>(null)
  const [indicesSeleccionados, setIndicesSeleccionados] = useState<Set<number>>(new Set())
  const [mpQrDataUrl, setMpQrDataUrl] = useState<string | null>(null)
  const [mpQrRef, setMpQrRef] = useState<string | null>(null)
  const [mpQrLoading, setMpQrLoading] = useState(false)
  const [mpQrAprobado, setMpQrAprobado] = useState(false)
  const [umbralMipyme, setUmbralMipyme] = useState(5_468_127)
  const [tipoManual, setTipoManual] = useState(false)
  const [balanzaProducto, setBalanzaProducto] = useState<Producto | null>(null)
  const [balanzaOpen, setBalanzaOpen] = useState(false)
  const empresaNombre = useAuthStore((s) => s.user?.empresaNombre ?? "Comercio")

  // ── Modal mesas (modo mesa) ─────────────────────────────────
  const [modalMesasOpen, setModalMesasOpen] = useState(false)
  const [cartSheetOpen, setCartSheetOpen] = useState(false)
  const [numpadAbierto, setNumpadAbierto] = useState(false)

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
  const cargarConfigEmision = useCallback(async () => {
    try {
      const res = await fetch("/api/config/fiscal-emision", { headers: authH() })
      if (res.ok) {
        const cfg = await res.json()
        setSalidaComprobante(cfg.salida ?? "preguntar")
        setImprimirAuto(!!cfg.imprimirAuto)
      }
    } catch { /* silent */ }
  }, [authH])

  const cargarCatalogoGrupos = useCallback(async () => {
    try {
      const res = await fetch("/api/pos/catalogo-grupos", { headers: authH() })
      if (res.ok) setCatalogoGrupos(await res.json())
    } catch { /* silent */ }
  }, [authH])

  const cargarTicketLegal = useCallback(async (facturaId: number) => {
    try {
      const res = await fetch(`/api/fiscal/ticket-legal?facturaId=${facturaId}`, { headers: authH() })
      if (res.ok) {
        const raw = await res.json()
        setTicketLegal({
          ...raw,
          factura: { ...raw.factura, fecha: new Date(raw.factura.fecha), vencimientoCAE: new Date(raw.factura.vencimientoCAE) },
        })
      }
    } catch {
      setTicketLegal(null)
    }
  }, [authH])

  const verificarCaja = useCallback(async () => {
    try {
      const res = await fetch("/api/pos/venta", { headers: authH() })
      if (res.status === 401) {
        setCajaOk(false)
        setCajaMotivo("auth")
        setCajaId(null)
        setAfipStatus(null)
        return
      }
      if (!res.ok) {
        setCajaOk(false)
        setCajaMotivo("red")
        setCajaId(null)
        setAfipStatus(null)
        return
      }
      const data = await res.json()
      setCajaOk(!!data.cajaAbierta)
      setCajaMotivo(data.cajaAbierta ? null : "cerrada")
      setCajaId(data.cajaId ?? null)
      setAfipStatus(data.afip ?? null)
      setVentasHoy(data.ventasHoy ?? 0)
      setFiadoActivo(!!data.fiadoActivo)
      setEnvasesActivo(!!data.envasesActivo)
      setValesActivo(!!data.valesActivo)
    } catch {
      setCajaOk(false)
      setCajaMotivo("red")
      setCajaId(null)
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
      setCategorias(parseApiList(data))
    } catch { /* silent */ }
  }, [authH])

  const cargarClientes = useCallback(async () => {
    try {
      const res = await fetch("/api/clientes?take=500", { headers: authH() })
      const data = await res.json()
      setClientes(parseApiList(data))
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
    cargarConfigEmision()
    cargarCatalogoGrupos()
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
  // Carrito helpers
  // ──────────────────────────────────────────────────────────────
  const agregarProducto = (
    p: Producto,
    opts?: {
      precio?: number
      descuento?: number
      cantidad?: number
      descripcion?: string
      noMerge?: boolean
    },
  ) => {
    if (posLayout.ux.hapticOnAdd) vibrarAgregarProducto()
    const precio = opts?.precio ?? p.precioVenta
    const descuento = opts?.descuento ?? 0
    const cantidad = opts?.cantidad ?? 1
    const descripcion = opts?.descripcion ?? p.nombre
    setCarrito((prev) => {
      if (!opts?.noMerge && cantidad === 1 && !opts?.descripcion) {
        const existing = prev.findIndex((i) => i.productoId === p.id)
        if (existing >= 0) {
          return prev.map((item, idx) =>
            idx === existing
              ? {
                  ...item,
                  cantidad: item.cantidad + 1,
                  precio: opts?.precio != null ? precio : item.precio,
                  descuento: opts?.descuento != null ? descuento : item.descuento,
                }
              : item,
          )
        }
      }
      return [
        ...prev,
        {
          productoId: p.id,
          descripcion,
          precio,
          cantidad,
          porcentajeIva: p.porcentajeIva ?? 21,
          descuento,
        },
      ]
    })
  }

  const evaluarYAgregar = useCallback(
    async (p: Producto) => {
      try {
        const res = await fetch("/api/pos/almacen/evaluar-producto", {
          method: "POST",
          headers: { ...authH(), "Content-Type": "application/json" },
          body: JSON.stringify({ productoId: p.id, precioLista: p.precioVenta }),
        })
        if (res.ok) {
          const ev = await res.json()
          if (ev.bloquear) {
            toast({
              variant: "destructive",
              title: "Margen negativo",
              description: ev.alertas?.[0]?.mensaje ?? "Actualizá el precio en góndola",
            })
            return
          }
          for (const a of ev.alertas ?? []) {
            if (a.severidad === "warning") {
              toast({ title: a.mensaje, variant: "default" })
            }
          }
          agregarProducto(p, {
            precio: ev.precioFinal ?? p.precioVenta,
            descuento: ev.descuentoPct ?? 0,
          })
          return
        }
      } catch {
        /* fallback directo */
      }
      agregarProducto(p)
    },
    [authH, toast],
  )

  const iniciarAgregarProducto = useCallback(
    (p: Producto) => {
      if (productoRequiereCantidadVariable(p.unidad)) {
        setBalanzaProducto(p)
        setBalanzaOpen(true)
        return
      }
      void evaluarYAgregar(p)
    },
    [evaluarYAgregar],
  )

  const clicProducto = (p: Producto) => {
    const grupo = catalogoGrupos?.variantes.find((g) =>
      g.variantes.some((v) => v.id === p.id),
    )
    if (grupo && grupo.variantes.length > 1) {
      setGrupoVariante(grupo)
      setVariantePickerOpen(true)
      return
    }
    iniciarAgregarProducto(p)
  }

  const buscarYAgregarCodigo = useCallback((code: string) => {
    const p = productos.find(
      (prod) => prod.codigoBarras === code || prod.codigo === code,
    )
    if (p) {
      iniciarAgregarProducto(p)
      beepEscaneoOk()
      toast({ title: "Agregado", description: p.nombre, duration: 1200 })
      return
    }
    fetch(`/api/productos?search=${encodeURIComponent(code)}&soloActivos=true`, {
      headers: authH(),
    })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        const found = list.find(
          (prod: Producto) => prod.codigoBarras === code || prod.codigo === code,
        )
        if (found) {
          iniciarAgregarProducto(found)
          beepEscaneoOk()
          toast({ title: "Agregado", description: found.nombre, duration: 1200 })
        } else {
          beepEscaneoError()
          toast({ variant: "destructive", title: "No encontrado", description: `Código ${code}` })
        }
      })
      .catch(() => {
        beepEscaneoError()
        toast({ variant: "destructive", title: "Error al buscar código" })
      })
  }, [productos, authH, toast, iniciarAgregarProducto])

  const seleccionarVariante = (productoId: number) => {
    const p = productos.find((x) => x.id === productoId)
    if (p) iniciarAgregarProducto(p)
    else {
      fetch(`/api/productos?search=&soloActivos=true`, { headers: authH() })
        .then((r) => r.json())
        .then((data) => {
          const found = (Array.isArray(data) ? data : []).find(
            (x: Producto) => x.id === productoId,
          )
          if (found) iniciarAgregarProducto(found)
        })
    }
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
  const carritoActivo = useMemo(() => {
    if (!indicesCobro?.length) return carrito
    return indicesCobro.map((i) => carrito[i]).filter(Boolean)
  }, [carrito, indicesCobro])

  const calcTotales = (items = carritoActivo) => {
    let subtotalCents = 0
    let totalIvaCents = 0
    for (const item of items) {
      const base = item.precio * item.cantidad * (1 - (item.descuento + descuentoGlobal) / 100)
      const neto = base / (1 + item.porcentajeIva / 100)
      subtotalCents += Math.round(neto * 100)
      totalIvaCents += Math.round((base - neto) * 100)
    }
    const propinaCents = Math.round(propina * 100)
    const totalCents = subtotalCents + totalIvaCents + propinaCents
    return {
      subtotal: subtotalCents / 100,
      iva: totalIvaCents / 100,
      propina,
      total: totalCents / 100,
    }
  }

  const { subtotal, iva, total } = calcTotales()
  const totalSinPropina = subtotal + iva

  const productosVisibles = useMemo(() => {
    if (!catalogoGrupos?.variantes.length) return productos
    const idsVariantes = new Set(catalogoGrupos.productoIdsConVariantes)
    return productos.filter((p) => {
      if (!idsVariantes.has(p.id)) return true
      const grupo = catalogoGrupos.variantes.find((g) =>
        g.variantes.some((v) => v.id === p.id),
      )
      return grupo?.variantes[0]?.id === p.id
    })
  }, [productos, catalogoGrupos])

  // ──────────────────────────────────────────────────────────────
  // Cobro / Numpad
  // ──────────────────────────────────────────────────────────────
  const abrirCobro = (opts?: { medio?: string; monto?: number; indices?: number[] }) => {
    const items = opts?.indices?.length
      ? opts.indices.map((i) => carrito[i]).filter(Boolean)
      : carrito
    if (items.length === 0) return
    setIndicesCobro(opts?.indices?.length ? opts.indices : null)
    const montoCobro = calcTotales(items).total
    const medio = opts?.medio ?? "efectivo"
    const monto = opts?.monto ?? montoCobro
    setPagos([{ medio, monto }])
    setNumpadTarget(0)
    setNumpadInput(String(monto))
    setVentaExitosa(null)
    setError("")
    setMpQrDataUrl(null)
    setMpQrRef(null)
    setMpQrAprobado(false)
    setNumpadAbierto(medio === "efectivo" && posLayout.cobro.numpadDefaultOpen)
    setModalCobroOpen(true)
    void refreshPromos()
    setTimeout(() => montoEfectivoRef.current?.select(), 100)
  }

  const generarQrMercadoPago = async () => {
    setMpQrLoading(true)
    setMpQrAprobado(false)
    try {
      const res = await fetch("/api/pos/mercadopago-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authH() },
        body: JSON.stringify({ monto: total, descripcion: "Venta POS" }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "No se pudo generar QR")
        return
      }
      setMpQrDataUrl(data.qrDataUrl)
      setMpQrRef(data.externalReference)
      toast({ title: "QR generado", description: "Mostrá el código al cliente" })
    } catch {
      setError("Error al generar QR MercadoPago")
    } finally {
      setMpQrLoading(false)
    }
  }

  useEffect(() => {
    if (!posLayout.ux.keyboardShortcuts) return

    let barcodeBuffer = ""
    let barcodeTimeout: NodeJS.Timeout | null = null

    const handler = (e: globalThis.KeyboardEvent) => {
      if (modalCobroOpen) return

      if (e.key !== "Enter" && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        barcodeBuffer += e.key
        if (barcodeTimeout) clearTimeout(barcodeTimeout)
        barcodeTimeout = setTimeout(() => { barcodeBuffer = "" }, 50)
      }
      if (e.key === "Enter" && barcodeBuffer.length >= 4) {
        e.preventDefault()
        const scannedCode = barcodeBuffer
        barcodeBuffer = ""
        buscarYAgregarCodigo(scannedCode)
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
  }, [carrito, modalCobroOpen, posLayout.ux.keyboardShortcuts, buscarYAgregarCodigo, abrirCobro])

  useEffect(() => {
    let holdTimer: ReturnType<typeof setTimeout> | null = null
    const dispararPanico = async () => {
      try {
        const pos = await new Promise<GeolocationPosition | null>((resolve) => {
          if (!navigator.geolocation) return resolve(null)
          navigator.geolocation.getCurrentPosition(
            (p) => resolve(p),
            () => resolve(null),
            { timeout: 2500 },
          )
        })
        const res = await fetch("/api/pos/almacen/panico", {
          method: "POST",
          headers: { ...authH(), "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: pos?.coords.latitude,
            lng: pos?.coords.longitude,
          }),
        })
        if (res.ok) {
          toast({ title: "Alerta silenciosa enviada" })
        }
      } catch {
        /* silencioso */
      }
    }
    const onDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "F12") {
        holdTimer = setTimeout(() => void dispararPanico(), 3000)
      }
    }
    const onUp = (e: KeyboardEvent) => {
      if (e.key === "F12" && holdTimer) {
        clearTimeout(holdTimer)
        holdTimer = null
      }
    }
    window.addEventListener("keydown", onDown)
    window.addEventListener("keyup", onUp)
    return () => {
      if (holdTimer) clearTimeout(holdTimer)
      window.removeEventListener("keydown", onDown)
      window.removeEventListener("keyup", onUp)
    }
  }, [authH, toast])

  const abrirCobroFiado = () => {
    if (carrito.length === 0) return
    if (!fiadoActivo) {
      toast({
        variant: "destructive",
        title: "Libreta Fiado",
        description: "Activá Libreta Fiado en App Store → Almacén de Barrio",
      })
      return
    }
    if (!clienteId) {
      toast({ variant: "destructive", title: "Fiado", description: "Elegí el cliente del barrio en el carrito" })
      setCartSheetOpen(true)
      return
    }
    const c = clientes.find((x) => x.id === clienteId)
    if (!c?.fiadoHabilitado) {
      toast({
        variant: "destructive",
        title: "Cliente sin fiado",
        description: "Activá fiado en Clientes o dalo de alta en Libreta Fiado",
      })
      setCartSheetOpen(true)
      return
    }
    if (creditoDispPos != null && creditoDispPos < total) {
      toast({
        variant: "destructive",
        title: "Límite excedido",
        description: `Disponible: $${creditoDispPos.toLocaleString("es-AR")}`,
      })
      return
    }
    setTipoFactura("ticket")
    abrirCobro({ medio: "cuenta_corriente", monto: total })
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

  const validarVale = async (idx: number, numero: string) => {
    if (!numero.trim()) {
      setValeInfo((v) => {
        const next = { ...v }
        delete next[idx]
        return next
      })
      return
    }
    try {
      const res = await fetch("/api/vales/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authH() },
        body: JSON.stringify({ numero: numero.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setValeInfo((v) => {
          const next = { ...v }
          delete next[idx]
          return next
        })
        toast({ variant: "destructive", title: "Vale", description: data.error })
        return
      }
      setValeInfo((v) => ({
        ...v,
        [idx]: { saldo: data.saldoRestante, numero: data.numero },
      }))
      setPagos((ps) =>
        ps.map((p, i) =>
          i === idx ? { ...p, monto: Math.min(p.monto || data.saldoRestante, data.saldoRestante) } : p,
        ),
      )
    } catch {
      toast({ variant: "destructive", title: "Vale", description: "Error al validar" })
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Ejecutar venta
  // ──────────────────────────────────────────────────────────────
  const ejecutarVenta = async () => {
    if (faltaPagar > 0.01) {
      setError(`Falta cubrir $${faltaPagar.toFixed(2)} del total`)
      return
    }
    if (!cajaId) {
      setError(mensajeCajaBloqueada(cajaMotivo))
      return
    }
    if (afipBloqueaFiscal) {
      setError("Configurá el certificado AFIP o usá Ticket (sin CAE)")
      return
    }

    setProcesando(true)
    setError("")

    try {
      const itemsVenta = carritoActivo
      const body = {
        clienteId: clienteId ?? undefined,
        mesaId: indicesCobro ? undefined : (mesaId ?? undefined),
        tipoFactura,
        lineas: itemsVenta.map((i) => ({
          productoId: i.productoId,
          descripcion: i.descripcion,
          cantidad: i.cantidad,
          precioUnitario: i.precio,
          porcentajeIva: i.porcentajeIva,
          descuento: i.descuento,
        })),
        pagos,
        descuentoGlobal,
        propina: indicesCobro ? 0 : propina,
      }

      const res = await fetch("/api/pos/venta", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authH() },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        const extra =
          data.disponible != null
            ? ` (disponible: $${Number(data.disponible).toLocaleString("es-AR")})`
            : ""
        setError((data.error ?? "Error al procesar la venta") + extra)
        return
      }

      // Computar desglose IVA desde el carrito para mostrar en ticket con precisión decimal
      const ivaMap = new Map<number, { netoCents: number; ivaCents: number }>()
      for (const item of itemsVenta) {
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

      const esTicketVenta = tipoFactura === "ticket"
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
        esExportacion: data.esExportacion,
        modalidadAuth: data.modalidadAuth,
        pendienteCae: data.pendienteCae,
        esTicket: esTicketVenta,
        tipo: data.tipo,
        ivaDesglose,
        lineas: itemsVenta.map((i) => ({
          descripcion: i.descripcion,
          cantidad: i.cantidad,
          precio: i.precio,
        })),
        medioPago: pagos[0]?.medio,
        empresaNombre,
      })
      if (data.facturaId) void cargarTicketLegal(data.facturaId)
      setNumpadAbierto(false)
      localStorage.removeItem(POS_DRAFT_KEY)

      if (indicesCobro?.length) {
        setCarrito((prev) => prev.filter((_, idx) => !indicesCobro.includes(idx)))
        setIndicesCobro(null)
        setIndicesSeleccionados(new Set())
      } else {
        setPropina(0)
      }

      if (
        imprimirAuto &&
        data.facturaId &&
        (salidaComprobante === "impresora" || salidaComprobante === "ambos")
      ) {
        setTimeout(async () => {
          try {
            const res = await fetch("/api/impresion/imprimir-ticket", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...authH() },
              body: JSON.stringify({ facturaId: data.facturaId }),
            })
            if (res.ok) {
              toast({ title: "Ticket impreso", description: "Impresión automática" })
            }
          } catch { /* silent */ }
        }, 400)
      }
      if (pagos.some((p) => p.medio === "cuenta_corriente")) {
        toast({ title: "Fiado registrado", description: "Se notificó por email/WhatsApp si está configurado" })
        cargarClientes()
      }

      // Recargar productos y caja después de venta exitosa
      cargarProductos(busqueda)
      verificarCaja()

    } catch {
      setError("Error de conexión. Verificá la red e intentá de nuevo.")
    } finally {
      setProcesando(false)
    }
  }

  useEffect(() => {
    if (!mpQrRef || mpQrAprobado) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pos/mercadopago-qr?ref=${encodeURIComponent(mpQrRef)}`, {
          headers: authH(),
        })
        if (!res.ok) return
        const data = await res.json()
        if (data.aprobado) {
          setMpQrAprobado(true)
          setPagos((ps) => ps.map((p, i) => (i === 0 ? { ...p, medio: "qr", monto: data.monto ?? total } : p)))
          toast({ title: "Pago MP confirmado", description: "Podés confirmar el cobro" })
        }
      } catch { /* silent */ }
    }, 3000)
    return () => clearInterval(interval)
  }, [mpQrRef, mpQrAprobado, authH, total, toast])

  const cerrarYNuevaVenta = () => {
    setModalCobroOpen(false)
    setVentaExitosa(null)
    setTicketLegal(null)
    setNumpadAbierto(false)
    setIndicesCobro(null)
    setMpQrDataUrl(null)
    setMpQrRef(null)
    setMpQrAprobado(false)
    localStorage.removeItem(POS_DRAFT_KEY)
    vaciarCarrito()
    setClienteId(null)
    toast({ title: "Venta registrada", description: "Lista para la próxima venta" })
    setTimeout(() => searchRef.current?.focus(), 150)
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
  const deudaClientePos = clienteActivo
    ? Math.max(0, -(Number(clienteActivo.saldoCuentaCorriente ?? 0)))
    : 0
  const creditoDispPos =
    clienteActivo && Number(clienteActivo.limiteCredito ?? 0) > 0
      ? Math.max(0, Number(clienteActivo.limiteCredito) - deudaClientePos)
      : null
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
  const productosFiltrados = productosVisibles

  const fmt = (n: number) => n.toLocaleString("es-AR", { minimumFractionDigits: 2 })

  const clientesOrdenados = useMemo(() => ordenarClientesPos(clientes), [clientes])

  const alertasPos = useMemo(() => {
    const items: PosAlertItem[] = []
    if (cajaOk === false) {
      items.push({
        id: "caja",
        severity: "error",
        mensaje: mensajeCajaBloqueada(cajaMotivo),
        accion: cajaMotivo === "cerrada"
          ? { label: "Abrir caja", href: "/dashboard/caja" }
          : cajaMotivo === "auth"
            ? { label: "Iniciar sesión", href: "/login" }
            : undefined,
      })
    }
    if (afipBloqueaFiscal) {
      items.push({
        id: "afip",
        severity: "error",
        mensaje: "AFIP sin certificado — usá Ticket o configurá",
        accion: { label: "Config AFIP", href: "/dashboard/configuracion?seccion=afip" },
      })
    }
    if (requiereFce) {
      items.push({
        id: "fce",
        severity: "warning",
        mensaje: `Gran Empresa ≥ $${umbralMipyme.toLocaleString("es-AR")} → FCE MiPyME`,
        accion: { label: "Config FCE", href: "/dashboard/configuracion?seccion=fiscal" },
      })
    }
    if (tipoMismatch) {
      items.push({
        id: "tipo",
        severity: "info",
        mensaje: `Sugerido: Factura ${tipoSugerido}`,
        inline: (
          <button
            type="button"
            className="ml-1 underline text-primary text-[11px] shrink-0"
            onClick={() => {
              setTipoFactura(tipoSugerido)
              setTipoManual(false)
            }}
          >
            Aplicar
          </button>
        ),
      })
    }
    return items
  }, [cajaOk, cajaMotivo, afipBloqueaFiscal, requiereFce, tipoMismatch, tipoSugerido, umbralMipyme])

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
              className={`${posLayout.topbar.modeButtonClass} ${
                modo === key
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {posLayout.topbar.showModeText && <span>{label}</span>}
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
              {labelCajaBadge(cajaOk, cajaMotivo)}
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
          <Link href="/dashboard/almacen" className="shrink-0">
            <Button variant="outline" size="sm" className="h-8 sm:h-7 text-xs gap-1">
              <Store className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Almacén</span>
            </Button>
          </Link>
          <Link href="/dashboard/almacen/guia" className="shrink-0 hidden md:inline-flex">
            <Button variant="ghost" size="sm" className="h-8 sm:h-7 text-xs">
              Guía
            </Button>
          </Link>
          <PosSkuGateButton
            activo={envasesActivo}
            sku="pos.envases_gaseosas"
            label="Envases"
            icon={<Package className="h-3.5 w-3.5" />}
            onClick={() => envasesActivo && setEnvasesDialogOpen(true)}
          />
          {fiadoActivo && posLayout.topbar.showFiadoLink && (
            <Link href="/dashboard/fiado" className="shrink-0">
              <Button variant="outline" size="sm" className="h-8 sm:h-7 text-xs gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                Fiado
              </Button>
            </Link>
          )}
          <Link href="/dashboard/pos/cierre" className="shrink-0">
            <Button variant="outline" size="sm" className="h-8 sm:h-7 text-xs gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              {posLayout.topbar.showCierreLabel && <span>Cierre X/Z</span>}
            </Button>
          </Link>
        </div>
      </div>

      <PosAlertStrip alertas={alertasPos} />

      {/* ── BODY ────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══ PANEL IZQUIERDO: Productos ══════════════════════ */}
        <div className={`flex flex-col ${posLayout.carrito.productosPanelClass} border-r overflow-hidden`}>

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
                    clicProducto(productosFiltrados[0])
                    setBusqueda("")
                  }
                }}
                placeholder="Buscar producto o escanear…"
                className={`pl-9 ${posLayout.productos.searchInputClass}`}
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
            <PosBarcodeCamera onScan={buscarYAgregarCodigo} disabled={modalCobroOpen} />
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
            <div className={`grid gap-2 p-3 ${posLayout.productos.scrollPaddingClass} ${posLayout.productos.gridClass}`}>
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
                    onClick={() => clicProducto(p)}
                    disabled={p.stock <= 0 && !p.esPlato}
                    className={`
                      flex flex-col items-center justify-center rounded-xl border-2 transition-all
                      text-center p-2 gap-1 select-none
                      ${posLayout.productos.cardMinHeightClass}
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
                    {catalogoGrupos?.variantes.some((g) => g.variantes[0]?.id === p.id) && (
                      <Badge variant="secondary" className="text-[9px] h-4">Variantes</Badge>
                    )}
                    {catalogoGrupos?.productoIdsCombo.includes(p.id) && (
                      <Badge variant="outline" className="text-[9px] h-4">Combo</Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* ══ PANEL DERECHO: Carrito ═══════════════════════════ */}
        {modo !== "kiosko" && posLayout.carrito.showSidePanel && (
          <div className={posLayout.carrito.cartPanelClass}>

            {posLayout.carrito.showPendientesPanel && (
            <PosPendientesPanel
              cajaOk={cajaOk}
              cajaMotivo={cajaMotivo}
              onRecuperar={recuperarVenta}
              onSuspender={suspenderVenta}
              puedeSuspender={carrito.length > 0}
            />
            )}

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
                  {clientesOrdenados.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                      {c.fiadoHabilitado && <span className="text-primary ml-1 text-xs">· Fiado</span>}
                      {c.condicionIva && <span className="text-muted-foreground ml-1 text-xs">({c.condicionIva})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clienteActivo?.fiadoHabilitado && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Fiado activo
                  {creditoDispPos != null && (
                    <> · Disp. ${creditoDispPos.toLocaleString("es-AR")}</>
                  )}
                  {deudaClientePos > 0 && (
                    <span className="text-red-600"> · Debe ${deudaClientePos.toLocaleString("es-AR")}</span>
                  )}
                </p>
              )}
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
                      {modo === "mesa" && (
                        <input
                          type="checkbox"
                          className="h-4 w-4 shrink-0"
                          checked={indicesSeleccionados.has(idx)}
                          onChange={(e) => {
                            setIndicesSeleccionados((prev) => {
                              const next = new Set(prev)
                              if (e.target.checked) next.add(idx)
                              else next.delete(idx)
                              return next
                            })
                          }}
                        />
                      )}
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
              {propina > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Propina</span>
                  <span>${fmt(propina)}</span>
                </div>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between font-bold text-lg">
                <span>TOTAL</span>
                <span className="text-primary">${fmt(total)}</span>
              </div>
            </div>

            {/* Botones cobrar / fiar */}
            <div className="px-3 pb-3 shrink-0 space-y-2">
              {modo === "mesa" && indicesSeleccionados.size > 0 && (
                <Button
                  variant="secondary"
                  className="w-full h-10"
                  onClick={() =>
                    abrirCobro({ indices: [...indicesSeleccionados] })
                  }
                >
                  Cobrar selección ({indicesSeleccionados.size})
                </Button>
              )}
              {fiadoActivo &&
                clienteActivo?.fiadoHabilitado &&
                carrito.length > 0 &&
                (creditoDispPos == null || creditoDispPos >= total) && (
                  <Button
                    variant="outline"
                    className="w-full h-11 font-bold border-primary text-primary"
                    disabled={!cajaOk || afipBloqueaFiscal}
                    onClick={abrirCobroFiado}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    FIAR ${fmt(total)}
                  </Button>
                )}
              <Button
                className="w-full h-12 text-base font-bold tracking-wide"
                disabled={carrito.length === 0 || !cajaOk || afipBloqueaFiscal}
                onClick={() => abrirCobro()}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                COBRAR ${fmt(total)}
                <kbd className="ml-2 text-xs opacity-60 font-normal">F12</kbd>
              </Button>
              {!cajaOk && carrito.length > 0 && (
                <p className="text-xs text-destructive text-center mt-1">
                  {mensajeCajaBloqueada(cajaMotivo)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Barra inferior móvil / tablet */}
        {modo !== "kiosko" && posLayout.carrito.showBottomBar && (
          <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 px-2 py-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-[0_-6px_24px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-1.5 max-w-lg mx-auto">
              <button
                type="button"
                onClick={() => setCartSheetOpen(true)}
                className="flex items-center gap-2 min-h-[44px] px-2.5 rounded-xl border bg-card flex-1 touch-manipulation active:scale-[0.98]"
              >
                <ShoppingCart className="h-4 w-4 text-primary shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-none">
                    {carrito.length === 0 ? "Carrito" : `${carrito.reduce((s, i) => s + i.cantidad, 0)} ítems`}
                  </p>
                  <p className="font-bold text-sm leading-tight">${fmt(total)}</p>
                </div>
              </button>
              {fiadoActivo &&
                clienteActivo?.fiadoHabilitado &&
                carrito.length > 0 &&
                (creditoDispPos == null || creditoDispPos >= total) && (
                  <Button
                    variant="outline"
                    className="h-11 px-3 text-xs font-bold shrink-0 border-primary text-primary"
                    onClick={abrirCobroFiado}
                    disabled={!cajaOk || afipBloqueaFiscal}
                  >
                    FIAR
                  </Button>
                )}
              <Button
                className="h-11 px-4 text-sm font-bold shrink-0"
                onClick={() => abrirCobro()}
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
            <Button className="h-12 px-8 text-base font-bold touch-manipulation" onClick={() => abrirCobro()} disabled={!cajaOk || afipBloqueaFiscal}>
              COBRAR
            </Button>
            <Button variant="ghost" className="h-12 w-12 text-gray-400 touch-manipulation" onClick={vaciarCarrito}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {posLayout.carrito.showCartSheet && (
      <PosCartSheet
        open={cartSheetOpen}
        onOpenChange={setCartSheetOpen}
        sheetHeightClass={posLayout.cobro.sheetHeightClass}
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
        onCobrar={() => abrirCobro()}
        onFiar={abrirCobroFiado}
        cajaOk={cajaOk}
        cajaMotivo={cajaMotivo}
        afipBloqueaFiscal={afipBloqueaFiscal}
        fiadoActivo={fiadoActivo}
        creditoDisponible={creditoDispPos}
        deudaCliente={deudaClientePos}
      />
      )}

      {/* ═══ MODAL: Cobro ═══════════════════════════════════════ */}
      <Dialog open={modalCobroOpen} onOpenChange={(open) => { if (!procesando) setModalCobroOpen(open) }}>
        <DialogContent className={posLayout.cobro.dialogClass}>
          <DialogHeader className="shrink-0 pb-2">
            <DialogTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" />
              {ventaExitosa ? "Listo" : pagos[0]?.medio === "cuenta_corriente" ? "Fiado" : "Cobro"}
            </DialogTitle>
            {!ventaExitosa && (
              <DialogDescription className="text-sm">
                Total: <strong className="text-foreground">${fmt(total)}</strong>
                {clienteActivo && pagos[0]?.medio === "cuenta_corriente" && (
                  <span className="block text-xs mt-0.5">{clienteActivo.nombre}</span>
                )}
              </DialogDescription>
            )}
          </DialogHeader>

          {ventaExitosa ? (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto space-y-3 py-1 hide-on-print">
                <FiscalEmissionResult
                  data={{
                    success: !!ventaExitosa.cae && !ventaExitosa.pendienteCae,
                    numero: ventaExitosa.numeroCompleto,
                    tipo: ventaExitosa.tipo,
                    cae: ventaExitosa.cae,
                    vencimientoCAE: ventaExitosa.vencimientoCAE,
                    qrBase64: ventaExitosa.qrBase64,
                    error: ventaExitosa.afipError,
                    pendienteCae: ventaExitosa.pendienteCae,
                    esFce: ventaExitosa.esFce,
                    esExportacion: ventaExitosa.esExportacion,
                    esTicket: ventaExitosa.esTicket,
                    modalidadAuth: ventaExitosa.modalidadAuth,
                  } satisfies FiscalEmissionData}
                  title="Venta registrada"
                  className="border-0 shadow-none bg-transparent p-0"
                />
                {ventaExitosa.vuelto > 0.01 && (
                  <p className="text-sm font-bold text-yellow-700 text-center">
                    Vuelto: ${fmt(ventaExitosa.vuelto)}
                  </p>
                )}
                <FiscalOutputActions
                  facturaId={ventaExitosa.facturaId}
                  salidaPreferida={salidaComprobante}
                  onPrintFallback={() => window.print()}
                />
              </div>
              <div id="ticket-print" className="hidden print:block">
                {ticketLegal ? (
                  <FiscalTicketView data={ticketLegal} />
                ) : (
                  <PosTicketTermico
                    empresaNombre={ventaExitosa.empresaNombre ?? empresaNombre}
                    numeroComprobante={ventaExitosa.numeroCompleto}
                    lineas={ventaExitosa.lineas}
                    total={ventaExitosa.total}
                    medioPago={ventaExitosa.medioPago}
                    vuelto={ventaExitosa.vuelto}
                    cae={ventaExitosa.cae}
                    vencimientoCae={ventaExitosa.vencimientoCAE}
                    esTicket={ventaExitosa.esTicket}
                  />
                )}
              </div>
              <div className="shrink-0 flex gap-2 pt-2 border-t hide-on-print">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-11"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Vista previa
                </Button>
                <Button size="sm" className="flex-1 h-11 font-bold" onClick={cerrarYNuevaVenta}>
                  Nueva venta
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-1 min-h-0 gap-2">
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5">
                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                {promosHoy.length > 0 && (
                  <Alert className="py-2 border-emerald-500/40 bg-emerald-500/10">
                    <AlertDescription className="text-xs space-y-1">
                      {promosHoy.map((pr) => (
                        <p key={pr.id}>
                          <strong>Promo hoy:</strong> {pr.mensajeCajero}
                        </p>
                      ))}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-3 gap-1.5">
                  {MEDIOS_PAGO.filter((m) => m.key !== "vale" || valesActivo).map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => {
                        if (m.key === "vale" && !valesActivo) return
                        setPagos([{
                          medio: m.key,
                          monto: total,
                          ...(m.key === "vale" ? { numeroVale: "" } : {}),
                        }])
                        setNumpadInput(String(total))
                        setNumpadAbierto(m.key === "efectivo")
                      }}
                      disabled={m.key === "vale" && !valesActivo}
                      title={m.key === "vale" && !valesActivo ? "Activá Vale de dinero en App Store" : undefined}
                      className={`${posLayout.cobro.medioButtonClass} ${m.color} ${
                        pagos[0]?.medio === m.key ? "ring-2 ring-offset-1 ring-white/80" : ""
                      } ${m.key === "vale" && !valesActivo ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <m.icon className="h-4 w-4 mb-0.5" />
                      {m.label}
                    </button>
                  ))}
                </div>

                {fiadoActivo && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-9 text-xs border-primary text-primary"
                    onClick={abrirCobroFiado}
                  >
                    <BookOpen className="h-3.5 w-3.5 mr-1" />
                    Fiado — {clienteActivo?.nombre ?? "elegí cliente"}
                  </Button>
                )}

                {!indicesCobro && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs shrink-0">Propina</Label>
                    <div className="flex gap-1 flex-1">
                      {[0, 10, 15, 20].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          className={`flex-1 h-8 rounded text-xs font-medium ${
                            propina === Math.round(totalSinPropina * pct / 100) && pct > 0
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                          onClick={() =>
                            setPropina(pct === 0 ? 0 : Math.round(totalSinPropina * pct / 100))
                          }
                        >
                          {pct === 0 ? "Sin" : `${pct}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {pagos.some((p) => p.medio === "qr") && (
                  <div className="rounded-lg border p-2 space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs"
                      disabled={mpQrLoading}
                      onClick={() => void generarQrMercadoPago()}
                    >
                      {mpQrLoading ? "Generando..." : "Generar QR MercadoPago"}
                    </Button>
                    {mpQrDataUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mpQrDataUrl} alt="QR MercadoPago" className="mx-auto w-40 h-40" />
                    )}
                    {mpQrAprobado && (
                      <p className="text-xs text-green-600 text-center font-medium">Pago confirmado ✓</p>
                    )}
                  </div>
                )}

                {pagos.map((pago, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Select
                        value={pago.medio}
                        onValueChange={(v) =>
                          setPagos((ps) =>
                            ps.map((p, i) =>
                              i === idx
                                ? { ...p, medio: v, ...(v === "vale" ? { numeroVale: p.numeroVale ?? "" } : {}) }
                                : p,
                            ),
                          )
                        }
                      >
                        <SelectTrigger className="w-28 h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        {MEDIOS_PAGO.map((m) => (
                          <SelectItem
                            key={m.key}
                            value={m.key}
                            disabled={m.key === "vale" && !valesActivo}
                          >
                            {m.label}{m.key === "vale" && !valesActivo ? " (activar)" : ""}
                          </SelectItem>
                        ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        className={`flex-1 h-9 text-right font-bold text-sm ${numpadTarget === idx ? "ring-2 ring-primary" : ""}`}
                        value={numpadTarget === idx ? numpadInput : pago.monto.toFixed(2)}
                        onFocus={() => { setNumpadTarget(idx); setNumpadInput(String(pago.monto)) }}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          setPagos((ps) => ps.map((p, i) => i === idx ? { ...p, monto: val } : p))
                          setNumpadInput(e.target.value)
                        }}
                        ref={idx === 0 ? montoEfectivoRef : undefined}
                      />
                    </div>
                    {pago.medio === "vale" && (
                      <div className="flex items-center gap-1.5">
                        <Input
                          placeholder="VALE-000001"
                          className="h-8 text-xs font-mono flex-1"
                          value={pago.numeroVale ?? ""}
                          onChange={(e) =>
                            setPagos((ps) =>
                              ps.map((p, i) => (i === idx ? { ...p, numeroVale: e.target.value.toUpperCase() } : p)),
                            )
                          }
                          onBlur={() => void validarVale(idx, pago.numeroVale ?? "")}
                        />
                        {valeInfo[idx] && (
                          <span className="text-[10px] text-emerald-600 shrink-0">
                            ${valeInfo[idx].saldo.toLocaleString("es-AR")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="flex items-center justify-center gap-1 w-full text-xs text-muted-foreground py-1"
                  onClick={() => setNumpadAbierto((v) => !v)}
                >
                  Teclado {numpadAbierto ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {numpadAbierto && (
                  <div className="grid grid-cols-3 gap-1">
                    {NUMPAD_KEYS.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => numpadPress(k)}
                        className={posLayout.cobro.numpadKeyClass}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t pt-2 space-y-1.5 bg-background">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Recibe</span>
                  <span className="font-bold">${fmt(totalPagado)}</span>
                </div>
                {vuelto > 0.01 && (
                  <div className="flex justify-between text-xs text-green-600 font-bold">
                    <span>Vuelto</span><span>${fmt(vuelto)}</span>
                  </div>
                )}
                {faltaPagar > 0.01 && (
                  <div className="flex justify-between text-xs text-destructive font-bold">
                    <span>Falta</span><span>${fmt(faltaPagar)}</span>
                  </div>
                )}
                <Button
                  className={posLayout.cobro.confirmButtonClass}
                  disabled={faltaPagar > 0.01 || procesando || !cajaOk || afipBloqueaFiscal}
                  onClick={ejecutarVenta}
                >
                  {procesando ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  {procesando
                    ? "Procesando..."
                    : pagos[0]?.medio === "cuenta_corriente"
                      ? "Confirmar fiado"
                      : "Confirmar cobro"}
                </Button>
              </div>
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

      <PosVariantePicker
        grupo={grupoVariante}
        open={variantePickerOpen}
        onOpenChange={setVariantePickerOpen}
        onSelect={seleccionarVariante}
      />

      <PosEnvasesDialog
          open={envasesDialogOpen}
          onOpenChange={setEnvasesDialogOpen}
          clienteId={clienteId}
          clienteNombre={clienteActivo?.nombre}
          authHeaders={authH}
          onMovimiento={verificarCaja}
        />

      <BalanzaNumpad
        producto={balanzaProducto}
        open={balanzaOpen}
        onOpenChange={setBalanzaOpen}
        onConfirm={(result) => {
          agregarProducto(result.producto, {
            cantidad: result.cantidad,
            precio: result.precioUnitario,
            descripcion: result.descripcion,
            noMerge: true,
          })
          toast({
            title: "Agregado",
            description: result.descripcion,
            duration: 1500,
          })
        }}
      />
    </div>
  )
}
