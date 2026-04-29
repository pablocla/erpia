"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, RefreshCw, Package, SwapHorizontal, Truck } from "lucide-react"

interface Deposito {
  id: number
  nombre: string
  stockTotal: number
  totalProductos: number
}

interface Producto {
  id: number
  codigo: string
  nombre: string
}

interface Transferencia {
  id: number
  productoId: number
  depositoOrigenId: number
  depositoDestinoId: number
  cantidad: number
  observaciones?: string
  createdAt: string
}

export default function TransferenciasStockPage() {
  const [depositos, setDepositos] = useState<Deposito[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [transferencias, setTransferencias] = useState<Transferencia[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    productoId: "",
    depositoOrigenId: "",
    depositoDestinoId: "",
    cantidad: "",
    observaciones: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    try {
      const [dRes, pRes, tRes] = await Promise.all([
        fetch("/api/stock/depositos", { headers: authHeaders() }),
        fetch("/api/productos?soloActivos=false", { headers: authHeaders() }),
        fetch("/api/stock/transferencia-deposito", { headers: authHeaders() }),
      ])

      const [dData, pData, tData] = await Promise.all([dRes.json(), pRes.json(), tRes.json()])
      if (dData.success) setDepositos(dData.depositos || [])
      setProductos(Array.isArray(pData) ? pData : [])
      if (tData.success) setTransferencias(tData.transferencias || [])
    } catch {
      setDepositos([])
      setProductos([])
      setTransferencias([])
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  const handleSubmit = async () => {
    setError("")
    setSuccess("")
    const cantidad = Number(form.cantidad)
    if (!form.productoId || !form.depositoOrigenId || !form.depositoDestinoId || !cantidad) {
      setError("Completa producto, origen, destino y cantidad")
      return
    }
    if (form.depositoOrigenId === form.depositoDestinoId) {
      setError("Origen y destino no pueden ser iguales")
      return
    }

    try {
      const res = await fetch("/api/stock/transferencia-deposito", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          productoId: Number(form.productoId),
          depositoOrigenId: Number(form.depositoOrigenId),
          depositoDestinoId: Number(form.depositoDestinoId),
          cantidad,
          observaciones: form.observaciones,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error al transferir stock")
        return
      }
      setSuccess("Transferencia registrada correctamente")
      setForm({ productoId: "", depositoOrigenId: "", depositoDestinoId: "", cantidad: "", observaciones: "" })
      cargarDatos()
    } catch {
      setError("Error de conexión al crear transferencia")
    }
  }

  const productoMap = Object.fromEntries(productos.map((p) => [p.id, p]))
  const depositoMap = Object.fromEntries(depositos.map((d) => [d.id, d]))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transferencias de Stock</h1>
          <p className="text-muted-foreground">Mueve productos entre depósitos y registra movimientos automáticos.</p>
        </div>
        <Button variant="outline" onClick={cargarDatos}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refrescar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nueva transferencia</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Producto</label>
            <Select value={form.productoId} onValueChange={(v) => setForm((prev) => ({ ...prev, productoId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná un producto" />
              </SelectTrigger>
              <SelectContent>
                {productos.map((producto) => (
                  <SelectItem key={producto.id} value={String(producto.id)}>
                    {producto.codigo} — {producto.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Depósito Origen</label>
            <Select value={form.depositoOrigenId} onValueChange={(v) => setForm((prev) => ({ ...prev, depositoOrigenId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Origen" />
              </SelectTrigger>
              <SelectContent>
                {depositos.map((dep) => (
                  <SelectItem key={dep.id} value={String(dep.id)}>{dep.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Depósito Destino</label>
            <Select value={form.depositoDestinoId} onValueChange={(v) => setForm((prev) => ({ ...prev, depositoDestinoId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Destino" />
              </SelectTrigger>
              <SelectContent>
                {depositos.map((dep) => (
                  <SelectItem key={dep.id} value={String(dep.id)}>{dep.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Cantidad</label>
            <Input value={form.cantidad} onChange={(e) => setForm((prev) => ({ ...prev, cantidad: e.target.value }))} type="number" min="1" />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-medium">Observaciones</label>
            <Input value={form.observaciones} onChange={(e) => setForm((prev) => ({ ...prev, observaciones: e.target.value }))} placeholder="Ej: Traslado a sucursal" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}

          <div className="md:col-span-2 flex justify-end">
            <Button onClick={handleSubmit}>Registrar transferencia</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de transferencias</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<Transferencia>
            data={transferencias}
            columns={[
              { key: "id", header: "ID", sortable: true },
              { key: "producto", header: "Producto", cell: (t) => productoMap[t.productoId] ? `${productoMap[t.productoId].codigo} — ${productoMap[t.productoId].nombre}` : "-" },
              { key: "origen", header: "Origen", cell: (t) => depositoMap[t.depositoOrigenId]?.nombre ?? "-" },
              { key: "destino", header: "Destino", cell: (t) => depositoMap[t.depositoDestinoId]?.nombre ?? "-" },
              { key: "cantidad", header: "Cantidad", align: "right", cell: (t) => t.cantidad },
              { key: "observaciones", header: "Observaciones", cell: (t) => t.observaciones || "-" },
              { key: "createdAt", header: "Fecha", cell: (t) => new Date(t.createdAt).toLocaleString("es-AR") },
            ] as DataTableColumn<Transferencia>[]}
            rowKey="id"
            loading={loading}
            emptyMessage="No hay transferencias registradas"
            emptyIcon={<EmptyStateIllustration type="generico" compact title="Sin transferencias" description="Creá una transferencia para mover stock entre depósitos." />}
            defaultPageSize={10}
            compact
          />
        </CardContent>
      </Card>
    </div>
  )
}
