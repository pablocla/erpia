"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import {
  Wallet, Lock, Unlock, Plus, TrendingUp, TrendingDown,
  ArrowUpCircle, ArrowDownCircle, CheckCircle2, AlertTriangle,
  ClipboardCheck, Calculator,
} from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useToast } from "@/hooks/use-toast"

interface MovimientoCaja {
  id: number
  tipo: "ingreso" | "egreso"
  concepto: string
  monto: number
  medioPago: string
  referencia?: string
  createdAt: string
}

interface Caja {
  id: number
  estado: "abierta" | "cerrada"
  fecha: string
  saldoInicial: number
  saldoFinal?: number
  turno?: string
  diferencia?: number
  diferenciaJustif?: string
  movimientos: MovimientoCaja[]
}

const MEDIOS_PAGO = ["efectivo", "tarjeta_debito", "tarjeta_credito", "transferencia", "cheque", "qr"]
const TURNOS = [
  { value: "mañana", label: "Mañana" },
  { value: "tarde", label: "Tarde" },
  { value: "noche", label: "Noche" },
]

export default function CajaPage() {
  const [cajaActual, setCajaActual] = useState<Caja | null>(null)
  const [historial, setHistorial] = useState<Caja[]>([])
  const [loading, setLoading] = useState(true)
  const [abrirDialogOpen, setAbrirDialogOpen] = useState(false)
  const [movimientoDialogOpen, setMovimientoDialogOpen] = useState(false)
  const [arqueoDialogOpen, setArqueoDialogOpen] = useState(false)
  const [saldoInicial, setSaldoInicial] = useState("0")
  const [turno, setTurno] = useState("")
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    tipo: "ingreso",
    concepto: "",
    monto: "",
    medioPago: "efectivo",
    referencia: "",
  })
  const [arqueo, setArqueo] = useState({
    efectivo: "",
    tarjeta: "",
    transferencia: "",
    cheque: "",
    qr: "",
    justificacion: "",
    observaciones: "",
  })
  const [arqueoResultado, setArqueoResultado] = useState<{
    diferencia: number
    sistemaEfectivo: number
    sistemaTarjeta: number
    sistemaTransferencia: number
    sistemaCheque: number
    sistemaQR: number
  } | null>(null)
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [cierreMensaje, setCierreMensaje] = useState("")
  const { toast } = useToast()

  const cargarCaja = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/caja", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const cajas: Caja[] = await res.json()
      const abierta = cajas.find((c) => c.estado === "abierta") || null
      setCajaActual(abierta)
      setHistorial(cajas.filter((c) => c.estado === "cerrada").slice(0, 10))
    } catch {
      setError("Error al cargar caja")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarCaja()
  }, [cargarCaja])

  useKeyboardShortcuts(erpShortcuts({ onRefresh: cargarCaja }))

  const abrirCaja = async () => {
    setGuardando(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/caja", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          saldoInicial: parseFloat(saldoInicial || "0"),
          empresaId: 1,
          turno: turno || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error)
        return
      }
      setAbrirDialogOpen(false)
      setSaldoInicial("0")
      setTurno("")
      cargarCaja()
      toast({ title: "Caja abierta", description: "Se abrió la caja correctamente" })
    } catch {
      setError("Error de conexión")
      toast({ title: "Error al abrir caja", description: "No se pudo abrir la caja", variant: "destructive" })
    } finally {
      setGuardando(false)
    }
  }

  const iniciarArqueo = () => {
    if (!cajaActual) return
    // Pre-calculate system totals for display
    const mov = cajaActual.movimientos
    const porMedio = (medio: string) =>
      mov.filter((m) => m.medioPago === medio).reduce((s, m) => s + (m.tipo === "ingreso" ? m.monto : -m.monto), 0)

    setArqueoResultado({
      diferencia: 0,
      sistemaEfectivo: cajaActual.saldoInicial + porMedio("efectivo"),
      sistemaTarjeta: porMedio("tarjeta_debito") + porMedio("tarjeta_credito"),
      sistemaTransferencia: porMedio("transferencia"),
      sistemaCheque: porMedio("cheque"),
      sistemaQR: porMedio("qr"),
    })
    setArqueo({ efectivo: "", tarjeta: "", transferencia: "", cheque: "", qr: "", justificacion: "", observaciones: "" })
    setArqueoDialogOpen(true)
  }

  const cerrarConArqueo = async () => {
    if (!cajaActual) return
    setGuardando(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/caja", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          cajaId: cajaActual.id,
          observaciones: arqueo.observaciones || undefined,
          arqueoEfectivo: arqueo.efectivo ? parseFloat(arqueo.efectivo) : undefined,
          arqueoTarjeta: arqueo.tarjeta ? parseFloat(arqueo.tarjeta) : undefined,
          arqueoTransferencia: arqueo.transferencia ? parseFloat(arqueo.transferencia) : undefined,
          arqueoCheque: arqueo.cheque ? parseFloat(arqueo.cheque) : undefined,
          arqueoQR: arqueo.qr ? parseFloat(arqueo.qr) : undefined,
          diferenciaJustif: arqueo.justificacion || undefined,
        }),
      })

      const data = await res.json()
      if (res.status === 422) {
        // Significant variance — need justification
        setArqueoResultado((prev) => prev ? { ...prev, diferencia: data.diferencia } : null)
        setError(`Diferencia de $${Math.abs(data.diferencia).toFixed(2)} detectada. Justifique para continuar.`)
        return
      }
      if (!res.ok) {
        setError(data.error)
        return
      }

      const diff = data.resumenArqueo?.diferencia ?? 0
      setArqueoDialogOpen(false)
      setCierreMensaje(
        `Caja cerrada. Saldo final: $${data.saldoFinal?.toFixed(2)}` +
        (Math.abs(diff) > 0 ? ` | Diferencia: $${diff.toFixed(2)}` : " | Sin diferencias")
      )
      cargarCaja()
      toast({ title: "Caja cerrada", description: `Saldo final: $${data.saldoFinal?.toFixed(2)}${Math.abs(diff) > 0 ? ` — Diferencia: $${diff.toFixed(2)}` : ""}` })
    } catch {
      setError("Error al cerrar caja")
      toast({ title: "Error al cerrar caja", description: "No se pudo completar el cierre", variant: "destructive" })
    } finally {
      setGuardando(false)
    }
  }

  const registrarMovimiento = async () => {
    if (!cajaActual) return
    setError("")
    if (!nuevoMovimiento.concepto || !nuevoMovimiento.monto) {
      setError("Concepto y monto son obligatorios")
      return
    }
    setGuardando(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/caja/movimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...nuevoMovimiento,
          monto: parseFloat(nuevoMovimiento.monto),
          cajaId: cajaActual.id,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error)
        return
      }
      setMovimientoDialogOpen(false)
      setNuevoMovimiento({ tipo: "ingreso", concepto: "", monto: "", medioPago: "efectivo", referencia: "" })
      cargarCaja()
      toast({ title: "Movimiento registrado", description: `${nuevoMovimiento.tipo === "ingreso" ? "Ingreso" : "Egreso"} de $${nuevoMovimiento.monto} registrado` })
    } catch {
      setError("Error al registrar movimiento")
      toast({ title: "Error al registrar movimiento", description: "No se pudo completar la operación", variant: "destructive" })
    } finally {
      setGuardando(false)
    }
  }

  const calcularTotales = (movimientos: MovimientoCaja[]) => {
    const ingresos = movimientos.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0)
    const egresos = movimientos.filter((m) => m.tipo === "egreso").reduce((s, m) => s + m.monto, 0)
    return { ingresos, egresos }
  }

  const totales = cajaActual ? calcularTotales(cajaActual.movimientos) : { ingresos: 0, egresos: 0 }
  const saldoActual = cajaActual ? cajaActual.saldoInicial + totales.ingresos - totales.egresos : 0

  // Arqueo: calculated diff in real-time
  const arqueoDiff = arqueoResultado
    ? (parseFloat(arqueo.efectivo || "0") - arqueoResultado.sistemaEfectivo) +
      (parseFloat(arqueo.tarjeta || "0") - arqueoResultado.sistemaTarjeta) +
      (parseFloat(arqueo.transferencia || "0") - arqueoResultado.sistemaTransferencia) +
      (parseFloat(arqueo.cheque || "0") - arqueoResultado.sistemaCheque) +
      (parseFloat(arqueo.qr || "0") - arqueoResultado.sistemaQR)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Cargando estado de caja...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Caja
          </h1>
          <p className="text-sm text-muted-foreground">
            Apertura, movimientos, arqueo y cierre diario
            {cajaActual?.turno && (
              <Badge variant="outline" className="ml-2">{cajaActual.turno}</Badge>
            )}
          </p>
        </div>
        {!cajaActual ? (
          <Button onClick={() => setAbrirDialogOpen(true)}>
            <Unlock className="h-4 w-4 mr-2" />
            Abrir Caja
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMovimientoDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Movimiento
            </Button>
            <Button variant="destructive" onClick={iniciarArqueo} disabled={guardando}>
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Arqueo y Cierre
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {cierreMensaje && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-300">{cierreMensaje}</AlertDescription>
        </Alert>
      )}

      {!cajaActual ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <Wallet className="h-16 w-16 text-muted-foreground opacity-30" />
            <div>
              <p className="text-lg font-medium">No hay caja abierta</p>
              <p className="text-sm text-muted-foreground">Abrí la caja para registrar movimientos</p>
            </div>
            <Button onClick={() => setAbrirDialogOpen(true)}>
              <Unlock className="h-4 w-4 mr-2" />
              Abrir Caja Ahora
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs caja actual */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Saldo Inicial</p>
                <p className="text-2xl font-bold">${cajaActual.saldoInicial.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardContent className="pt-4">
                <p className="text-sm text-green-700 dark:text-green-400">Ingresos</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">+${totales.ingresos.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardContent className="pt-4">
                <p className="text-sm text-red-700 dark:text-red-400">Egresos</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">-${totales.egresos.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-4">
                <p className="text-sm text-primary">Saldo Actual</p>
                <p className="text-2xl font-bold">${saldoActual.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Desglose por medio de pago */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">Desglose por Medio de Pago</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {MEDIOS_PAGO.map((m) => {
                  const monto = cajaActual.movimientos
                    .filter((mv) => mv.medioPago === m)
                    .reduce((s, mv) => s + (mv.tipo === "ingreso" ? mv.monto : -mv.monto), 0)
                  return (
                    <div key={m} className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground capitalize">{m.replace("_", " ")}</p>
                      <p className={`text-sm font-bold ${monto >= 0 ? "text-foreground" : "text-red-600"}`}>
                        ${Math.abs(monto).toFixed(2)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Movimientos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-base">Movimientos de Hoy</CardTitle>
              <Badge variant="secondary">{cajaActual.movimientos.length}</Badge>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <DataTable<MovimientoCaja>
                data={cajaActual.movimientos}
                columns={[
                  { key: "tipo", header: "Tipo", cell: (m) => m.tipo === "ingreso" ? <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 gap-1"><ArrowUpCircle className="h-3 w-3" /> Ingreso</Badge> : <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 gap-1"><ArrowDownCircle className="h-3 w-3" /> Egreso</Badge> },
                  { key: "concepto", header: "Concepto", cell: (m) => <span className="font-medium">{m.concepto}</span> },
                  { key: "medioPago", header: "Medio de Pago", cell: (m) => <span className="capitalize">{m.medioPago.replace("_", " ")}</span> },
                  { key: "referencia", header: "Referencia", cell: (m) => <span className="text-muted-foreground text-sm">{m.referencia || "—"}</span> },
                  { key: "monto", header: "Monto", align: "right", sortable: true, cell: (m) => <span className={`font-bold ${m.tipo === "ingreso" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>{m.tipo === "ingreso" ? "+" : "-"}${m.monto.toFixed(2)}</span> },
                  { key: "createdAt", header: "Hora", cell: (m) => <span className="text-sm text-muted-foreground">{new Date(m.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</span> },
                ] as DataTableColumn<MovimientoCaja>[]}
                rowKey="id"
                searchPlaceholder="Buscar movimiento..."
                searchKeys={["concepto", "medioPago"]}
                exportFilename="movimientos-caja"
                emptyMessage="Sin movimientos aún"
                defaultPageSize={10}
                compact
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Historial de Cajas</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <DataTable<Caja>
              data={historial}
              columns={[
                { key: "fecha", header: "Fecha", sortable: true, cell: (c) => new Date(c.fecha).toLocaleDateString("es-AR") },
                { key: "turno" as any, header: "Turno", cell: (c) => <span className="capitalize">{c.turno ?? "—"}</span> },
                { key: "saldoInicial", header: "Saldo Inicial", align: "right", cell: (c) => `$${c.saldoInicial.toFixed(2)}` },
                { key: "saldoFinal" as any, header: "Saldo Final", align: "right", cell: (c) => <span className="font-bold">${c.saldoFinal?.toFixed(2) ?? "—"}</span> },
                { key: "diferencia" as any, header: "Diferencia", align: "right", cell: (c) => c.diferencia != null ? <span className={Math.abs(c.diferencia) > 0 ? "text-amber-600 font-medium" : "text-green-600"}>${c.diferencia.toFixed(2)}{c.diferenciaJustif && <span className="text-xs text-muted-foreground ml-1" title={c.diferenciaJustif}>ⓘ</span>}</span> : <span>—</span> },
                { key: "movimientos" as any, header: "Movimientos", cell: (c) => { const tot = calcularTotales(c.movimientos); return <><span className="text-green-700 dark:text-green-400">+${tot.ingresos.toFixed(2)}</span>{" / "}<span className="text-red-700 dark:text-red-400">-${tot.egresos.toFixed(2)}</span></> } },
                { key: "estado", header: "Estado", cell: () => <Badge variant="secondary">Cerrada</Badge> },
              ] as DataTableColumn<Caja>[]}
              rowKey="id"
              exportFilename="historial-cajas"
              emptyMessage="Sin historial"
              defaultPageSize={10}
              compact
            />
          </CardContent>
        </Card>
      )}

      {/* Dialog abrir caja */}
      <Dialog open={abrirDialogOpen} onOpenChange={setAbrirDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Caja</DialogTitle>
            <DialogDescription>Ingresá el efectivo en caja y seleccioná el turno.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Saldo inicial (efectivo en caja)</Label>
              <Input
                type="number"
                value={saldoInicial}
                onChange={(e) => setSaldoInicial(e.target.value)}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Turno</Label>
              <Select value={turno} onValueChange={setTurno}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar turno (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {TURNOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setAbrirDialogOpen(false)}>Cancelar</Button>
            <Button onClick={abrirCaja} disabled={guardando}>
              <Unlock className="h-4 w-4 mr-2" />
              Abrir Caja
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog nuevo movimiento */}
      <Dialog open={movimientoDialogOpen} onOpenChange={setMovimientoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Movimiento</DialogTitle>
          </DialogHeader>
          {error && movimientoDialogOpen && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={nuevoMovimiento.tipo}
                onValueChange={(v) => setNuevoMovimiento({ ...nuevoMovimiento, tipo: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingreso">
                    <span className="text-green-700 font-medium">Ingreso</span>
                  </SelectItem>
                  <SelectItem value="egreso">
                    <span className="text-red-700 font-medium">Egreso</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Concepto *</Label>
              <Input
                value={nuevoMovimiento.concepto}
                onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, concepto: e.target.value })}
                placeholder="Ej: Venta, Pago proveedor, Gasto..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto *</Label>
                <Input
                  type="number"
                  value={nuevoMovimiento.monto}
                  onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, monto: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>Medio de pago</Label>
                <Select
                  value={nuevoMovimiento.medioPago}
                  onValueChange={(v) => setNuevoMovimiento({ ...nuevoMovimiento, medioPago: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDIOS_PAGO.map((m) => (
                      <SelectItem key={m} value={m} className="capitalize">
                        {m.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Referencia (opcional)</Label>
              <Input
                value={nuevoMovimiento.referencia}
                onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, referencia: e.target.value })}
                placeholder="Nro. factura, etc."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setMovimientoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={registrarMovimiento} disabled={guardando}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Arqueo y Cierre */}
      <Dialog open={arqueoDialogOpen} onOpenChange={setArqueoDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Arqueo de Caja
            </DialogTitle>
            <DialogDescription>
              Contá el dinero físico y declaralo por medio de pago. El sistema calculará la diferencia.
            </DialogDescription>
          </DialogHeader>

          {error && arqueoDialogOpen && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Per-payment-method count */}
            {[
              { key: "efectivo", label: "Efectivo", sistema: arqueoResultado?.sistemaEfectivo ?? 0 },
              { key: "tarjeta", label: "Tarjetas (débito + crédito)", sistema: arqueoResultado?.sistemaTarjeta ?? 0 },
              { key: "transferencia", label: "Transferencias", sistema: arqueoResultado?.sistemaTransferencia ?? 0 },
              { key: "cheque", label: "Cheques", sistema: arqueoResultado?.sistemaCheque ?? 0 },
              { key: "qr", label: "QR / Billetera digital", sistema: arqueoResultado?.sistemaQR ?? 0 },
            ].map(({ key, label, sistema }) => (
              <div key={key} className="grid grid-cols-3 items-center gap-2">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    Sistema: ${sistema.toFixed(2)}
                  </p>
                </div>
                <Input
                  type="number"
                  placeholder="Declarado"
                  min="0"
                  step="0.01"
                  value={arqueo[key as keyof typeof arqueo]}
                  onChange={(e) => setArqueo({ ...arqueo, [key]: e.target.value })}
                />
                <div className="text-right text-sm">
                  {arqueo[key as keyof typeof arqueo] ? (
                    <span className={
                      Math.abs(parseFloat(arqueo[key as keyof typeof arqueo] || "0") - sistema) > 0.01
                        ? "text-amber-600 font-medium"
                        : "text-green-600"
                    }>
                      {parseFloat(arqueo[key as keyof typeof arqueo] || "0") - sistema >= 0 ? "+" : ""}
                      ${(parseFloat(arqueo[key as keyof typeof arqueo] || "0") - sistema).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            ))}

            <Separator />

            {/* Total difference */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="font-medium">Diferencia Total</span>
              <span className={`text-lg font-bold ${
                Math.abs(arqueoDiff) > 0.01
                  ? Math.abs(arqueoDiff) > 100 ? "text-red-600" : "text-amber-600"
                  : "text-green-600"
              }`}>
                ${arqueoDiff.toFixed(2)}
              </span>
            </div>

            {/* Justification (required for large variance) */}
            {Math.abs(arqueoDiff) > 100 && (
              <div className="space-y-2">
                <Label className="text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Justificación requerida (diferencia &gt; $100)
                </Label>
                <Textarea
                  value={arqueo.justificacion}
                  onChange={(e) => setArqueo({ ...arqueo, justificacion: e.target.value })}
                  placeholder="Explique la causa de la diferencia..."
                  rows={2}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Observaciones (opcional)</Label>
              <Textarea
                value={arqueo.observaciones}
                onChange={(e) => setArqueo({ ...arqueo, observaciones: e.target.value })}
                placeholder="Notas adicionales del cierre..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setArqueoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={cerrarConArqueo}
              disabled={guardando || (Math.abs(arqueoDiff) > 100 && !arqueo.justificacion)}
            >
              <Lock className="h-4 w-4 mr-2" />
              Cerrar Caja
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
