"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DataTable } from "@/components/data-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Package, Truck, FileText, RefreshCw } from "lucide-react"

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

const ESTADO_COLOR: Record<string, string> = {
  borrador: "bg-gray-500",
  confirmado: "bg-blue-600",
  en_picking: "bg-indigo-600",
  remitido: "bg-teal-600",
  facturado: "bg-emerald-600",
  anulado: "bg-red-600",
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [estadoFiltro, setEstadoFiltro] = useState("todos")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    cargarPedidos()
  }, [estadoFiltro])

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
      setSuccess(`Acción '${action}' ejecutada correctamente.`)
      await cargarPedidos()
    } catch (err: any) {
      setError(err?.message || "Error al ejecutar acción")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pedidos de Venta</h1>
          <p className="text-muted-foreground">Control de pedidos, picking, remito y facturación.</p>
        </div>
        <Button variant="outline" size="sm" onClick={cargarPedidos}>
          <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
        </Button>
      </div>

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
              { key: "estado", header: "Estado", cell: (pedido) => <Badge className={ESTADO_COLOR[pedido.estado] ?? "bg-slate-500"}>{pedido.estado}</Badge> },
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
                  if (pedido.estado === "confirmado") actions.push({ label: "Picking", action: "picking", icon: <Package className="h-4 w-4" /> })
                  if (pedido.estado === "en_picking") actions.push({ label: "Remito", action: "remito", icon: <Truck className="h-4 w-4" /> })
                  if (pedido.estado === "remitido") actions.push({ label: "Facturar", action: "facturar", icon: <FileText className="h-4 w-4" /> })
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
    </div>
  )
}
