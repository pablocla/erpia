"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  ClipboardCheck, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, BarChart3, FileText,
} from "lucide-react"

interface Inspeccion {
  id: number
  entidad: string
  entidadId: number
  estado: string
  resultado: string | null
  observaciones: string | null
  inspectorId: number
  createdAt: string
}

interface MetricasCalidad {
  total: number
  aprobadas: number
  rechazadas: number
  conDesvio: number
  pendientes: number
  tasaAprobacion: number
}

const RESULTADO_BADGE: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  aprobada: "default",
  rechazada: "destructive",
  aprobada_con_desvio: "secondary",
}

export default function CalidadPage() {
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([])
  const [metricas, setMetricas] = useState<MetricasCalidad | null>(null)
  const [loading, setLoading] = useState(true)

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [iRes, mRes] = await Promise.all([
        fetch("/api/calidad?vista=lista", { headers }),
        fetch("/api/calidad?vista=metricas", { headers }),
      ])
      const [iData, mData] = await Promise.all([iRes.json(), mRes.json()])
      if (iData.success) setInspecciones(iData.data)
      if (mData.success) setMetricas(mData.data)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7 text-primary" />
            Control de Calidad
          </h1>
          <p className="text-sm text-muted-foreground">Inspecciones y métricas de calidad</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </Button>
      </div>

      {/* Métricas */}
      {metricas && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{metricas.total}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-green-500">
            <p className="text-xs text-muted-foreground">Aprobadas</p>
            <p className="text-2xl font-bold text-green-600">{metricas.aprobadas}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-red-500">
            <p className="text-xs text-muted-foreground">Rechazadas</p>
            <p className="text-2xl font-bold text-red-600">{metricas.rechazadas}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-amber-500">
            <p className="text-xs text-muted-foreground">Con desvío</p>
            <p className="text-2xl font-bold text-amber-600">{metricas.conDesvio}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Tasa aprobación</p>
            <p className="text-2xl font-bold">{metricas.tasaAprobacion}%</p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div className="h-2 rounded-full bg-green-500" style={{ width: `${metricas.tasaAprobacion}%` }} />
            </div>
          </Card>
        </div>
      )}

      {/* Listado inspecciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" /> Inspecciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inspecciones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Sin inspecciones registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Observaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspecciones.map(i => (
                  <TableRow key={i.id}>
                    <TableCell className="font-mono text-sm">{i.id}</TableCell>
                    <TableCell>{i.entidad} #{i.entidadId}</TableCell>
                    <TableCell>
                      <Badge variant={i.estado === "completada" ? "default" : "secondary"}>{i.estado}</Badge>
                    </TableCell>
                    <TableCell>
                      {i.resultado ? (
                        <Badge variant={RESULTADO_BADGE[i.resultado] ?? "outline"}>
                          {i.resultado === "aprobada" && <CheckCircle className="h-3 w-3 mr-1" />}
                          {i.resultado === "rechazada" && <XCircle className="h-3 w-3 mr-1" />}
                          {i.resultado === "aprobada_con_desvio" && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {i.resultado.replace(/_/g, " ")}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{new Date(i.createdAt).toLocaleDateString("es-AR")}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{i.observaciones ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
