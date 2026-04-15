"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs"
import {
  DollarSign, Calculator, BarChart3, AlertTriangle, RefreshCw,
  Plus, CheckCircle,
} from "lucide-react"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { DataTable, type DataTableColumn } from "@/components/data-table"

interface LineaPresupuesto {
  id: number
  mes: number
  cuentaContableId: number | null
  centroCostoId: number | null
  presupuestado: number
  ejecutado: number
  comprometido: number
  totalUsado: number
  disponible: number
  desvio: number
  porcentaje: number
  nivel: string
}

interface ReporteData {
  presupuesto: { id: number; nombre: string; ejercicio: number; estado: string }
  lineas: LineaPresupuesto[]
  totales: { presupuestado: number; ejecutado: number; comprometido: number; disponible: number }
}

function formatARS(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
}

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

const NIVEL_COLORS: Record<string, string> = {
  verde: "text-green-600",
  amarillo: "text-amber-600",
  rojo: "text-red-600 font-bold",
}

export default function PresupuestoPage() {
  const [reporte, setReporte] = useState<ReporteData | null>(null)
  const [ejercicio, setEjercicio] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [creando, setCreando] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState("")

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }

  const fetchReporte = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/presupuesto?ejercicio=${ejercicio}`, { headers })
      const data = await res.json()
      if (data.success) setReporte(data.data)
    } catch {}
    finally { setLoading(false) }
  }, [ejercicio])

  useEffect(() => { fetchReporte() }, [fetchReporte])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: fetchReporte,
  }))

  const crearPresupuesto = async () => {
    if (!nuevoNombre.trim()) return
    setCreando(true)
    try {
      await fetch("/api/presupuesto", {
        method: "POST",
        headers,
        body: JSON.stringify({ nombre: nuevoNombre, ejercicio }),
      })
      setNuevoNombre("")
      fetchReporte()
    } catch {}
    finally { setCreando(false) }
  }

  const porcentajeGlobal = reporte?.totales
    ? reporte.totales.presupuestado > 0
      ? Math.round(((reporte.totales.ejecutado + reporte.totales.comprometido) / reporte.totales.presupuestado) * 100)
      : 0
    : 0

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-7 w-7 text-primary" />
            Control Presupuestario
          </h1>
          <p className="text-sm text-muted-foreground">Presupuesto vs Ejecutado vs Comprometido</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={ejercicio}
            onChange={(e) => setEjercicio(Number(e.target.value))}
            className="w-24 h-9 text-sm"
          />
          <Button variant="outline" size="sm" onClick={fetchReporte} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {!reporte && (
        <Card className="p-8 text-center">
          <Calculator className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground mb-4">No hay presupuesto vigente para {ejercicio}</p>
          <div className="flex items-center gap-2 justify-center max-w-sm mx-auto">
            <Input
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder={`Presupuesto Operativo ${ejercicio}`}
              className="h-9 text-sm"
            />
            <Button size="sm" onClick={crearPresupuesto} disabled={creando || !nuevoNombre.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Crear
            </Button>
          </div>
        </Card>
      )}

      {reporte && (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Presupuestado</p>
              <p className="text-xl font-bold">{formatARS(reporte.totales.presupuestado)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Ejecutado</p>
              <p className="text-xl font-bold text-blue-600">{formatARS(reporte.totales.ejecutado)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Comprometido</p>
              <p className="text-xl font-bold text-amber-600">{formatARS(reporte.totales.comprometido)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Disponible</p>
              <p className="text-xl font-bold text-green-600">{formatARS(reporte.totales.disponible)}</p>
            </Card>
            <Card className={`p-4 border-l-4 ${porcentajeGlobal >= 100 ? "border-l-red-500" : porcentajeGlobal >= 80 ? "border-l-amber-500" : "border-l-green-500"}`}>
              <p className="text-xs text-muted-foreground">Ejecución</p>
              <p className="text-xl font-bold">{porcentajeGlobal}%</p>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${porcentajeGlobal >= 100 ? "bg-red-500" : porcentajeGlobal >= 80 ? "bg-amber-500" : "bg-green-500"}`}
                  style={{ width: `${Math.min(porcentajeGlobal, 100)}%` }}
                />
              </div>
            </Card>
          </div>

          {/* Detalle por mes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{reporte.presupuesto.nombre}</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable<LineaPresupuesto>
                data={reporte.lineas}
                columns={[
                  { key: "mes", header: "Mes", sortable: true, cell: (l) => <span className="font-medium">{MESES[l.mes - 1]}</span> },
                  { key: "presupuestado", header: "Presupuestado", sortable: true, cell: (l) => <span className="text-right block">{formatARS(l.presupuestado)}</span> },
                  { key: "ejecutado", header: "Ejecutado", sortable: true, cell: (l) => <span className="text-right block">{formatARS(l.ejecutado)}</span> },
                  { key: "comprometido", header: "Comprometido", cell: (l) => <span className="text-right block">{formatARS(l.comprometido)}</span> },
                  { key: "disponible", header: "Disponible", sortable: true, cell: (l) => <span className="text-right block">{formatARS(l.disponible)}</span> },
                  { key: "porcentaje", header: "%", sortable: true, cell: (l) => <span className={`text-right block ${NIVEL_COLORS[l.nivel]}`}>{l.porcentaje}%</span> },
                  { key: "nivel", header: "Estado", cell: (l) => <>{l.nivel === "rojo" && <AlertTriangle className="h-4 w-4 text-red-500" />}{l.nivel === "amarillo" && <AlertTriangle className="h-4 w-4 text-amber-500" />}{l.nivel === "verde" && <CheckCircle className="h-4 w-4 text-green-500" />}</> },
                ] as DataTableColumn<LineaPresupuesto>[]}
                rowKey="id"
                exportFilename="presupuesto-detalle"
                emptyMessage="Sin líneas de presupuesto"
                compact
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
