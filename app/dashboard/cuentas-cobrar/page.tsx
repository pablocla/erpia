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

type CC = {
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
  factura?: { id: number; tipo: string; numero: number; puntoVenta: number }
  cliente?: { id: number; nombre: string; cuit: string | null }
}

type Resumen = {
  totalPendiente: number
  totalVencido: number
  aging: { corriente: number; bucket30: number; bucket60: number; bucket90: number; bucket90plus: number }
  cuentas: number
}

type Recibo = {
  id: number
  numero: string
  fecha: string
  montoTotal: number
  totalRetenciones: number
  netoRecibido: number
  medioPago: string
  cliente?: { id: number; nombre: string; cuit: string | null }
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: "Pendiente", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
  parcial: { label: "Cobro parcial", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
  vencida: { label: "Vencida", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
  pagada: { label: "Pagada", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
  incobrable: { label: "Incobrable", color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-950/30" },
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v)
}

function formatPV(pv: number, n: number) {
  return `${String(pv).padStart(4, "0")}-${String(n).padStart(8, "0")}`
}

export default function CuentasCobrarPage() {
  const [cuentas, setCuentas] = useState<CC[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [clienteFiltro, setClienteFiltro] = useState("todos")
  const [clientes, setClientes] = useState<{ id: number; nombre: string }[]>([])
  const [recibos, setRecibos] = useState<Recibo[]>([])
  const [loadingRecibos, setLoadingRecibos] = useState(false)

  // Modal cobro
  const [modalCobro, setModalCobro] = useState<CC | null>(null)
  const [montoCobro, setMontoCobro] = useState("")
  const [medioPago, setMedioPago] = useState("efectivo")
  const [obsCobro, setObsCobro] = useState("")
  const [cobrando, setCobrando] = useState(false)
  const [errorCobro, setErrorCobro] = useState("")

  const authHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado !== "todos") params.set("estado", filtroEstado)
      if (clienteFiltro !== "todos") params.set("clienteId", clienteFiltro)
      const res = await fetch(`/api/cuentas-cobrar?${params}`, { headers: authHeaders() })
      const data = await res.json()
      setCuentas(Array.isArray(data.data) ? data.data : [])
      setResumen(data.resumen ?? null)
    } finally {
      setLoading(false)
    }
  }, [filtroEstado, clienteFiltro, authHeaders])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useEffect(() => {
    fetch("/api/clientes?take=500", { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setClientes(Array.isArray(d.data) ? d.data : []))
      .catch(() => {})
  }, [authHeaders])

  const cargarRecibos = useCallback(async () => {
    setLoadingRecibos(true)
    try {
      const params = new URLSearchParams()
      if (clienteFiltro !== "todos") params.set("clienteId", clienteFiltro)
      const res = await fetch(`/api/recibos?${params}`, { headers: authHeaders() })
      const data = await res.json()
      setRecibos(Array.isArray(data.data) ? data.data : [])
    } finally {
      setLoadingRecibos(false)
    }
  }, [clienteFiltro, authHeaders])

  useEffect(() => {
    void cargarRecibos()
  }, [cargarRecibos])

  const cuentasFiltradas = cuentas.filter((c) => {
    const matchBusqueda =
      c.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.factura?.tipo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(c.factura?.numero).includes(busqueda)
    return matchBusqueda
  })

  const abrirCobro = (cc: CC) => {
    setModalCobro(cc)
    setMontoCobro(String(cc.saldo))
    setMedioPago("efectivo")
    setObsCobro("")
    setErrorCobro("")
  }

  const registrarCobro = async () => {
    if (!modalCobro) return
    setErrorCobro("")
    const monto = parseFloat(montoCobro)
    if (!monto || monto <= 0) { setErrorCobro("Monto inválido"); return }

    setCobrando(true)
    try {
      const res = await fetch("/api/cuentas-cobrar/cobros", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          cuentaCobrarId: modalCobro.id,
          monto,
          medioPago,
          observaciones: obsCobro.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErrorCobro(data.error || "Error al registrar cobro"); return }
      setModalCobro(null)
      await cargar()
    } finally {
      setCobrando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="dashboard-surface rounded-xl p-4 sm:p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Gestión financiera de cobranzas
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Cuentas a Cobrar</h1>
          <p className="text-muted-foreground text-sm mt-1">Saldos pendientes, aging y cobranza operativa</p>
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
            <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />Total pendiente</p>
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
          <CardHeader className="pb-3"><CardTitle className="text-base">Aging de cartera</CardTitle></CardHeader>
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
            <CardTitle className="text-base">Comprobantes pendientes</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-9 h-9 w-48 text-sm" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              </div>
              <Select value={clienteFiltro} onValueChange={setClienteFiltro}>
                <SelectTrigger className="h-9 w-52"><SelectValue placeholder="Cliente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los clientes</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
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
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-t">
                <tr>
                  <th className="text-left p-3 font-medium">Cliente</th>
                  <th className="text-left p-3 font-medium">Comprobante</th>
                  <th className="text-left p-3 font-medium">Emisión</th>
                  <th className="text-left p-3 font-medium">Vencimiento</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-right p-3 font-medium">Saldo</th>
                  <th className="text-left p-3 font-medium">Estado</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {cuentasFiltradas.map((c) => {
                  const conf = ESTADO_CONFIG[c.estado] ?? ESTADO_CONFIG.pendiente
                  return (
                    <tr key={c.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <p className="font-medium">{c.cliente?.nombre ?? "—"}</p>
                        {c.cliente?.cuit && <p className="text-xs text-muted-foreground">{c.cliente.cuit}</p>}
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {c.factura ? `FAC ${c.factura.tipo} ${formatPV(c.factura.puntoVenta, c.factura.numero)}` : `CC #${c.id}`}
                      </td>
                      <td className="p-3 text-muted-foreground">{new Date(c.fechaEmision).toLocaleDateString("es-AR")}</td>
                      <td className="p-3">
                        <div className={cn("text-xs font-medium px-1.5 py-0.5 rounded inline-block", conf.bg, conf.color)}>
                          {new Date(c.fechaVencimiento).toLocaleDateString("es-AR")}
                          {c.diasVencido > 0 && ` (${c.diasVencido}d)`}
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium">{formatCurrency(c.montoOriginal)}</td>
                      <td className="p-3 text-right font-bold text-primary">{formatCurrency(c.saldo)}</td>
                      <td className="p-3"><span className={cn("text-xs font-medium", conf.color)}>{conf.label}</span></td>
                      <td className="p-3">
                        {c.estado !== "pagada" && c.saldo > 0 && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => abrirCobro(c)}>Registrar cobro</Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {cuentasFiltradas.length === 0 && (
                  <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">{loading ? "Cargando..." : "No hay cuentas para mostrar."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recibos recientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-t">
                <tr>
                  <th className="text-left p-3 font-medium">Recibo</th>
                  <th className="text-left p-3 font-medium">Cliente</th>
                  <th className="text-left p-3 font-medium">Fecha</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-right p-3 font-medium">Retenciones</th>
                  <th className="text-right p-3 font-medium">Neto</th>
                  <th className="text-left p-3 font-medium">Medio</th>
                </tr>
              </thead>
              <tbody>
                {recibos.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono text-xs">{r.numero}</td>
                    <td className="p-3">
                      <p className="font-medium">{r.cliente?.nombre ?? "—"}</p>
                      {r.cliente?.cuit && <p className="text-xs text-muted-foreground">{r.cliente.cuit}</p>}
                    </td>
                    <td className="p-3 text-muted-foreground">{new Date(r.fecha).toLocaleDateString("es-AR")}</td>
                    <td className="p-3 text-right font-medium">{formatCurrency(r.montoTotal)}</td>
                    <td className="p-3 text-right text-amber-700">{formatCurrency(r.totalRetenciones)}</td>
                    <td className="p-3 text-right font-bold text-primary">{formatCurrency(r.netoRecibido)}</td>
                    <td className="p-3 text-xs text-muted-foreground">{r.medioPago}</td>
                  </tr>
                ))}
                {recibos.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">{loadingRecibos ? "Cargando..." : "No hay recibos para mostrar."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal cobro */}
      <Dialog open={!!modalCobro} onOpenChange={() => setModalCobro(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Cobro</DialogTitle></DialogHeader>
          {modalCobro && (
            <div className="space-y-3 py-2">
              {errorCobro && <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{errorCobro}</div>}
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p className="font-semibold">{modalCobro.cliente?.nombre}</p>
                <p className="text-muted-foreground">
                  {modalCobro.factura ? `FAC ${modalCobro.factura.tipo} ${formatPV(modalCobro.factura.puntoVenta, modalCobro.factura.numero)}` : `CC #${modalCobro.id}`}
                </p>
                <p>Saldo: <span className="font-bold text-primary">{formatCurrency(modalCobro.saldo)}</span></p>
              </div>
              <div className="space-y-1.5">
                <Label>Importe a cobrar</Label>
                <Input type="number" step="0.01" value={montoCobro} onChange={(e) => setMontoCobro(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Forma de pago</Label>
                <Select value={medioPago} onValueChange={setMedioPago}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Observaciones</Label>
                <Input placeholder="Referencia transferencia, N° cheque..." value={obsCobro} onChange={(e) => setObsCobro(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCobro(null)}>Cancelar</Button>
            <Button onClick={registrarCobro} disabled={cobrando}>{cobrando ? "Procesando..." : "Confirmar Cobro"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
