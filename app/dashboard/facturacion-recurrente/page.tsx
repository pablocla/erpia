"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Repeat, Plus, RefreshCw, ToggleLeft, ToggleRight,
  DollarSign, FileText, Sparkles, CheckCircle2, AlertTriangle,
} from "lucide-react"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useToast } from "@/hooks/use-toast"
import { FiscalEmissionResult, type FiscalEmissionData } from "@/components/fiscal/fiscal-emission-result"
import { AfipStatusBadge } from "@/components/fiscal/afip-status-badge"
import type { PosAfipStatus } from "@/lib/pos/pos-afip-status"
import { authFetch } from "@/lib/stores"
import { PageShell, PageHeader, KpiStrip } from "@/components/layout"
import { PageSkeleton } from "@/components/layout/page-skeleton"
import { ClienteSearchSelect } from "@/components/forms/cliente-search-select"

interface FacturaRecurrente {
  id: number
  concepto: string
  montoNeto: number
  alicuotaIva: number
  frecuencia: string
  diaEmision: number
  proximaEmision: string
  fechaFin: string | null
  tipoCbte: number
  activo: boolean
  facturasEmitidas: number
  ultimaEmision: string | null
  clienteId: number
}

const FRECUENCIAS: Record<string, string> = {
  mensual: "Mensual",
  bimestral: "Bimestral",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
}

interface ResultadoEmision {
  facturaRecurrenteId: number
  concepto: string
  monto: number
  clienteId: number
  facturaId?: number
  numero?: number
  afipOk?: boolean
  cae?: string
  afipError?: string
}

export default function FacturacionRecurrentePage() {
  const [facturas, setFacturas] = useState<FacturaRecurrente[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [ultimaEmision, setUltimaEmision] = useState<FiscalEmissionData[]>([])
  const [afipStatus, setAfipStatus] = useState<PosAfipStatus | null>(null)
  const [reintentando, setReintentando] = useState(false)
  const [clienteIdNuevo, setClienteIdNuevo] = useState<number | null>(null)
  const { toast } = useToast()

  const headers = { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}` }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [res, resAfip] = await Promise.all([
        fetch("/api/facturacion-recurrente", { headers }),
        fetch("/api/afip/status", { headers }),
      ])
      if (res.ok) setFacturas(await res.json())
      if (resAfip.ok) setAfipStatus(await resAfip.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: fetchData,
    onNew: () => setDialogOpen(true),
  }))

  async function handleCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!clienteIdNuevo) {
      toast({ title: "Seleccioná un cliente", variant: "destructive" })
      return
    }
    const fd = new FormData(e.currentTarget)
    const res = await fetch("/api/facturacion-recurrente", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId: clienteIdNuevo,
        concepto: fd.get("concepto"),
        montoNeto: Number(fd.get("montoNeto")),
        alicuotaIva: Number(fd.get("alicuotaIva")) || 21,
        frecuencia: fd.get("frecuencia") || "mensual",
        diaEmision: Number(fd.get("diaEmision")) || 1,
        fechaFin: fd.get("fechaFin") || undefined,
      }),
    })
    if (res.ok) {
      setDialogOpen(false)
      setClienteIdNuevo(null)
      fetchData()
      toast({ title: "Factura recurrente creada", description: "La suscripción se guardó correctamente" })
    }
    else { toast({ title: "Error al crear recurrente", description: "No se pudo guardar la factura recurrente", variant: "destructive" }) }
  }

  async function handleProcesar() {
    setProcesando(true)
    try {
      const res = await fetch("/api/facturacion-recurrente", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "procesar" }),
      })
      const json = await res.json()
      const emitidas = (json.facturas ?? []) as ResultadoEmision[]
      setUltimaEmision(
        emitidas.map((f) => ({
          success: f.afipOk ?? false,
          numero: f.numero,
          tipo: "B",
          cae: f.cae,
          pendienteCae: !f.afipOk,
          error: f.afipError,
        })),
      )
      fetchData()
      const ok = emitidas.filter((f) => f.afipOk).length
      const pend = emitidas.length - ok
      toast({
        title: "Emisión recurrente",
        description: pend > 0
          ? `${ok} con CAE · ${pend} pendiente(s) de AFIP`
          : `${ok} factura(s) emitida(s) correctamente`,
        variant: pend > 0 ? "destructive" : "default",
      })
    } finally {
      setProcesando(false)
    }
  }

  async function reintentarCae() {
    setReintentando(true)
    try {
      const res = await authFetch("/api/afip/reintentar-cae", { method: "POST" })
      const json = await res.json()
      if (!res.ok) {
        toast({ variant: "destructive", title: "Error AFIP", description: json.error })
        return
      }
      toast({ title: "Sincronización AFIP", description: json.mensaje })
      fetchData()
    } finally {
      setReintentando(false)
    }
  }

  async function handleToggle(id: number, activo: boolean) {
    await fetch("/api/facturacion-recurrente", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "toggle", id, activo: !activo }),
    })
    fetchData()
  }

  const totalMensual = facturas
    .filter((f) => f.activo)
    .reduce((sum, f) => sum + Number(f.montoNeto) * (1 + f.alicuotaIva / 100), 0)

  if (loading && facturas.length === 0) {
    return <PageSkeleton kpis={3} tableRows={0} tableCols={0} />
  }

  return (
    <PageShell>
      <PageHeader
        variant="surface"
        title="Facturación Recurrente"
        description="Suscripciones, alquileres y servicios con emisión AFIP programada"
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Facturación automática
          </span>
        }
        statusSlot={afipStatus ? <AfipStatusBadge status={afipStatus} /> : undefined}
        actions={
          <>
          <Button variant="outline" size="sm" onClick={handleProcesar} disabled={procesando}>
            <Repeat className="mr-2 h-4 w-4" /> {procesando ? "Procesando..." : "Ejecutar emisión"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setClienteIdNuevo(null) }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Nueva recurrente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva Factura Recurrente</DialogTitle></DialogHeader>
              <form onSubmit={handleCrear} className="space-y-4">
                <ClienteSearchSelect
                  value={clienteIdNuevo}
                  onChange={setClienteIdNuevo}
                  required
                />
                <div><Label>Concepto *</Label><Input name="concepto" placeholder="Ej: Suscripción mensual" required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Monto neto *</Label><Input name="montoNeto" type="number" step="0.01" required /></div>
                  <div><Label>Alícuota IVA %</Label><Input name="alicuotaIva" type="number" defaultValue="21" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Frecuencia</Label>
                    <Select name="frecuencia">
                      <SelectTrigger><SelectValue placeholder="Mensual" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(FRECUENCIAS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Día de emisión</Label><Input name="diaEmision" type="number" min="1" max="28" defaultValue="1" /></div>
                </div>
                <div><Label>Fecha fin (opcional)</Label><Input name="fechaFin" type="date" /></div>
                <DialogFooter><Button type="submit">Crear</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </>
        }
      />

      {ultimaEmision.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Última ejecución ({ultimaEmision.length} comprobante{ultimaEmision.length !== 1 ? "s" : ""})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ultimaEmision.map((em, i) => (
              <FiscalEmissionResult
                key={i}
                data={em}
                title={`Factura recurrente #${i + 1}`}
                onRetry={em.pendienteCae ? reintentarCae : undefined}
                retrying={reintentando}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <KpiStrip
        items={[
          { label: "Activas", value: facturas.filter((f) => f.activo).length, icon: FileText },
          {
            label: "Ingreso recurrente",
            value: totalMensual.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }),
            icon: DollarSign,
          },
          {
            label: "Emitidas total",
            value: facturas.reduce((s, f) => s + f.facturasEmitidas, 0),
            icon: Repeat,
          },
        ]}
      />

      {/* Lista */}
      {facturas.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          No hay facturas recurrentes configuradas
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {facturas.map((fr) => (
            <Card key={fr.id} className={!fr.activo ? "opacity-50" : ""}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{fr.concepto}</p>
                      {fr.activo ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px]">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Activa
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Pausada
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>Cliente #{fr.clienteId}</span>
                      <Badge variant="outline">{FRECUENCIAS[fr.frecuencia] ?? fr.frecuencia}</Badge>
                      <span>Día {fr.diaEmision}</span>
                      <span>Emitidas: {fr.facturasEmitidas}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {(Number(fr.montoNeto) * (1 + fr.alicuotaIva / 100)).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Próxima: {new Date(fr.proximaEmision).toLocaleDateString("es-AR")}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleToggle(fr.id, fr.activo)}>
                      {fr.activo ? <ToggleRight className="h-5 w-5 text-emerald-500" /> : <ToggleLeft className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  )
}
