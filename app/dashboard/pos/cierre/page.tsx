"use client"

/**
 * Cierre X / Cierre Z — página de gestión fiscal del POS
 *
 * Cierre X: informe parcial del día, no cierra nada, imprimible
 * Cierre Z: cierra la jornada fiscal definitivamente (irreversible)
 *
 * Estructura:
 *   ┌────────────┬──────────────────────────────────────────┐
 *   │  Status    │  Totales del día (live)                  │
 *   │  bar       ├─────────────┬────────────────────────────┤
 *   │            │ IVA         │ Medios de pago             │
 *   │            ├─────────────┴────────────────────────────┤
 *   │            │ Top productos | Ventas por hora           │
 *   │            ├──────────────────────────────────────────┤
 *   │            │ Botones: [Generar X] [Ejecutar Z]         │
 *   └────────────┴──────────────────────────────────────────┘
 */

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  FileText, AlertTriangle, CheckCircle2, Printer,
  RefreshCw, TrendingUp, Banknote, CreditCard,
  Smartphone, Receipt, Clock, Package,
  Lock, BarChart3, Wallet, ShieldAlert,
} from "lucide-react"
import type { SnapshotFiscal } from "@/lib/pos/fiscal-service"

// ──────────────────────────────────────────────────────────────
// Types (mirrors API response)
// ──────────────────────────────────────────────────────────────

interface CierreXData {
  ok: boolean
  snapshot: SnapshotFiscal
  jornada: { id: number; fecha: string; estado: string; numeroZ: number }
  cierresXHoy: number
  caja: { id: number; turno: string | null; saldoInicial: number; fecha: string }
  generadoEn: string
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtHora = (h: number) => `${String(h).padStart(2, "0")}:00`

const MEDIO_ICONS: Record<string, React.ElementType> = {
  efectivo: Banknote,
  tarjeta: CreditCard,
  transferencia: Receipt,
  qr: Smartphone,
  cheque: FileText,
  ctaCte: Wallet,
}

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

export default function CierrePOSPage() {
  const { toast } = useToast()
  const [data, setData] = useState<CierreXData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Modals
  const [modalX, setModalX] = useState(false)
  const [modalZ, setModalZ] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [zExitoso, setZExitoso] = useState<{ numeroZ: number; totalVentas: number } | null>(null)

  // Arqueo para Cierre Z
  const [arqueo, setArqueo] = useState({
    efectivo: "",
    tarjeta: "",
    transferencia: "",
    qr: "",
    cheque: "",
    justificacion: "",
    observaciones: "",
  })

  const authH = useCallback((): HeadersInit => {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : ""
    return t ? { Authorization: `Bearer ${t}` } : {}
  }, [])

  // ── Cargar datos ──────────────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/pos/cierre-x", { headers: authH() })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Error"); return }
      setData(json)
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }, [authH])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  // ── Generar Cierre X (guarda en DB) ──────────────────────────
  const generarCierreX = async () => {
    setProcesando(true)
    try {
      const res = await fetch("/api/pos/cierre-x", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authH() },
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      toast({ title: `Cierre X N° ${json.numeroCierreX} generado`, description: "Podés imprimirlo ahora" })
      setModalX(false)
      cargarDatos()
      setTimeout(() => window.print(), 300)
    } catch {
      setError("Error al generar Cierre X")
    } finally {
      setProcesando(false)
    }
  }

  // ── Ejecutar Cierre Z ─────────────────────────────────────────
  const ejecutarCierreZ = async () => {
    setProcesando(true)
    setError("")
    try {
      const body = {
        confirmar: true,
        observaciones: arqueo.observaciones || undefined,
        arqueoEfectivo:      arqueo.efectivo      ? parseFloat(arqueo.efectivo)      : undefined,
        arqueoTarjeta:       arqueo.tarjeta        ? parseFloat(arqueo.tarjeta)       : undefined,
        arqueoTransferencia: arqueo.transferencia  ? parseFloat(arqueo.transferencia) : undefined,
        arqueoQR:            arqueo.qr             ? parseFloat(arqueo.qr)            : undefined,
        arqueoCheque:        arqueo.cheque         ? parseFloat(arqueo.cheque)        : undefined,
        diferenciaJustif:    arqueo.justificacion  || undefined,
      }
      const res = await fetch("/api/pos/cierre-z", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authH() },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      setZExitoso({ numeroZ: json.jornada.numeroZ, totalVentas: json.jornada.totalVentas })
      setModalZ(false)
      cargarDatos()
    } catch {
      setError("Error al ejecutar Cierre Z")
    } finally {
      setProcesando(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />Cargando datos fiscales...
      </div>
    )
  }

  const snap = data?.snapshot
  const jornada = data?.jornada
  const jornadaCerrada = jornada?.estado === "cerrada_z"

  return (
    <div className="space-y-5 print:space-y-3">

      {/* ── Header ── */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Cierre de Caja — Informe Fiscal
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            {jornada && <span className="ml-2 font-medium">· Jornada #{jornada.numeroZ}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={cargarDatos} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" />Imprimir
          </Button>
        </div>
      </div>

      {/* Título impresión */}
      <div className="hidden print:block text-center border-b pb-3 mb-3">
        <p className="font-bold text-lg">INFORME FISCAL — CIERRE X</p>
        <p className="text-sm">{new Date().toLocaleString("es-AR")}</p>
        {jornada && <p className="text-sm">Jornada N° {jornada.numeroZ}</p>}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Cierre Z exitoso */}
      {zExitoso && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-300">
            <strong>Cierre Z N° {zExitoso.numeroZ} ejecutado correctamente.</strong>
            {" "}Total ventas del día: ${fmt(zExitoso.totalVentas)}
          </AlertDescription>
        </Alert>
      )}

      {/* Jornada cerrada */}
      {jornadaCerrada && !zExitoso && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-300">
            La jornada fiscal ya tiene Cierre Z emitido. No se pueden registrar más ventas hasta mañana.
          </AlertDescription>
        </Alert>
      )}

      {snap && (
        <>
          {/* ── KPIs principales ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Total ventas</p>
                <p className="text-2xl font-bold text-primary">${fmt(snap.totalVentas)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Facturas emitidas</p>
                <p className="text-2xl font-bold">{snap.cantidadFacturas}</p>
                <p className="text-xs text-muted-foreground">{snap.cantidadTickets} tickets</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Rango numeración</p>
                <p className="text-lg font-bold">
                  {snap.primerNumFactura ?? "—"} → {snap.ultimoNumFactura ?? "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Cierres X emitidos</p>
                <p className="text-2xl font-bold">{data?.cierresXHoy ?? 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* ── Desglose IVA + Medios de pago ── */}
          <div className="grid md:grid-cols-2 gap-4">

            {/* IVA */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Desglose de IVA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {[
                  { label: "Neto gravado 21%",   neto: snap.iva.neto21,        iva: snap.iva.iva21,   pct: "21%" },
                  { label: "Neto gravado 10.5%",  neto: snap.iva.neto105,       iva: snap.iva.iva105,  pct: "10.5%" },
                  { label: "Neto gravado 27%",    neto: snap.iva.neto27,        iva: snap.iva.iva27,   pct: "27%" },
                  { label: "Exento",              neto: snap.iva.netoExento,    iva: 0,                pct: "0%" },
                  { label: "No gravado",          neto: snap.iva.netoNoGravado, iva: 0,                pct: "—" },
                ].filter((r) => r.neto > 0 || r.iva > 0).map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                    <div>
                      <span className="font-medium">{row.label}</span>
                      <Badge variant="outline" className="ml-2 text-xs">{row.pct}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Neto: ${fmt(row.neto)}</p>
                      {row.iva > 0 && <p className="font-semibold">IVA: ${fmt(row.iva)}</p>}
                    </div>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-sm pt-1">
                  <span>Total IVA</span>
                  <span className="text-primary">${fmt(snap.iva.totalIva)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Total neto</span>
                  <span>${fmt(snap.iva.totalNeto)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Medios de pago */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  Medios de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {[
                  { key: "efectivo",      label: "Efectivo",      val: snap.pagos.efectivo,      icon: Banknote },
                  { key: "tarjeta",       label: "Tarjetas",      val: snap.pagos.tarjeta,       icon: CreditCard },
                  { key: "qr",            label: "QR / Digital",  val: snap.pagos.qr,            icon: Smartphone },
                  { key: "transferencia", label: "Transferencia", val: snap.pagos.transferencia, icon: Receipt },
                  { key: "cheque",        label: "Cheques",       val: snap.pagos.cheque,        icon: FileText },
                  { key: "ctaCte",        label: "Cta. Cte.",     val: snap.pagos.ctaCte,        icon: Wallet },
                ].filter((r) => r.val > 0).map((row) => (
                  <div key={row.key} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                    <div className="flex items-center gap-2">
                      <row.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{row.label}</span>
                    </div>
                    <span className="font-semibold">${fmt(row.val)}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-sm pt-1">
                  <span>Total cobrado</span>
                  <span className="text-primary">${fmt(snap.pagos.total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Top productos + Ventas por hora ── */}
          <div className="grid md:grid-cols-2 gap-4">

            {/* Top productos */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Top Productos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {snap.topProductos.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Sin ventas registradas</p>
                ) : (
                  <div className="space-y-1.5">
                    {snap.topProductos.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground w-4 shrink-0 text-right">{i + 1}</span>
                        <span className="flex-1 truncate">{p.nombre}</span>
                        <span className="text-muted-foreground text-xs">{p.cantidad} un.</span>
                        <span className="font-semibold w-24 text-right">${fmt(p.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ventas por hora */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Ventas por Hora
                </CardTitle>
              </CardHeader>
              <CardContent>
                {snap.ventasPorHora.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Sin ventas registradas</p>
                ) : (
                  <div className="space-y-1.5">
                    {snap.ventasPorHora.map((v) => {
                      const pct = snap.totalVentas > 0 ? (v.total / snap.totalVentas) * 100 : 0
                      return (
                        <div key={v.hora} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground w-12 shrink-0">{fmtHora(v.hora)}</span>
                          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-6">{v.cantidad}</span>
                          <span className="font-medium w-24 text-right">${fmt(v.total)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Tipos de comprobante ── */}
          {snap.ventasPorTipo.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Comprobantes por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {snap.ventasPorTipo.map((v) => (
                    <div key={v.tipo} className="text-center p-3 rounded-lg bg-muted/40 border">
                      <p className="text-lg font-bold">{v.tipo === "pendiente_cae" ? "Ticket" : `Fac. ${v.tipo}`}</p>
                      <p className="text-xs text-muted-foreground">{v.cantidad} comprobante{v.cantidad !== 1 ? "s" : ""}</p>
                      <p className="text-sm font-semibold mt-1">${fmt(v.total)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ── Botones de acción ── */}
      <div className="flex flex-col sm:flex-row gap-3 print:hidden">
        <Button
          variant="outline"
          className="flex-1 h-12"
          onClick={() => setModalX(true)}
          disabled={jornadaCerrada || !snap}
        >
          <FileText className="h-5 w-5 mr-2" />
          Generar e Imprimir Cierre X
          <span className="ml-auto text-xs text-muted-foreground">
            {data?.cierresXHoy ? `(${data.cierresXHoy} hoy)` : ""}
          </span>
        </Button>

        <Button
          variant="destructive"
          className="flex-1 h-12 font-bold"
          onClick={() => setModalZ(true)}
          disabled={jornadaCerrada || !snap}
        >
          <Lock className="h-5 w-5 mr-2" />
          Ejecutar Cierre Z — Cerrar Jornada
        </Button>
      </div>

      {/* ══ MODAL Cierre X ══ */}
      <Dialog open={modalX} onOpenChange={setModalX}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generar Cierre X
            </DialogTitle>
            <DialogDescription>
              Genera un informe parcial del día. No cierra la caja ni la jornada. Podés generarlo N veces.
            </DialogDescription>
          </DialogHeader>
          {snap && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Total ventas</p>
                  <p className="font-bold text-lg">${fmt(snap.totalVentas)}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Comprobantes</p>
                  <p className="font-bold text-lg">{snap.cantidadFacturas + snap.cantidadTickets}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">IVA total</p>
                  <p className="font-bold">${fmt(snap.iva.totalIva)}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Cierre X N°</p>
                  <p className="font-bold">{(data?.cierresXHoy ?? 0) + 1}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Se guardará en el historial y abrirá el diálogo de impresión automáticamente.
              </p>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModalX(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={generarCierreX} disabled={procesando}>
              {procesando ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
              Generar e Imprimir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ MODAL Cierre Z ══ */}
      <Dialog open={modalZ} onOpenChange={setModalZ}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Cierre Z — Cerrar Jornada Fiscal
            </DialogTitle>
            <DialogDescription>
              Esta acción es <strong>irreversible</strong>. Cierra la jornada fiscal del día,
              la caja activa, y registra los totales finales. No se podrán agregar más ventas al día de hoy.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <p className="text-sm font-semibold">Arqueo final (opcional — si no completás, se usan los valores del sistema)</p>

            {[
              { key: "efectivo",     label: "Efectivo",       sistema: snap?.pagos.efectivo },
              { key: "tarjeta",      label: "Tarjetas",       sistema: snap?.pagos.tarjeta },
              { key: "transferencia",label: "Transferencias", sistema: snap?.pagos.transferencia },
              { key: "qr",           label: "QR / Digital",  sistema: snap?.pagos.qr },
              { key: "cheque",       label: "Cheques",        sistema: snap?.pagos.cheque },
            ].filter((r) => (r.sistema ?? 0) > 0).map((row) => (
              <div key={row.key} className="flex items-center gap-2">
                <Label className="w-32 text-xs shrink-0">{row.label}</Label>
                <p className="text-xs text-muted-foreground w-24">Sistema: ${fmt(row.sistema ?? 0)}</p>
                <Input
                  type="number"
                  placeholder={String(row.sistema ?? 0)}
                  className="h-8 text-sm"
                  value={arqueo[row.key as keyof typeof arqueo]}
                  onChange={(e) => setArqueo({ ...arqueo, [row.key]: e.target.value })}
                />
              </div>
            ))}

            <div className="space-y-1">
              <Label className="text-xs">Observaciones</Label>
              <Textarea
                value={arqueo.observaciones}
                onChange={(e) => setArqueo({ ...arqueo, observaciones: e.target.value })}
                placeholder="Notas del cierre..."
                rows={2}
                className="text-sm"
              />
            </div>

            {snap && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-sm space-y-1">
                <p className="font-semibold text-destructive">Resumen final a cerrar</p>
                <div className="flex justify-between">
                  <span>Total ventas</span><span className="font-bold">${fmt(snap.totalVentas)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA</span><span>${fmt(snap.iva.totalIva)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Comprobantes</span>
                  <span>{snap.cantidadFacturas + snap.cantidadTickets}</span>
                </div>
                <div className="flex justify-between">
                  <span>N° Cierre Z</span>
                  <span className="font-bold">#{jornada?.numeroZ}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModalZ(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={ejecutarCierreZ}
              disabled={procesando}
            >
              {procesando
                ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                : <Lock className="h-4 w-4 mr-2" />}
              Confirmar Cierre Z
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
