"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DataTable } from "@/components/data-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Package, Truck, FileText, RefreshCw, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { FiscalEmissionResult, type FiscalEmissionData } from "@/components/fiscal/fiscal-emission-result"
import { authFetch } from "@/lib/stores"
import { PageShell, PageHeader, StatusBadge } from "@/components/layout"
import { pedidoEstadoLabel, pedidoEstadoVariant } from "@/lib/ui/status-map"
import { Sparkles } from "lucide-react"

interface Pedido {
  id: number
  numero: string
  estado: string
  total: number
  cliente: { id: number; nombre: string }
  createdAt: string
  lineas: { id: number }[]
  remitos: { id: number }[]
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [estadoFiltro, setEstadoFiltro] = useState("todos")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { toast } = useToast()
  const [ultimaFactura, setUltimaFactura] = useState<FiscalEmissionData | null>(null)
  const [reintentando, setReintentando] = useState(false)

  useEffect(() => {
    cargarPedidos()
  }, [estadoFiltro])

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
    } finally {
      setReintentando(false)
    }
  }

  async function cargarPedidos() {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (estadoFiltro !== "todos") params.set("estado", estadoFiltro)
      const res = await fetch(`/api/ventas/pedidos?${params.toString()}`)
      const json = await res.json()
      setPedidos(json.pedidos ?? json.data ?? [])
    } catch (err) {
      setError("No se pudieron cargar los pedidos")
    } finally {
      setLoading(false)
    }
  }

  async function ejecutarAccion(action: string, pedidoId: number) {
    setError("")
    setSuccess("")
    try {
      const payload: Record<string, unknown> = { action, pedidoId }
      if (action === "facturar") {
        payload.tipo = "B"
        payload.tipoCbte = 6
        payload.puntoVenta = 1
      }
      const res = await fetch("/api/ventas/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Error al ejecutar acción")

      if (action === "facturar") {
        setUltimaFactura({
          success: json.afipOk ?? !!json.cae,
          numero: json.numero,
          tipo: json.tipo,
          cae: json.cae,
          vencimientoCAE: json.vencimientoCAE,
          qrBase64: json.qrBase64,
          error: json.afipError,
          pendienteCae: json.estado === "pendiente_cae",
        })
        if (json.afipOk) {
          toast({ title: "Pedido facturado", description: `CAE ${json.cae}` })
        } else if (json.estado === "pendiente_cae") {
          toast({ title: "Factura pendiente de CAE", variant: "destructive" })
        }
      } else {
        setSuccess(`Acción '${action}' ejecutada correctamente.`)
      }
      await cargarPedidos()
    } catch (err: any) {
      setError(err?.message || "Error al ejecutar acción")
    }
  }

  return (
    <PageShell>
      <PageHeader
        variant="surface"
        title="Pedidos de Venta"
        description="Control de pedidos, picking, remito y facturación."
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Ciclo de ventas
          </span>
        }
        actions={
          <Button variant="outline" size="sm" onClick={cargarPedidos}>
            <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
          </Button>
        }
      />

      {ultimaFactura && (
        <FiscalEmissionResult
          data={ultimaFactura}
          title="Última factura desde pedido"
          onRetry={ultimaFactura.pendienteCae ? reintentarCae : undefined}
          retrying={reintentando}
        />
      )}

      {(error || success) && (
        <Alert variant={error ? "destructive" : undefined}>
          <AlertDescription>{error || success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Filtrar estado:</span>
              <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                <SelectTrigger className="min-w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="en_picking">En picking</SelectItem>
                  <SelectItem value="remitido">Remitido</SelectItem>
                  <SelectItem value="facturado">Facturado</SelectItem>
                  <SelectItem value="anulado">Anulado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {pedidos.length} pedido(s) cargado(s)
            </div>
          </div>

          <DataTable
            data={pedidos}
            rowKey="id"
            searchPlaceholder="Buscar pedido o estado..."
            searchKeys={["numero", "estado"]}
            loading={loading}
            columns={[
              { key: "numero", header: "Pedido", sortable: true, cell: (pedido) => <span className="font-mono">{pedido.numero}</span> },
              { key: "cliente", header: "Cliente", cell: (pedido) => pedido.cliente?.nombre ?? "—" },
              {
                key: "estado",
                header: "Estado",
                cell: (pedido) => (
                  <StatusBadge
                    variant={pedidoEstadoVariant(pedido.estado)}
                    label={pedidoEstadoLabel(pedido.estado)}
                  />
                ),
              },
              { key: "total", header: "Total", align: "right", sortable: true, cell: (pedido) => <span>${pedido.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span> },
              { key: "lineas", header: "Líneas", align: "right", cell: (pedido) => pedido.lineas.length },
              { key: "remitos", header: "Remitos", align: "right", cell: (pedido) => pedido.remitos.length },
              { key: "createdAt", header: "Fecha", sortable: true, cell: (pedido) => new Date(pedido.createdAt).toLocaleDateString("es-AR") },
              {
                key: "acciones",
                header: "Acciones",
                cell: (pedido) => {
                  const actions = [] as Array<{ label: string; action: string; icon: any }>
                  if (pedido.estado === "borrador") actions.push({ label: "Confirmar", action: "confirmar", icon: <CheckCircle2 className="h-4 w-4" /> })
                  if (pedido.estado === "confirmado") {
                    actions.push({ label: "Picking", action: "picking", icon: <Package className="h-4 w-4" /> })
                    actions.push({ label: "Facturar", action: "facturar", icon: <FileText className="h-4 w-4" /> })
                  }
                  if (pedido.estado === "en_picking") actions.push({ label: "Remito", action: "remito", icon: <Truck className="h-4 w-4" /> })
                  if (pedido.estado === "remitido") actions.push({ label: "Facturar", action: "facturar", icon: <FileText className="h-4 w-4" /> })
                  actions.push({ label: "Clonar", action: "clonar", icon: <Copy className="h-4 w-4" /> })
                  return (
                    <div className="flex flex-wrap gap-2">
                      {actions.map((item) => (
                        <Button key={item.action} size="sm" variant="outline" onClick={() => ejecutarAccion(item.action, pedido.id)}>
                          {item.icon}
                          <span>{item.label}</span>
                        </Button>
                      ))}
                    </div>
                  )
                },
              },
            ]}
            exportFilename="pedidos-venta"
            compact
          />
        </CardContent>
      </Card>
    </PageShell>
  )
}
