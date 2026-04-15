"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"

type CP = {
  id: number
  numeroCuota: number
  montoOriginal: number
  montoPagado: number
  saldo: number
  fechaEmision: string
  fechaVencimiento: string
  estado: string
  observaciones: string | null
  diasVencido: number
  compra?: { id: number; tipo: string; numero: string; puntoVenta: string }
  proveedor?: { id: number; nombre: string; cuit: string | null }
}

type Resumen = {
  totalPendiente: number
  totalVencido: number
  aging: { corriente: number; bucket30: number; bucket60: number; bucket90: number; bucket90plus: number }
  cuentas: number
}

type OrdenPago = {
  id: number
  numero: string
  fecha: string
  montoTotal: number
  totalRetenciones: number
  netoPagado: number
  medioPago: string
  proveedor?: { id: number; nombre: string; cuit: string | null }
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: "Pendiente", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
  parcial: { label: "Pago parcial", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
  vencida: { label: "Vencida", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
  pagada: { label: "Pagada", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v)
}

function formatPV(pv: string, n: string) {
  return `${pv.padStart(4, "0")}-${n.padStart(8, "0")}`
}

export default function CuentasPagarPage() {
  const [cuentas, setCuentas] = useState<CP[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [proveedorFiltro, setProveedorFiltro] = useState("todos")
  const [proveedores, setProveedores] = useState<{ id: number; nombre: string }[]>([])
  const [ordenesPago, setOrdenesPago] = useState<OrdenPago[]>([])
  const [loadingOrdenes, setLoadingOrdenes] = useState(false)

  // Modal pago
  const [modalPago, setModalPago] = useState<CP | null>(null)
  const [montoPago, setMontoPago] = useState("")
  const [medioPago, setMedioPago] = useState("transferencia")
  const [obsPago, setObsPago] = useState("")
  const [pagando, setPagando] = useState(false)
  const [errorPago, setErrorPago] = useState("")

  const authHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado !== "todos") params.set("estado", filtroEstado)
      if (proveedorFiltro !== "todos") params.set("proveedorId", proveedorFiltro)
      const res = await fetch(`/api/cuentas-pagar?${params}`, { headers: authHeaders() })
      const data = await res.json()
      setCuentas(Array.isArray(data.data) ? data.data : [])
      setResumen(data.resumen ?? null)
    } finally {
      setLoading(false)
    }
  }, [filtroEstado, proveedorFiltro, authHeaders])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: cargar,
  }))

  useEffect(() => {
    fetch("/api/proveedores", { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setProveedores(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [authHeaders])

  const cargarOrdenesPago = useCallback(async () => {
    setLoadingOrdenes(true)
    try {
      const params = new URLSearchParams()
      if (proveedorFiltro !== "todos") params.set("proveedorId", proveedorFiltro)
      const res = await fetch(`/api/ordenes-pago?${params}`, { headers: authHeaders() })
      const data = await res.json()
      setOrdenesPago(Array.isArray(data.data) ? data.data : [])
    } finally {
      setLoadingOrdenes(false)
    }
  }, [proveedorFiltro, authHeaders])

  useEffect(() => {
    void cargarOrdenesPago()
  }, [cargarOrdenesPago])

  const cuentasFiltradas = cuentas.filter((c) => {
    return (
      c.proveedor?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.compra?.tipo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(c.compra?.numero).includes(busqueda)
    )
  })

  const abrirPago = (cp: CP) => {
    setModalPago(cp)
    setMontoPago(String(cp.saldo))
    setMedioPago("transferencia")
    setObsPago("")
    setErrorPago("")
  }

  const registrarPago = async () => {
    if (!modalPago) return
    setErrorPago("")
    const monto = parseFloat(montoPago)
    if (!monto || monto <= 0) { setErrorPago("Monto inválido"); return }

    setPagando(true)
    try {
      const res = await fetch("/api/cuentas-pagar/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          cuentaPagarId: modalPago.id,
          monto,
          medioPago,
          observaciones: obsPago.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErrorPago(data.error || "Error al registrar pago"); return }
      setModalPago(null)
      await cargar()
    } finally {
      setPagando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="dashboard-surface rounded-xl p-4 sm:p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Gestión de obligaciones con proveedores
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Cuentas a Pagar</h1>
          <p className="text-muted-foreground text-sm mt-1">Saldos pendientes, aging y pagos operativos</p>
        </div>
        <Button variant="outline" onClick={cargar} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />Total a pagar</p>
            <p className="text-2xl font-bold">{formatCurrency(resumen?.totalPendiente ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">{resumen?.cuentas ?? 0} cuentas activas</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-red-500" />Total vencido</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(resumen?.totalVencido ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Requiere acción inmediata</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />Corriente</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(resumen?.aging?.corriente ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Al día / no vencido</p>
          </CardContent>
        </Card>
      </div>

      {/* Aging buckets */}
      {resumen?.aging && (resumen.aging.bucket30 > 0 || resumen.aging.bucket60 > 0 || resumen.aging.bucket90 > 0 || resumen.aging.bucket90plus > 0) && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Aging de obligaciones</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">1-30 días</p>
                <p className="text-lg font-bold text-amber-600">{formatCurrency(resumen.aging.bucket30)}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">31-60 días</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(resumen.aging.bucket60)}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">61-90 días</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(resumen.aging.bucket90)}</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 text-center">
                <p className="text-xs text-red-700/80">+90 días</p>
                <p className="text-lg font-bold text-red-700">{formatCurrency(resumen.aging.bucket90plus)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CaSelect value={proveedorFiltro} onValueChange={setProveedorFiltro}>
                <SelectTrigger className="h-9 w-52"><SelectValue placeholder="Proveedor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los proveedores</SelectItem>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="h-9 w-40"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                  <SelectItem value="parcial">Parciales</SelectItem>
                  <SelectItem value="vencida">Vencidas</SelectItem>
                  <SelectItem value="pagada">Pagadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <DataTable<CP>
            data={cuentasFiltradas}
            columns={[
              { key: "proveedor" as any, header: "Proveedor", cell: (c) => (<div><p className="font-medium">{c.proveedor?.nombre ?? "—"}</p>{c.proveedor?.cuit && <p className="text-xs text-muted-foreground">{c.proveedor.cuit}</p>}</div>), exportFn: (c) => c.proveedor?.nombre ?? "" },
              { key: "compra" as any, header: "Comprobante", cell: (c) => <span className="font-mono text-xs">{c.compra ? `FAC ${c.compra.tipo} ${formatPV(c.compra.puntoVenta, c.compra.numero)}` : `CP #${c.id}`}</span> },
              { key: "fechaEmision", header: "Emisión", sortable: true, cell: (c) => <span className="text-muted-foreground">{new Date(c.fechaEmision).toLocaleDateString("es-AR")}</span> },
              { key: "fechaVencimiento", header: "Vencimiento", sortable: true, cell: (c) => { const conf = ESTADO_CONFIG[c.estado] ?? ESTADO_CONFIG.pendiente; return <div className={cn("text-xs font-medium px-1.5 py-0.5 rounded inline-block", conf.bg, conf.color)}>{new Date(c.fechaVencimiento).toLocaleDateString("es-AR")}{c.diasVencido > 0 && ` (${c.diasVencido}d)`}</div> } },
              { key: "montoOriginal", header: "Total", align: "right", sortable: true, cell: (c) => <span className="font-medium">{formatCurrency(c.montoOriginal)}</span> },
              { key: "saldo", header: "Saldo", align: "right", sortable: true, cell: (c) => <span className="font-bold text-primary">{formatCurrency(c.saldo)}</span> },
              { key: "estado", header: "Estado", cell: (c) => { const conf = ESTADO_CONFIG[c.estado] ?? ESTADO_CONFIG.pendiente; return <span className={cn("text-xs font-medium", conf.color)}>{conf.label}</span> } },
              { key: "acciones" as any, header: "", cell: (c) => c.estado !== "pagada" && c.saldo > 0 ? <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); abrirPago(c) }}>Registrar pago</Button> : null },
            ] as DataTableColumn<CP>[]}
            rowKey="id"
            searchPlaceholder="Buscar cuenta..."
            searchKeys={["id"]}
            selectable
            exportFilename="cuentas-pagar"
            loading={loading}
            emptyMessage="No hay cuentas para mostrar"
            emptyIcon={<EmptyStateIllustration type="generico" compact title="Sin cuentas a pagar" description="Las cuentas se generan al registrar facturas de proveedores." />}
            defaultPageSize={25}
            compact
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Órdenes de pago recientes</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DataTable<OrdenPago>
            data={ordenesPago}
            columns={[
              { key: "numero", header: "Orden", sortable: true, cell: (op) => <span className="font-mono text-xs">{op.numero}</span> },
              { key: "proveedor" as any, header: "Proveedor", cell: (op) => (<div><p className="font-medium">{op.proveedor?.nombre ?? "—"}</p>{op.proveedor?.cuit && <p className="text-xs text-muted-foreground">{op.proveedor.cuit}</p>}</div>), exportFn: (op) => op.proveedor?.nombre ?? "" },
              { key: "fecha", header: "Fecha", sortable: true, cell: (op) => <span className="text-muted-foreground">{new Date(op.fecha).toLocaleDateString("es-AR")}</span> },
              { key: "montoTotal", header: "Total", align: "right", sortable: true, cell: (op) => <span className="font-medium">{formatCurrency(op.montoTotal)}</span> },
              { key: "totalRetenciones", header: "Retenciones", align: "right", cell: (op) => <span className="text-amber-700">{formatCurrency(op.totalRetenciones)}</span> },
              { key: "netoPagado", header: "Neto", align: "right", cell: (op) => <span className="font-bold text-primary">{formatCurrency(op.netoPagado)}</span> },
              { key: "medioPago", header: "Medio", cell: (op) => <span className="text-xs text-muted-foreground">{op.medioPago}</span> },
            ] as DataTableColumn<OrdenPago>[]}
            rowKey="id"
            searchPlaceholder="Buscar orden..."
            searchKeys={["numero"]}
            exportFilename="ordenes-pago"
            loading={loadingOrdenes}
            emptyMessage="No hay órdenes de pago"
            defaultPageSize={10}
            compact
          /logFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
