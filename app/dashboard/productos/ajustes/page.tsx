"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"
import { RefreshCw, Wrench, AlertTriangle } from "lucide-react"

interface Producto {
  id: number
  codigo: string
  nombre: string
}

interface Movimiento {
  id: number
  tipo: string
  cantidad: number
  motivo: string | null
  createdAt: string
  producto: { id: number; nombre: string; codigo: string }
  deposito: { id: number; nombre: string } | null
}

export default function AjustesStockPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ productoId: "", cantidad: "", motivo: "" })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, mRes] = await Promise.all([
        fetch("/api/productos?soloActivos=false", { headers: authHeaders() }),
        fetch("/api/stock/movimientos?limit=20", { headers: authHeaders() }),
      ])

      const [pData, mData] = await Promise.all([pRes.json(), mRes.json()])
      setProductos(Array.isArray(pData) ? pData : [])
      if (mData.success) setMovimientos(mData.movimientos || [])
    } catch {
      setProductos([])
      setMovimientos([])
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  const handleSubmit = async () => {
    setError("")
    setSuccess("")
    const cantidad = Number(form.cantidad)
    if (!form.productoId || !form.motivo || Number.isNaN(cantidad)) {
      setError("Completa producto, cantidad y motivo")
      return
    }

    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          productoId: Number(form.productoId),
          cantidad,
          motivo: form.motivo,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error al ajustar stock")
        return
      }
      setSuccess(data.mensaje || "Ajuste realizado")
      setForm({ productoId: "", cantidad: "", motivo: "" })
      cargarDatos()
    } catch {
      setError("Error de conexión")
    }
  }

  const productoMap = Object.fromEntries(productos.map((p) => [p.id, p]))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ajustes de Stock</h1>
          <p className="text-muted-foreground">Registra ajustes manuales y revisa los últimos movimientos de stock.</p>
        </div>
        <Button variant="outline" onClick={cargarDatos}>
          <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuevo ajuste</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Producto</label>
            <Select value={form.productoId} onValueChange={(v) => setForm((prev) => ({ ...prev, productoId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná producto" />
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
            <label className="block text-sm font-medium">Cantidad</label>
            <Input value={form.cantidad} onChange={(e) => setForm((prev) => ({ ...prev, cantidad: e.target.value }))} type="number" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Motivo</label>
            <Input value={form.motivo} onChange={(e) => setForm((prev) => ({ ...prev, motivo: e.target.value }))} placeholder="Ej: ajuste de inventario" />
          </div>

          {error && <p className="text-sm text-destructive md:col-span-3">{error}</p>}
          {success && <p className="text-sm text-emerald-600 md:col-span-3">{success}</p>}

          <div className="md:col-span-3 flex justify-end">
            <Button onClick={handleSubmit}>Registrar ajuste</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos movimientos de stock</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<Movimiento>
            data={movimientos}
            columns={[
              { key: "createdAt", header: "Fecha", sortable: true, cell: (m) => new Date(m.createdAt).toLocaleString("es-AR") },
              { key: "producto", header: "Producto", cell: (m) => `${m.producto.codigo} — ${m.producto.nombre}` },
              { key: "tipo", header: "Tipo", cell: (m) => m.tipo },
              { key: "cantidad", header: "Cantidad", align: "right", cell: (m) => <span className={m.cantidad < 0 ? "text-red-600" : "text-green-600"}>{m.cantidad}</span> },
              { key: "motivo", header: "Motivo", cell: (m) => m.motivo ?? "-" },
              { key: "deposito", header: "Depósito", cell: (m) => m.deposito?.nombre ?? "Sistema" },
            ] as DataTableColumn<Movimiento>[]}
            rowKey="id"
            loading={loading}
            emptyMessage="No hay movimientos recientes"
            emptyIcon={<EmptyStateIllustration type="generico" compact title="Sin movimientos" description="Realizá un ajuste para registrar el primer movimiento." />}
            defaultPageSize={10}
            compact
          />
        </CardContent>
      </Card>
    </div>
  )
}
