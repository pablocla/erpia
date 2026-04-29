"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Search, TrendingUp, TrendingDown, Loader2, Package } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"
import { DateRangePicker } from "@/components/date-range-picker"
import { type DateRange } from "react-day-picker"

interface Movimiento {
  id: number
  tipo: string
  cantidad: number
  motivo: string | null
  createdAt: string
  producto: { id: number; nombre: string; codigo: string; stock: number }
  deposito: { id: number; nombre: string } | null
}

interface Resumen {
  total: number
  porTipo: Record<string, { cantidad: number; unidades: number }>
}

const TIPO_CONFIG: Record<string, { color: string; badge: "default" | "destructive" | "secondary" | "outline" }> = {
  entrada: { color: "text-green-600", badge: "default" },
  salida: { color: "text-red-600", badge: "destructive" },
  ajuste: { color: "text-amber-600", badge: "secondary" },
  transferencia_salida: { color: "text-orange-600", badge: "outline" },
  transferencia_entrada: { color: "text-blue-600", badge: "outline" },
}

export default function MovimientosStockPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroTipo !== "todos") params.set("tipo", filtroTipo)
      const res = await fetch(`/api/productos/movimientos?${params}`)
      const data = await res.json()
      if (data.success) {
        setMovimientos(data.movimientos ?? [])
        setResumen(data.resumen ?? null)
      }
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [filtroTipo])

  useEffect(() => { cargar() }, [cargar])

  const filtrados = useMemo(() => {
    let result = movimientos.filter(m =>
      m.producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.producto.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (m.motivo ?? "").toLowerCase().includes(busqueda.toLowerCase())
    )
    if (dateRange?.from) {
      result = result.filter((m) => {
        const d = new Date(m.createdAt)
        if (dateRange.from && d < dateRange.from) return false
        if (dateRange.to) {
          const end = new Date(dateRange.to)
          end.setHours(23, 59, 59, 999)
          if (d > end) return false
        }
        return true
      })
    }
    return result
  }, [movimientos, busqueda, dateRange])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 text-blue-500" />
          <div><h1 className="text-2xl font-bold">Movimientos de Stock</h1><p className="text-sm text-muted-foreground">Historial de entradas, salidas y ajustes de inventario</p></div>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPIs */}
      {resumen && (
        <div className="grid grid-cols-5 gap-3">
          <Card className="dashboard-surface"><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Total movimientos</p>
            <p className="text-lg font-bold">{resumen.total}</p>
          </CardContent></Card>
          {Object.entries(resumen.porTipo).map(([tipo, data]) => (
            <Card key={tipo} className="dashboard-surface"><CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground capitalize">{tipo.replace("_", " ")}</p>
              <p className={`text-lg font-bold ${TIPO_CONFIG[tipo]?.color ?? ""}`}>{data.cantidad}</p>
              <p className="text-[10px] text-muted-foreground">{Math.abs(data.unidades).toLocaleString("es-AR")} uds</p>
            </CardContent></Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Movimientos</CardTitle>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="h-9 w-36 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="salida">Salida</SelectItem>
                <SelectItem value="ajuste">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <DataTable<Movimiento>
            data={filtrados}
            columns={[
              { key: "createdAt", header: "Fecha", sortable: true, cell: (m) => <span className="text-muted-foreground text-xs">{new Date(m.createdAt).toLocaleDateString("es-AR")}</span> },
              { key: "productoNombre", header: "Producto", cell: (m) => <><span className="font-medium">{m.producto.nombre}</span><span className="text-xs text-muted-foreground ml-2">{m.producto.codigo}</span></>, exportFn: (m) => m.producto.nombre },
              { key: "tipo", header: "Tipo", cell: (m) => { const conf = TIPO_CONFIG[m.tipo] ?? { color: "", badge: "secondary" as const }; return <Badge variant={conf.badge} className="text-xs capitalize">{m.tipo.replace("_", " ")}</Badge> } },
              { key: "motivo", header: "Motivo", cell: (m) => <span className="text-xs text-muted-foreground">{m.motivo ?? "—"}</span> },
              { key: "cantidad", header: "Cantidad", align: "right", sortable: true, cell: (m) => { const conf = TIPO_CONFIG[m.tipo] ?? { color: "" }; return <span className={`font-bold tabular-nums ${conf.color}`}>{m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}</span> } },
              { key: "productoStock", header: "Stock actual", align: "right", cell: (m) => <span className="font-bold tabular-nums">{m.producto.stock}</span>, exportFn: (m) => String(m.producto.stock) },
            ] as DataTableColumn<Movimiento>[]}
            rowKey="id"
            searchPlaceholder="Buscar producto..."
            searchKeys={["motivo"]}
            exportFilename="movimientos-stock"
            loading={loading}
            emptyMessage="Sin movimientos registrados"
            emptyIcon={<EmptyStateIllustration type="generico" compact title="Sin movimientos" description="Los movimientos se registran al operar con stock." />}
            defaultPageSize={25}
            compact
          />
        </CardContent>
      </Card>
    </div>
  )
}
