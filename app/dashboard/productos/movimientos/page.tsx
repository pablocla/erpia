"use client"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Search, TrendingUp, TrendingDown, Loader2, Package } from "lucide-react"

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

  const filtrados = movimientos.filter(m =>
    m.producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.producto.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    (m.motivo ?? "").toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-6 w-6 text-blue-500" />
        <div><h1 className="text-2xl font-bold">Movimientos de Stock</h1><p className="text-sm text-muted-foreground">Historial de entradas, salidas y ajustes de inventario</p></div>
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
            <div className="flex items-center gap-2">
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="h-9 w-36 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="salida">Salida</SelectItem>
                  <SelectItem value="ajuste">Ajuste</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar producto..." className="pl-9 h-9 w-48 text-sm" value={busqueda} onChange={e => setBusqueda(e.target.value)} /></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-t"><tr>
                <th className="text-left p-3 font-medium">Fecha</th>
                <th className="text-left p-3 font-medium">Producto</th>
                <th className="text-left p-3 font-medium">Tipo</th>
                <th className="text-left p-3 font-medium">Motivo</th>
                <th className="text-right p-3 font-medium">Cantidad</th>
                <th className="text-right p-3 font-medium">Stock actual</th>
              </tr></thead>
              <tbody>{filtrados.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Sin movimientos registrados</td></tr>
              ) : filtrados.map(m => {
                const conf = TIPO_CONFIG[m.tipo] ?? { color: "", badge: "secondary" as const }
                return (
                  <tr key={m.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-muted-foreground text-xs">{new Date(m.createdAt).toLocaleDateString("es-AR")}</td>
                    <td className="p-3"><span className="font-medium">{m.producto.nombre}</span><span className="text-xs text-muted-foreground ml-2">{m.producto.codigo}</span></td>
                    <td className="p-3"><Badge variant={conf.badge} className="text-xs capitalize">{m.tipo.replace("_", " ")}</Badge></td>
                    <td className="p-3 text-xs text-muted-foreground">{m.motivo ?? "—"}</td>
                    <td className={`p-3 text-right font-bold tabular-nums ${conf.color}`}>{m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}</td>
                    <td className="p-3 text-right font-bold tabular-nums">{m.producto.stock}</td>
                  </tr>
                )
              })}</tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
