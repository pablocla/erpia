"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  RefreshCw,
  Sparkles,
  MessageCircle,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { parseApiList } from "@/lib/api/parse-list-response"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { PageShell, PageHeader, StatusBadge } from "@/components/layout"
import { PageSkeleton } from "@/components/layout/page-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { AppExperienceHeader } from "@/components/app-experience/app-experience-header"
import { getCobraExperience } from "@/lib/comercial/app-experience"
import { isCobraProductShell } from "@/lib/comercial/product-shell"
import { useDashboardShell } from "@/hooks/use-dashboard-shell"
import { useToast } from "@/hooks/use-toast"
import { buildWaMeUrl, messageCobroCliente } from "@/lib/comercial/whatsapp-copy"
import { formatCuit, getWhatsAppShareUrl } from "@/lib/utils/formatters-ar"

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
  cliente?: { id: number; nombre: string; cuit: string | null; telefono?: string | null }
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

type RetencionesPreview = {
  retencionIVA: number
  retencionGanancias: number
  retencionIIBB: number
  total: number
  detalle: { tipo: string; codigoRegimen: string; base: number; alicuota: number; monto: number }[]
  aplicadas: boolean
}

const ESTADO_VARIANT: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
  pendiente: "info",
  parcial: "warning",
  vencida: "error",
  pagada: "success",
  incobrable: "neutral",
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  parcial: "Cobro parcial",
  vencida: "Vencida",
  pagada: "Pagada",
  incobrable: "Incobrable",
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v)
}

function formatPV(pv: number, n: number) {
  return `${String(pv).padStart(4, "0")}-${String(n).padStart(8, "0")}`
}

export default function CuentasCobrarPage() {
  const { modoLite, productosSku } = useDashboardShell()
  const isCobra = isCobraProductShell(modoLite, productosSku)
  const cobraGuide = getCobraExperience()
  const { toast } = useToast()

  const [cuentas, setCuentas] = useState<CC[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [clienteFiltro, setClienteFiltro] = useState("todos")
  const [clientes, setClientes] = useState<{ id: number; nombre: string }[]>([])
  const [recibos, setRecibos] = useState<Recibo[]>([])
  const [loadingRecibos, setLoadingRecibos] = useState(false)
  const [configCobraOpen, setConfigCobraOpen] = useState(false)
  const [cobraResumen, setCobraResumen] = useState<{
    contactablesWhatsApp?: number
    cuentasVencidas?: number
    saldoTotal?: number
  } | null>(null)
  const [activandoCobra, setActivandoCobra] = useState(false)

  // Modal cobro
  const [modalCobro, setModalCobro] = useState<CC[]>([])
  const [montoCobro, setMontoCobro] = useState("")
  const [medioPago, setMedioPago] = useState("efectivo")
  const [obsCobro, setObsCobro] = useState("")
  const [chequeNumero, setChequeNumero] = useState("")
  const [chequeBanco, setChequeBanco] = useState("")
  const [chequeCuit, setChequeCuit] = useState("")
  const [chequeEmision, setChequeEmision] = useState(new Date().toISOString().split("T")[0])
  const [chequeVencimiento, setChequeVencimiento] = useState("")
  const [cobrando, setCobrando] = useState(false)
  const [errorCobro, setErrorCobro] = useState("")
  const [calcularRetencionesAuto, setCalcularRetencionesAuto] = useState(true)
  const [previewRetenciones, setPreviewRetenciones] = useState<RetencionesPreview | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [dividirPago, setDividirPago] = useState(false)
  const [segundoMedio, setSegundoMedio] = useState("efectivo")
  const [montoSegundoMedio, setMontoSegundoMedio] = useState("")

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
      setCuentas(parseApiList(data))
      setResumen(data.resumen ?? null)
    } finally {
      setLoading(false)
    }
  }, [filtroEstado, clienteFiltro, authHeaders])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: cargar,
  }))

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
      setRecibos(parseApiList(data))
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

  const netoEstimado = useMemo(() => {
    const monto = parseFloat(montoCobro) || 0
    const ret = previewRetenciones?.total ?? 0
    return Math.max(0, monto - ret)
  }, [montoCobro, previewRetenciones])

  const abrirCobro = (ccs: CC[]) => {
    setModalCobro(ccs)
    const totalSaldo = ccs.reduce((acc, cc) => acc + cc.saldo, 0)
    setMontoCobro(String(totalSaldo))
    setMedioPago("efectivo")
    setObsCobro("")
    setChequeNumero("")
    setChequeBanco("")
    setChequeCuit("")
    setChequeEmision(new Date().toISOString().split("T")[0])
    setChequeVencimiento("")
    setErrorCobro("")
    setCalcularRetencionesAuto(true)
    setPreviewRetenciones(null)
    setDividirPago(false)
    setSegundoMedio("efectivo")
    setMontoSegundoMedio("")
  }

  useEffect(() => {
    if (modalCobro.length === 0) return
    const monto = parseFloat(montoCobro)
    const clienteId = modalCobro[0].cliente?.id
    if (!monto || monto <= 0 || !clienteId) {
      setPreviewRetenciones(null)
      return
    }

    const timer = setTimeout(async () => {
      setLoadingPreview(true)
      try {
        const res = await fetch("/api/impuestos/retenciones/calcular", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ tipo: "cobro", clienteId, montoBase: monto }),
        })
        if (res.ok) setPreviewRetenciones(await res.json())
        else setPreviewRetenciones(null)
      } catch {
        setPreviewRetenciones(null)
      } finally {
        setLoadingPreview(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [montoCobro, modalCobro, authHeaders])

  const copiarLinkPago = async (cc: CC) => {
    const ref = cc.factura
      ? `Factura ${cc.factura.tipo} ${formatPV(cc.factura.puntoVenta, cc.factura.numero)}`
      : `cuenta #${cc.id}`
    const texto = messageCobroCliente({
      nombre: cc.cliente?.nombre,
      saldo: cc.saldo,
      referencia: ref,
    })
    const wa = buildWaMeUrl(cc.cliente?.telefono, texto)
    try {
      await navigator.clipboard.writeText(texto)
      if (wa) {
        window.open(wa, "_blank", "noopener,noreferrer")
        toast({
          title: "WhatsApp abierto",
          description: "Mensaje copiado y chat listo. Revisá y enviá.",
        })
      } else {
        toast({
          title: "Mensaje copiado",
          description: "El cliente no tiene teléfono válido. Pegalo en WhatsApp a mano.",
        })
      }
    } catch {
      toast({
        title: "No se pudo copiar",
        description: texto,
        variant: "destructive",
      })
    }
  }

  const filtrarVencidas = () => {
    setFiltroEstado("vencida")
    document.getElementById("tabla-cxc")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const cargarCobraResumen = useCallback(async () => {
    if (!isCobra) return
    try {
      const res = await fetch("/api/cobranza-aas", { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setCobraResumen(data.pendientes ?? data)
    } catch {
      /* optional */
    }
  }, [isCobra, authHeaders])

  useEffect(() => {
    void cargarCobraResumen()
  }, [cargarCobraResumen])

  const activarCobraWa = async () => {
    setActivandoCobra(true)
    try {
      const res = await fetch("/api/cobranza-aas", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ action: "activar", autoAprobarWa: false }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "No se pudo activar")
      toast({
        title: "Claver Cobrá listo",
        description: "Recordatorios WA configurados. Revisá vencidos y copiá mensajes.",
      })
      await cargarCobraResumen()
      setConfigCobraOpen(false)
    } catch (e) {
      toast({
        title: "No se pudo activar Cobrá",
        description: e instanceof Error ? e.message : "Reintentá",
        variant: "destructive",
      })
    } finally {
      setActivandoCobra(false)
    }
  }

  const registrarCobro = async () => {
    if (modalCobro.length === 0) return
    setErrorCobro("")
    const monto = parseFloat(montoCobro)
    if (!monto || monto <= 0) { setErrorCobro("Monto inválido"); return }
    if (medioPago === "cheque") {
      if (!chequeNumero.trim()) { setErrorCobro("Ingresá el número de cheque"); return }
      if (!chequeVencimiento) { setErrorCobro("Ingresá la fecha de vencimiento"); return }
    }

    setCobrando(true)
    try {
      const items = modalCobro.map((cc) => ({
        cuentaCobrarId: cc.id,
        monto: modalCobro.length === 1 ? monto : cc.saldo, 
      }))

      const retTotal = calcularRetencionesAuto ? (previewRetenciones?.total ?? 0) : 0
      const neto = Math.max(0, monto - retTotal)

      const payload: Record<string, unknown> = {
        clienteId: modalCobro[0].cliente?.id,
        items,
        calcularRetencionesAuto,
        observaciones: obsCobro.trim() || undefined,
      }

      if (dividirPago) {
        const monto2 = parseFloat(montoSegundoMedio) || 0
        const monto1 = neto - monto2
        if (monto2 <= 0 || monto1 <= 0) {
          setErrorCobro("Los montos del split deben ser positivos y sumar el neto")
          return
        }
        if (Math.abs(monto1 + monto2 - neto) > 0.02) {
          setErrorCobro(`La suma de medios (${formatCurrency(monto1 + monto2)}) debe igualar el neto (${formatCurrency(neto)})`)
          return
        }
        payload.medios = [
          { tipo: medioPago, monto: monto1 },
          { tipo: segundoMedio, monto: monto2 },
        ]
        const usaCheque = medioPago === "cheque" || segundoMedio === "cheque"
        if (usaCheque && medioPago === "cheque") {
          payload.cheque = {
            numero: chequeNumero.trim(),
            bancoNombre: chequeBanco.trim() || undefined,
            cuitBancoLibrador: chequeCuit.trim() || undefined,
            fechaEmision: chequeEmision,
            fechaVencimiento: chequeVencimiento,
            monto: monto1,
          }
        }
      } else {
        payload.medioPago = medioPago
        if (medioPago === "cheque") {
          payload.cheque = {
            numero: chequeNumero.trim(),
            bancoNombre: chequeBanco.trim() || undefined,
            cuitBancoLibrador: chequeCuit.trim() || undefined,
            fechaEmision: chequeEmision,
            fechaVencimiento: chequeVencimiento,
            monto: neto,
          }
        }
      }

      const res = await fetch("/api/cuentas-cobrar/cobros", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setErrorCobro(data.error || "Error al registrar cobro"); return }
      setModalCobro([])
      await Promise.all([cargar(), cargarRecibos()])
    } finally {
      setCobrando(false)
    }
  }

  if (loading && cuentas.length === 0) {
    return <PageSkeleton kpis={3} tableRows={8} tableCols={6} />
  }

  const hasFilters = filtroEstado !== "todos" || clienteFiltro !== "todos"

  return (
    <PageShell>
      {isCobra && (
        <AppExperienceHeader
          guide={cobraGuide}
          onPrimaryClick={filtrarVencidas}
        />
      )}

      <PageHeader
        variant="surface"
        title={isCobra ? "Cobros y morosos" : "Plata que te deben"}
        description={
          isCobra
            ? "Panel de deuda recuperable: filtrá vencidos, cobrá y copiá el WhatsApp con un toque."
            : "Cobros pendientes y fiados de clientes. Envia recordatorios por WhatsApp y cobrá en 1 clic."
        }
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {isCobra ? "Claver Cobrá" : "Cobranzas"}
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {isCobra && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={filtrarVencidas}
                  className="min-h-[40px]"
                  id="filtro-vencidas"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Solo vencidas
                </Button>
                <Dialog open={configCobraOpen} onOpenChange={setConfigCobraOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="min-h-[40px]" id="config-cobra">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar Cobrá
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Claver Cobrá</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                      <p className="text-muted-foreground">
                        Activá el motor de recordatorios. Después usá “Link / WhatsApp” en cada cuenta
                        para copiar el mensaje al cliente.
                      </p>
                      {cobraResumen && (
                        <ul className="rounded-lg border bg-muted/40 p-3 space-y-1 text-xs">
                          <li>
                            Cuentas vencidas (7+ días):{" "}
                            <strong>{cobraResumen.cuentasVencidas ?? "—"}</strong>
                          </li>
                          <li>
                            Contactables WA:{" "}
                            <strong>{cobraResumen.contactablesWhatsApp ?? "—"}</strong>
                          </li>
                          <li>
                            Saldo recuperable:{" "}
                            <strong>
                              {formatCurrency(Number(cobraResumen.saldoTotal ?? 0))}
                            </strong>
                          </li>
                        </ul>
                      )}
                      <Button
                        className="w-full min-h-[40px]"
                        onClick={() => void activarCobraWa()}
                        disabled={activandoCobra}
                      >
                        {activandoCobra ? "Activando…" : "Activar recordatorios Cobrá"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
            <Button variant="outline" onClick={cargar} disabled={loading} className="min-h-[40px]">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />Total pendiente</p>
            <p className="text-2xl font-bold">{formatCurrency(resumen?.totalPendiente ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">{resumen?.cuentas ?? 0} cuentas activas</p>
          </CardContent>
        </Card>
        <Card className="border-[var(--status-error-border)] bg-[var(--status-error-muted)]">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-[var(--status-error)]" />
              Total vencido
            </p>
            <p className="text-2xl font-bold text-[var(--status-error-foreground)]">
              {formatCurrency(resumen?.totalVencido ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Requiere acción</p>
          </CardContent>
        </Card>
        <Card className="border-[var(--status-success-border)] bg-[var(--status-success-muted)]">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-[var(--status-success)]" />
              Corriente
            </p>
            <p className="text-2xl font-bold text-[var(--status-success-foreground)]">
              {formatCurrency(resumen?.aging?.corriente ?? 0)}
            </p>
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
      <Card id="tabla-cxc">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {isCobra ? "Cuentas a recuperar" : "Comprobantes pendientes"}
            </CardTitle>
            <div className="flex gap-2">
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
        <CardContent className="pt-0">
          <DataTable<CC>
            data={cuentasFiltradas}
            columns={[
              { key: "cliente" as any, header: "Cliente", cell: (c) => (<div><p className="font-medium">{c.cliente?.nombre ?? "—"}</p>{c.cliente?.cuit && <p className="text-xs text-muted-foreground">{c.cliente.cuit}</p>}</div>), exportFn: (c) => c.cliente?.nombre ?? "" },
              { key: "factura" as any, header: "Comprobante", cell: (c) => <span className="font-mono text-xs">{c.factura ? `FAC ${c.factura.tipo} ${formatPV(c.factura.puntoVenta, c.factura.numero)}` : `CC #${c.id}`}</span> },
              { key: "fechaEmision", header: "Emisión", sortable: true, cell: (c) => <span className="text-muted-foreground">{new Date(c.fechaEmision).toLocaleDateString("es-AR")}</span> },
              {
                key: "fechaVencimiento",
                header: "Vencimiento",
                sortable: true,
                cell: (c) => (
                  <span className={cn("text-xs font-medium", c.diasVencido > 0 && "text-[var(--status-error-foreground)]")}>
                    {new Date(c.fechaVencimiento).toLocaleDateString("es-AR")}
                    {c.diasVencido > 0 && ` (${c.diasVencido}d)`}
                  </span>
                ),
              },
              { key: "montoOriginal", header: "Total", align: "right", sortable: true, cell: (c) => <span className="font-medium">{formatCurrency(c.montoOriginal)}</span> },
              { key: "saldo", header: "Saldo", align: "right", sortable: true, cell: (c) => <span className="font-bold text-primary">{formatCurrency(c.saldo)}</span> },
              {
                key: "estado",
                header: "Estado",
                cell: (c) => (
                  <StatusBadge
                    variant={ESTADO_VARIANT[c.estado] ?? "neutral"}
                    label={ESTADO_LABEL[c.estado] ?? c.estado}
                  />
                ),
              },
              {
                key: "acciones" as any,
                header: "",
                cell: (c) =>
                  c.estado !== "pagada" && c.saldo > 0 ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs min-h-[36px]"
                        onClick={(e) => {
                          e.stopPropagation()
                          abrirCobro([c])
                        }}
                      >
                        Cobrar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs min-h-[36px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium"
                        onClick={(e) => {
                          e.stopPropagation()
                          void copiarLinkPago(c)
                        }}
                      >
                        <MessageCircle className="h-3.5 w-3.5 mr-1 fill-emerald-600/20" />
                        {isCobra ? "WhatsApp" : "Cobrar por WA"}
                      </Button>
                    </div>
                  ) : null,
              },
            ] as DataTableColumn<CC>[]}
            rowKey="id"
            searchPlaceholder="Buscar cuenta..."
            searchKeys={["id"]}
            selectable
            bulkActions={(selected, clearSelection) => {
              const allSameClient = selected.every((s) => s.cliente?.id === selected[0].cliente?.id)
              const total = selected.reduce((sum, s) => sum + s.saldo, 0)
              return (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-muted-foreground">{selected.length} seleccionadas</span>
                  {!allSameClient ? (
                    <span className="text-sm text-[var(--status-error-foreground)] font-medium">
                      Debe ser el mismo cliente
                    </span>
                  ) : (
                    <>
                      <Button size="sm" onClick={() => abrirCobro(selected)}>
                        Cobrar seleccionadas ({formatCurrency(total)})
                      </Button>
                      {isCobra && selected.length === 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void copiarLinkPago(selected[0])}
                        >
                          <MessageCircle className="h-3.5 w-3.5 mr-1" />
                          WhatsApp
                        </Button>
                      )}
                    </>
                  )}
                  <Button size="sm" variant="ghost" onClick={clearSelection}>
                    Cancelar
                  </Button>
                </div>
              )
            }}
            exportFilename="cuentas-cobrar"
            loading={loading}
            emptyMessage="No hay cuentas para mostrar"
            emptyState={
              <EmptyState
                icon={isCobra ? MessageCircle : DollarSign}
                title={
                  hasFilters
                    ? "Ninguna cuenta coincide"
                    : isCobra
                      ? "Todavía no hay deuda para recuperar"
                      : "Sin cuentas a cobrar"
                }
                description={
                  hasFilters
                    ? "Cambiá el filtro de estado o cliente para ver más resultados."
                    : isCobra
                      ? "Cuando emitas facturas a crédito o cargues saldos, vas a filtrar vencidos y avisar por WhatsApp desde acá."
                      : "Las cuentas se generan al emitir facturas a crédito. Cuando haya saldos, cobrás desde acá o con link de pago."
                }
                actionLabel={
                  hasFilters ? "Ver todas" : isCobra ? "Ver clientes" : "Actualizar"
                }
                onAction={
                  hasFilters
                    ? () => {
                        setFiltroEstado("todos")
                        setClienteFiltro("todos")
                      }
                    : isCobra
                      ? () => {
                          window.location.href = "/dashboard/clientes"
                        }
                      : () => void cargar()
                }
                secondaryActionLabel={hasFilters && isCobra ? "Solo vencidas" : undefined}
                onSecondaryAction={hasFilters && isCobra ? filtrarVencidas : undefined}
              />
            }
            defaultPageSize={25}
            compact
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recibos recientes</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DataTable<Recibo>
            data={recibos}
            columns={[
              { key: "numero", header: "Recibo", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.numero}</span> },
              { key: "cliente" as any, header: "Cliente", cell: (r) => (<div><p className="font-medium">{r.cliente?.nombre ?? "—"}</p>{r.cliente?.cuit && <p className="text-xs text-muted-foreground">{r.cliente.cuit}</p>}</div>), exportFn: (r) => r.cliente?.nombre ?? "" },
              { key: "fecha", header: "Fecha", sortable: true, cell: (r) => <span className="text-muted-foreground">{new Date(r.fecha).toLocaleDateString("es-AR")}</span> },
              { key: "montoTotal", header: "Total", align: "right", sortable: true, cell: (r) => <span className="font-medium">{formatCurrency(r.montoTotal)}</span> },
              { key: "totalRetenciones", header: "Retenciones", align: "right", cell: (r) => <span className="text-amber-700">{formatCurrency(r.totalRetenciones)}</span> },
              { key: "netoRecibido", header: "Neto", align: "right", cell: (r) => <span className="font-bold text-primary">{formatCurrency(r.netoRecibido)}</span> },
              { key: "medioPago", header: "Medio", cell: (r) => <span className="text-xs text-muted-foreground">{r.medioPago}</span> },
              { key: "acciones" as any, header: "", cell: (r) => (
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); window.open(`/api/impresion/pdf?tipo=recibo&id=${r.id}`, "_blank") }}>
                    PDF
                  </Button>
                  {r.totalRetenciones > 0 && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-amber-700" onClick={(e) => { e.stopPropagation(); window.open(`/api/impresion/pdf?tipo=certificado-retencion-recibo&id=${r.id}`, "_blank") }}>
                      Cert.
                    </Button>
                  )}
                </div>
              ) },
            ] as DataTableColumn<Recibo>[]}
            rowKey="id"
            searchPlaceholder="Buscar recibo..."
            searchKeys={["numero"]}
            exportFilename="recibos"
            loading={loadingRecibos}
            emptyMessage="No hay recibos"
            defaultPageSize={10}
            compact
          />
        </CardContent>
      </Card>

      {/* Modal cobro */}
      <Dialog open={modalCobro.length > 0} onOpenChange={() => setModalCobro([])}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{modalCobro.length > 1 ? "Cobro Masivo" : "Registrar Cobro"}</DialogTitle></DialogHeader>
          {modalCobro.length > 0 && (
            <div className="space-y-3 py-2">
              {errorCobro && <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{errorCobro}</div>}
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p className="font-semibold">{modalCobro[0].cliente?.nombre}</p>
                {modalCobro.length === 1 ? (
                  <p className="text-muted-foreground">
                    {modalCobro[0].factura ? `FAC ${modalCobro[0].factura.tipo} ${formatPV(modalCobro[0].factura.puntoVenta, modalCobro[0].factura.numero)}` : `CC #${modalCobro[0].id}`}
                  </p>
                ) : (
                  <p className="text-muted-foreground">{modalCobro.length} comprobantes seleccionados</p>
                )}
                <p>Saldo total: <span className="font-bold text-primary">{formatCurrency(modalCobro.reduce((sum, c) => sum + c.saldo, 0))}</span></p>
              </div>
              <div className="space-y-1.5">
                <Label>Importe a cobrar</Label>
                <Input type="number" step="0.01" value={montoCobro} onChange={(e) => setMontoCobro(e.target.value)} disabled={modalCobro.length > 1} />
                {modalCobro.length > 1 && <p className="text-xs text-muted-foreground">En cobros masivos se cancela el total de los saldos.</p>}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ret-auto"
                  checked={calcularRetencionesAuto}
                  onCheckedChange={(v) => setCalcularRetencionesAuto(v === true)}
                />
                <Label htmlFor="ret-auto" className="text-sm font-normal cursor-pointer">
                  Calcular retenciones automáticas
                </Label>
              </div>
              {(loadingPreview || previewRetenciones?.aplicadas) && (
                <div className="p-3 border border-amber-200 bg-amber-50/50 rounded-lg text-sm space-y-1">
                  <p className="font-semibold text-amber-800">Retenciones estimadas</p>
                  {loadingPreview ? (
                    <p className="text-xs text-muted-foreground">Calculando...</p>
                  ) : previewRetenciones?.aplicadas ? (
                    <>
                      {previewRetenciones.detalle.map((d, i) => (
                        <p key={i} className="text-xs text-amber-900">
                          {d.tipo} ({d.codigoRegimen}): {formatCurrency(d.monto)} — base {formatCurrency(d.base)} @ {d.alicuota}%
                        </p>
                      ))}
                      <p className="font-bold text-amber-800 pt-1">
                        Total retenido: {formatCurrency(previewRetenciones.total)} — Neto: {formatCurrency(netoEstimado)}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sin retenciones aplicables</p>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="split-pago"
                  checked={dividirPago}
                  onCheckedChange={(v) => setDividirPago(v === true)}
                />
                <Label htmlFor="split-pago" className="text-sm font-normal cursor-pointer">
                  Dividir en dos medios de pago
                </Label>
              </div>
              <div className="space-y-1.5">
                <Label>{dividirPago ? "Primer medio" : "Forma de pago"}</Label>
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
              {dividirPago && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label>Segundo medio</Label>
                    <Select value={segundoMedio} onValueChange={setSegundoMedio}>
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
                    <Label>Monto 2º medio</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={`Resto: ${formatCurrency(netoEstimado - (parseFloat(montoSegundoMedio) || 0))}`}
                      value={montoSegundoMedio}
                      onChange={(e) => setMontoSegundoMedio(e.target.value)}
                    />
                  </div>
                </div>
              )}
              {medioPago === "cheque" && (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/40">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Datos del cheque</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5 col-span-2">
                      <Label>Número de cheque</Label>
                      <Input value={chequeNumero} onChange={(e) => setChequeNumero(e.target.value)} placeholder="Ej: 12345678" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Banco</Label>
                      <Input value={chequeBanco} onChange={(e) => setChequeBanco(e.target.value)} placeholder="Galicia, Nación..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label>CUIT librador</Label>
                      <Input value={chequeCuit} onChange={(e) => setChequeCuit(e.target.value)} placeholder="30-12345678-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Fecha emisión</Label>
                      <Input type="date" value={chequeEmision} onChange={(e) => setChequeEmision(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Fecha vencimiento</Label>
                      <Input type="date" value={chequeVencimiento} onChange={(e) => setChequeVencimiento(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Observaciones</Label>
                <Input placeholder="Referencia transferencia u observaciones..." value={obsCobro} onChange={(e) => setObsCobro(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCobro([])}>Cancelar</Button>
            <Button onClick={registrarCobro} disabled={cobrando}>{cobrando ? "Procesando..." : "Confirmar Cobro"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
