"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Plus,
  RefreshCw,
  Sparkles,
  FileText,
  DollarSign,
  AlertTriangle,
} from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"

type NC = {
  id: number
  tipo: string
  tipoCbte: number
  numero: number
  puntoVenta: number
  motivo: string
  subtotal: number
  iva: number
  total: number
  estado: string
  createdAt: string
  factura?: { tipo: string; numero: number; puntoVenta: number }
  cliente?: { id: number; nombre: string; cuit: string | null }
}

type LineaFactura = {
  id: number
  descripcion: string
  cantidad: number
  precioUnitario: number
  porcentajeIva: number
  productoId?: number | null
}

type FacturaDetalle = {
  id: number
  tipo: string
  numero: number
  puntoVenta: number
  total: number
  subtotal: number
  iva: number
  cliente?: { nombre: string; cuit: string | null }
  lineas: LineaFactura[]
}

const ESTADOS_NC = ["pendiente", "emitida", "anulada"]

function formatCurrency(v: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(v)
}

function formatPV(pv: number, n: number) {
  return `${String(pv).padStart(4, "0")}-${String(n).padStart(8, "0")}`
}

export default function NotasCreditoPage() {
  const [ncs, setNcs] = useState<NC[]>([])
  const [loading, setLoading] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")

  const [modal, setModal] = useState(false)
  const [facturaId, setFacturaId] = useState("")
  const [motivo, setMotivo] = useState("")
  const [parcial, setParcial] = useState(false)
  const [montoNC, setMontoNC] = useState("")
  const [factura, setFactura] = useState<FacturaDetalle | null>(null)
  const [facturaCargando, setFacturaCargando] = useState(false)
  const [selectedLineaId, setSelectedLineaId] = useState<number | null>(null)
  const [cantidadNC, setCantidadNC] = useState("1")
  const [emitting, setEmitting] = useState(false)
  const [error, setError] = useState("")

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  )

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notas-credito", { headers })
      const data = await res.json()
      setNcs(Array.isArray(data.data) ? data.data : [])
    } finally {
      setLoading(false)
    }
  }, [headers])

  const cargarFactura = useCallback(async () => {
    if (!facturaId) return
    setError("")
    setFactura(null)
    setFacturaCargando(true)
    try {
      const res = await fetch(`/api/facturas/${facturaId}`, { headers })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "No se encontró la factura")
        return
      }
      const data = await res.json()
      setFactura(data as FacturaDetalle)
      setSelectedLineaId(data.lineas?.[0]?.id ?? null)
    } catch (err) {
      setError("Error al cargar la factura")
    } finally {
      setFacturaCargando(false)
    }
  }, [facturaId, headers])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useKeyboardShortcuts(erpShortcuts({ onRefresh: cargar, onNew: () => setModal(true) }))

  const ncFiltradas = ncs.filter((nc) => {
    const matchBusqueda =
      nc.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      nc.motivo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(nc.numero).includes(busqueda)
    const matchEstado = filtroEstado === "todos" || nc.estado === filtroEstado
    return matchBusqueda && matchEstado
  })

  const resumen = {
    total: ncs.length,
    emitidas: ncs.filter((n) => n.estado === "emitida").length,
    montoTotal: ncs.filter((n) => n.estado === "emitida").reduce((s, n) => s + n.total, 0),
  }

  const emitirNC = async () => {
    setError("")
    if (!facturaId || !motivo.trim()) {
      setError("Factura y motivo son obligatorios")
      return
    }
    if (parcial && factura && selectedLineaId === null && !montoNC) {
      setError("Seleccione una línea de factura o indique un monto para NC parcial")
      return
    }
    setEmitting(true)
    try {
      const body: Record<string, unknown> = {
        facturaId: parseInt(facturaId, 10),
        motivo: motivo.trim(),
      }

      if (parcial) {
        if (factura && selectedLineaId !== null) {
          body.items = [
            {
              lineaFacturaId: selectedLineaId,
              cantidad: parseFloat(cantidadNC) || 1,
            },
          ]
        } else if (montoNC) {
          body.items = [
            {
              descripcion: `NC parcial — ${motivo.trim()}`,
              cantidad: 1,
              precioUnitario: parseFloat(montoNC),
              porcentajeIva: 21,
            },
          ]
        }
      }

      const res = await fetch("/api/notas-credito", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error al emitir NC")
        return
      }
      setModal(false)
      setFacturaId("")
      setMotivo("")
      setParcial(false)
      setMontoNC("")
      setFactura(null)
      setSelectedLineaId(null)
      setCantidadNC("1")
      await cargar()
    } finally {
      setEmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="dashboard-surface rounded-xl p-4 sm:p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Gestión de ajustes y devoluciones
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Notas de Crédito</h1>
          <p className="text-muted-foreground text-sm mt-1">Reversa fiscal, contable y de stock sobre facturas emitidas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={cargar} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button onClick={() => setModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Nota de Crédito
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="h-3.5 w-3.5" />Total emitidas</p>
            <p className="text-2xl font-bold">{resumen.emitidas}</p>
            <p className="text-xs text-muted-foreground mt-1">de {resumen.total} notas</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3.5 w-3.5 text-red-500" />Monto total NC</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(resumen.montoTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">Impacto en ventas netas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />Pendientes</p>
            <p className="text-2xl font-bold">{ncs.filter((n) => n.estado === "pendiente").length}</p>
            <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Comprobantes</CardTitle>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS_NC.map((e) => (<SelectItem key={e} value={e}>{e}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <DataTable<NC>
            data={ncFiltradas}
            columns={[
              { key: "tipo", header: "Tipo", cell: (nc) => <Badge variant="outline" className="font-mono text-xs">NC {nc.tipo}</Badge> },
              { key: "numero", header: "Número", sortable: true, cell: (nc) => <span className="font-mono text-xs">{formatPV(nc.puntoVenta, nc.numero)}</span> },
              { key: "createdAt", header: "Fecha", sortable: true, cell: (nc) => <span className="text-muted-foreground">{new Date(nc.createdAt).toLocaleDateString("es-AR")}</span> },
              { key: "cliente" as any, header: "Cliente", cell: (nc) => (<div><p className="font-medium">{nc.cliente?.nombre ?? "—"}</p>{nc.cliente?.cuit && <p className="text-xs text-muted-foreground">{nc.cliente.cuit}</p>}</div>), exportFn: (nc) => nc.cliente?.nombre ?? "" },
              { key: "factura" as any, header: "Factura origen", cell: (nc) => <span className="font-mono text-xs">{nc.factura ? `FAC ${nc.factura.tipo} ${formatPV(nc.factura.puntoVenta, nc.factura.numero)}` : "—"}</span> },
              { key: "motivo", header: "Motivo", cell: (nc) => <span className="text-muted-foreground max-w-[200px] truncate block">{nc.motivo}</span> },
              { key: "total", header: "Importe", align: "right", sortable: true, cell: (nc) => <span className="font-bold text-red-600">-{formatCurrency(nc.total)}</span> },
              { key: "estado", header: "Estado", cell: (nc) => <Badge variant={nc.estado === "emitida" ? "default" : nc.estado === "anulada" ? "destructive" : "secondary"} className="text-xs">{nc.estado}</Badge> },
            ] as DataTableColumn<NC>[]}
            rowKey="id"
            searchPlaceholder="Buscar nota de crédito..."
            searchKeys={["numero", "motivo"]}
            selectable
            exportFilename="notas-credito"
            loading={loading}
            emptyMessage="No hay notas de crédito"
            emptyIcon={<EmptyStateIllustration type="generico" compact title="Sin notas de crédito" description="Emití una NC desde una factura para reversar." actionLabel="Nueva NC" onAction={() => setModal(true)} />}
            defaultPageSize={25}
            compact
          />
        </CardContent>
      </Card>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Emitir Nota de Crédito</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {error && <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
            <div className="space-y-1.5">
              <Label>ID Factura origen</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Ej: 42"
                  value={facturaId}
                  onChange={(e) => {
                    setFacturaId(e.target.value)
                    setFactura(null)
                    setSelectedLineaId(null)
                  }}
                />
                <Button variant="outline" onClick={cargarFactura} disabled={!facturaId || facturaCargando}>
                  {facturaCargando ? "Cargando..." : "Cargar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Ingrese el ID de la factura sobre la cual emitir la NC</p>
            </div>
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Textarea placeholder="Devolución, diferencia de precio, error de facturación..." value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} />
            </div>
            {factura && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm space-y-3">
                <div className="font-semibold">Factura {factura.tipo} {formatPV(factura.puntoVenta, factura.numero)}</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Total: {formatCurrency(factura.total)}</div>
                  <div>Neto: {formatCurrency(factura.subtotal)}</div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium">Líneas de factura</div>
                  <div className="space-y-2">
                    {factura.lineas.map((linea) => (
                      <label key={linea.id} className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:border-primary/50">
                        <input
                          type="radio"
                          name="lineaFactura"
                          value={linea.id}
                          checked={selectedLineaId === linea.id}
                          onChange={() => setSelectedLineaId(linea.id)}
                          className="h-4 w-4"
                        />
                        <div className="min-w-0">
                          <div className="font-medium truncate">{linea.descripcion}</div>
                          <div className="text-xs text-muted-foreground">Cant: {linea.cantidad} · Precio/u: {formatCurrency(linea.precioUnitario)} · IVA: {linea.porcentajeIva}%</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="parcial" checked={parcial} onChange={(e) => setParcial(e.target.checked)} className="rounded" />
              <Label htmlFor="parcial" className="text-sm cursor-pointer">NC parcial</Label>
            </div>
            {parcial && (
              <div className="space-y-1.5">
                <div className="grid gap-3">
                  {factura && factura.lineas.length > 0 ? (
                    <>
                      <div className="text-xs text-muted-foreground">Seleccione una línea de factura para emitir una NC parcial basada en la línea original.</div>
                      {selectedLineaId !== null && (
                        <div className="space-y-1.5">
                          <Label>Cantidad a anular</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="Ej: 1"
                            value={cantidadNC}
                            onChange={(e) => setCantidadNC(e.target.value)}
                          />
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">Si no selecciona línea, se usará el monto manual ingresado.</div>
                    </>
                  ) : (
                    <>
                      <Label>Monto neto (sin IVA)</Label>
                      <Input type="number" step="0.01" placeholder="Ej: 5000" value={montoNC} onChange={(e) => setMontoNC(e.target.value)} />
                      <p className="text-xs text-muted-foreground">Si desea usar una línea de factura, primero cargue la factura.</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={emitirNC} disabled={emitting}>{emitting ? "Emitiendo..." : "Emitir NC"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
