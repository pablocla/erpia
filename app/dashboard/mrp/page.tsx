"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Factory, Package, ShoppingCart, Play, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Clock,
} from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"

interface Sugerencia {
  id: number
  productoId: number
  tipo: string
  cantidad: number
  fechaNecesidad: string
  prioridad: string
  estado: string
  razon: string | null
}

interface Corrida {
  id: number
  horizonte: number
  estado: string
  totalSugerencias: number
  createdAt: string
  sugerencias: Sugerencia[]
}

const PRIORIDAD_BADGE: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  critica: "destructive",
  alta: "default",
  normal: "secondary",
  baja: "outline",
}

const TIPO_ICONS: Record<string, React.ElementType> = {
  comprar: ShoppingCart,
  producir: Factory,
  transferir: Package,
}

export default function MRPPage() {
  const [corrida, setCorrida] = useState<Corrida | null>(null)
  const [loading, setLoading] = useState(true)
  const [ejecutando, setEjecutando] = useState(false)

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }

  const fetchCorrida = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/mrp", { headers })
      const data = await res.json()
      if (data.success) setCorrida(data.data)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCorrida() }, [fetchCorrida])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: fetchCorrida,
  }))

  const ejecutarMRP = async () => {
    setEjecutando(true)
    try {
      await fetch("/api/mrp", { method: "POST", headers, body: JSON.stringify({ horizonte: 30 }) })
      await fetchCorrida()
    } catch {}
    finally { setEjecutando(false) }
  }

  const procesarSugerencia = async (sugerenciaId: number, accion: "aceptar" | "rechazar") => {
    await fetch("/api/mrp", {
      method: "POST",
      headers,
      body: JSON.stringify({ sugerenciaId, accion }),
    })
    fetchCorrida()
  }

  const pendientes = corrida?.sugerencias.filter(s => s.estado === "pendiente") ?? []
  const criticas = pendientes.filter(s => s.prioridad === "critica")
  const altas = pendientes.filter(s => s.prioridad === "alta")

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Factory className="h-7 w-7 text-primary" />
            MRP — Planificación de Necesidades
          </h1>
          <p className="text-sm text-muted-foreground">Material Requirements Planning — qué comprar y producir</p>
        </div>
        <Button onClick={ejecutarMRP} disabled={ejecutando}>
          <Play className={`h-4 w-4 mr-1 ${ejecutando ? "animate-spin" : ""}`} />
          Ejecutar MRP
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Última corrida</p>
          <p className="text-sm font-medium mt-1">
            {corrida ? new Date(corrida.createdAt).toLocaleDateString("es-AR") : "—"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Sugerencias pendientes</p>
          <p className="text-2xl font-bold">{pendientes.length}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <p className="text-xs text-muted-foreground">Críticas</p>
          <p className="text-2xl font-bold text-red-600">{criticas.length}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-xs text-muted-foreground">Alta prioridad</p>
          <p className="text-2xl font-bold text-amber-600">{altas.length}</p>
        </Card>
      </div>

      {/* Sugerencias */}
      {corrida && pendientes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sugerencias de reabastecimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable<Sugerencia>
              data={pendientes}
              columns={[
                { key: "tipo", header: "Tipo", sortable: true, cell: (s) => { const TipoIcon = TIPO_ICONS[s.tipo] ?? Package; return <div className="flex items-center gap-1.5"><TipoIcon className="h-4 w-4 text-muted-foreground" /><span className="capitalize">{s.tipo}</span></div> } },
                { key: "productoId", header: "Producto ID", sortable: true, cell: (s) => <span className="font-mono">{s.productoId}</span> },
                { key: "cantidad", header: "Cantidad", sortable: true, cell: (s) => <span className="text-right block font-medium">{s.cantidad}</span> },
                { key: "fechaNecesidad", header: "Necesidad", sortable: true, cell: (s) => new Date(s.fechaNecesidad).toLocaleDateString("es-AR") },
                { key: "prioridad", header: "Prioridad", sortable: true, cell: (s) => <Badge variant={PRIORIDAD_BADGE[s.prioridad]}>{s.prioridad}</Badge> },
                { key: "razon", header: "Razón", cell: (s) => <span className="max-w-[200px] truncate text-xs text-muted-foreground block">{s.razon}</span> },
                { key: "acciones" as any, header: "Acciones", cell: (s) => <div className="flex gap-1 justify-end"><Button size="sm" variant="outline" className="h-7 px-2" onClick={(e) => { e.stopPropagation(); procesarSugerencia(s.id, "aceptar") }}><CheckCircle className="h-3.5 w-3.5 text-green-500" /></Button><Button size="sm" variant="outline" className="h-7 px-2" onClick={(e) => { e.stopPropagation(); procesarSugerencia(s.id, "rechazar") }}><XCircle className="h-3.5 w-3.5 text-red-500" /></Button></div> },
              ] as DataTableColumn<Sugerencia>[]}
              rowKey="id"
              searchPlaceholder="Buscar sugerencia..."
              searchKeys={["tipo", "prioridad"]}
              exportFilename="mrp-sugerencias"
              emptyMessage="Sin sugerencias pendientes"
              compact
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="p-8 text-center text-muted-foreground">
          {corrida
            ? <><CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Sin sugerencias pendientes</p></>
            : <><Factory className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Ejecutá una corrida MRP para generar sugerencias</p></>
          }
        </Card>
      )}
    </div>
  )
}
