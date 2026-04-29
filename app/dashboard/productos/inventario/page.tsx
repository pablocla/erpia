"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"
import { Search, RefreshCw, Package, AlertTriangle, Warehouse, DollarSign } from "lucide-react"

interface Deposito {
  id: number
  nombre: string
  totalProductos: number
  stockTotal: number
}

interface InventarioItem {
  id: number
  codigo: string
  nombre: string
  unidadMedida?: string
  categoria?: { id: number; nombre: string }
  stock: number
  stockMinimo: number
  precioCosto?: number
  precioVenta: number
  stockDepositos?: Array<{ cantidad: number; deposito: { id: number; nombre: string } }>
}

interface StockResponse {
  success: boolean
  items: InventarioItem[]
  resumen: {
    totalProductos: number
    stockTotal: number
    alertasStockBajo: number
  }
}

export default function InventarioPage() {
  const [depositos, setDepositos] = useState<Deposito[]>([])
  const [depositoId, setDepositoId] = useState<string>("")
  const [items, setItems] = useState<InventarioItem[]>([])
  const [search, setSearch] = useState("")
  const [stockBajo, setStockBajo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [resumen, setResumen] = useState<StockResponse["resumen"] | null>(null)

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const cargarDepositos = useCallback(async () => {
    try {
      const res = await fetch("/api/stock/depositos", { headers: authHeaders() })
      const data = await res.json()
      if (data.success) setDepositos(data.depositos ?? [])
    } catch {
      setDepositos([])
    }
  }, [authHeaders])

  const cargarInventario = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (depositoId) params.set("depositoId", depositoId)
      if (stockBajo) params.set("stockBajo", "true")
      if (search) params.set("search", search)
      const res = await fetch(`/api/stock?${params.toString()}`, { headers: authHeaders() })
      const data = await res.json()
      if (data.success) {
        setItems(data.items ?? [])
        setResumen(data.resumen ?? null)
      }
    } catch {
      setItems([])
      setResumen(null)
    } finally {
      setLoading(false)
    }
  }, [authHeaders, depositoId, search, stockBajo])

  useEffect(() => {
    cargarDepositos()
    cargarInventario()
  }, [cargarDepositos, cargarInventario])

  const valorInventario = useMemo(() => {
    return items.reduce((sum, item) => {
      const costo = item.precioCosto ?? item.precioVenta ?? 0
      return sum + costo * item.stock
    }, 0)
  }, [items])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventario</h1>
          <p className="text-muted-foreground">Visión general de stock, inventario y alertas por depósito.</p>
        </div>
        <Button variant="outline" onClick={cargarInventario}>
          <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs uppercase tracking-[0.12em]">Productos</p>
                <p className="text-lg font-semibold">{resumen?.totalProductos ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Warehouse className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs uppercase tracking-[0.12em]">Stock total</p>
                <p className="text-lg font-semibold">{resumen?.stockTotal ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-xs uppercase tracking-[0.12em]">Alertas stock bajo</p>
                <p className="text-lg font-semibold">{resumen?.alertasStockBajo ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <DollarSign className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-xs uppercase tracking-[0.12em]">Valor inventario</p>
                <p className="text-lg font-semibold">${valorInventario.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filtros de inventario</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 min-w-0">
            <label className="mb-1 block text-sm font-medium">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" placeholder="Código o nombre" />
            </div>
          </div>
          <div className="w-full sm:w-64">
            <label className="mb-1 block text-sm font-medium">Depósito</label>
            <Select value={depositoId || ""} onValueChange={(v) => setDepositoId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {depositos.map((dep) => (
                  <SelectItem key={dep.id} value={String(dep.id)}>{dep.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant={stockBajo ? "default" : "outline"} onClick={() => setStockBajo(!stockBajo)} className="w-full sm:w-auto">
            Stock Bajo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <DataTable<InventarioItem>
            data={items}
            columns={[
              { key: "codigo", header: "Código", sortable: true, cell: (item) => <span className="font-mono text-sm">{item.codigo}</span> },
              { key: "nombre", header: "Nombre", sortable: true, cell: (item) => <div><p className="font-medium">{item.nombre}</p><p className="text-xs text-muted-foreground">{item.categoria?.nombre ?? "Sin categoría"}</p></div> },
              { key: "stock", header: "Stock", align: "right", sortable: true, cell: (item) => <span className={item.stock <= item.stockMinimo ? "text-red-600 font-bold" : ""}>{item.stock} {item.unidadMedida ?? "uds"}</span> },
              { key: "stockMinimo", header: "Mínimo", align: "right", cell: (item) => item.stockMinimo },
              { key: "precioCosto", header: "Costo u.", align: "right", cell: (item) => `$${(item.precioCosto ?? 0).toFixed(2)}` },
              { key: "valorInventario", header: "Valor inventario", align: "right", cell: (item) => `$${((item.precioCosto ?? 0) * item.stock).toFixed(2)}` },
              { key: "stockDepositos", header: "Por depósito", cell: (item) => (
                <div className="flex flex-wrap gap-1">
                  {item.stockDepositos?.map((sd) => (
                    <Badge key={`${item.id}-${sd.deposito.id}`} variant="secondary" className="text-[10px]">
                      {sd.deposito.nombre}: {sd.cantidad}
                    </Badge>
                  ))}
                </div>
              ) },
            ] as DataTableColumn<InventarioItem>[]}
            rowKey="id"
            searchPlaceholder="Buscar inventario..."
            searchKeys={["codigo", "nombre"]}
            loading={loading}
            emptyMessage="No se encontró inventario"
            emptyIcon={<EmptyStateIllustration type="generico" compact title="Sin resultados" description="Ajusta los filtros para ver productos." />}
            defaultPageSize={25}
            compact
          />
        </CardContent>
      </Card>
    </div>
  )
}
