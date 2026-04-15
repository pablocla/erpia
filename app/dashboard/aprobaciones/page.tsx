"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CheckCircle, XCircle, Clock, Shield, AlertTriangle,
  ChevronRight, RefreshCw, User, DollarSign,
} from "lucide-react"

interface Solicitud {
  id: number
  cadenaId: number
  entidad: string
  entidadId: number
  estado: string
  nivelActual: number
  solicitanteId: number
  monto: number
  descripcion: string | null
  createdAt: string
  pasos: Array<{
    id: number
    nivel: number
    aprobadorId: number | null
    accion: string
    comentario: string | null
    fechaAccion: string
  }>
}

const ENTIDAD_LABELS: Record<string, string> = {
  orden_compra: "Orden de Compra",
  orden_pago: "Orden de Pago",
  nota_credito: "Nota de Crédito",
  gasto: "Gasto",
  ajuste_stock: "Ajuste de Stock",
}

const ESTADO_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pendiente: "secondary",
  aprobado: "default",
  rechazado: "destructive",
  vencido: "outline",
}

function formatARS(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
}

export default function AprobacionesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState<number | null>(null)
  const [comentario, setComentario] = useState("")

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }

  const fetchSolicitudes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/aprobaciones", { headers })
      const data = await res.json()
      if (data.success) setSolicitudes(data.data)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchSolicitudes() }, [fetchSolicitudes])

  const procesar = async (solicitudId: number, accion: "aprobado" | "rechazado") => {
    setProcesando(solicitudId)
    try {
      await fetch("/api/aprobaciones", {
        method: "POST",
        headers,
        body: JSON.stringify({ solicitudId, accion, comentario }),
      })
      setComentario("")
      fetchSolicitudes()
    } catch {}
    finally { setProcesando(null) }
  }

  const pendientes = solicitudes.filter(s => s.estado === "pendiente")
  const procesadas = solicitudes.filter(s => s.estado !== "pendiente")

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            Aprobaciones
          </h1>
          <p className="text-sm text-muted-foreground">Solicitudes pendientes de autorización</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSolicitudes} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </Button>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Clock className="h-4 w-4" /> Pendientes</div>
          <p className="text-2xl font-bold mt-1">{pendientes.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><DollarSign className="h-4 w-4" /> Monto pendiente</div>
          <p className="text-2xl font-bold mt-1">{formatARS(pendientes.reduce((s, p) => s + p.monto, 0))}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-green-500 text-xs"><CheckCircle className="h-4 w-4" /> Aprobadas</div>
          <p className="text-2xl font-bold mt-1">{procesadas.filter(s => s.estado === "aprobado").length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-red-500 text-xs"><XCircle className="h-4 w-4" /> Rechazadas</div>
          <p className="text-2xl font-bold mt-1">{procesadas.filter(s => s.estado === "rechazado").length}</p>
        </Card>
      </div>

      {/* Solicitudes pendientes */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Pendientes de aprobación ({pendientes.length})
        </h2>

        {pendientes.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No hay solicitudes pendientes</p>
          </Card>
        )}

        <div className="space-y-3">
          {pendientes.map(sol => (
            <Card key={sol.id} className="p-4 border-l-4 border-l-amber-500">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">{ENTIDAD_LABELS[sol.entidad] ?? sol.entidad}</Badge>
                    <span className="text-sm text-muted-foreground">#{sol.entidadId}</span>
                    <Badge variant="outline" className="text-xs">Nivel {sol.nivelActual}</Badge>
                  </div>
                  <p className="text-lg font-bold">{formatARS(sol.monto)}</p>
                  {sol.descripcion && <p className="text-sm text-muted-foreground mt-1">{sol.descripcion}</p>}
                  <p className="text-xs text-muted-foreground mt-2">
                    Solicitado {new Date(sol.createdAt).toLocaleDateString("es-AR")} {new Date(sol.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </p>

                  {/* Timeline de pasos */}
                  {sol.pasos.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {sol.pasos.map(paso => (
                        <div key={paso.id} className="flex items-center gap-2 text-xs">
                          {paso.accion === "aprobado" ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                          <span>Nivel {paso.nivel}: {paso.accion}</span>
                          {paso.comentario && <span className="text-muted-foreground">— {paso.comentario}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <Textarea
                    placeholder="Comentario (opcional)..."
                    className="w-48 h-16 text-xs"
                    value={procesando === sol.id ? comentario : ""}
                    onChange={(e) => { setProcesando(sol.id); setComentario(e.target.value) }}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => procesar(sol.id, "aprobado")}
                      disabled={procesando === sol.id && procesando !== null}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => procesar(sol.id, "rechazado")}
                      disabled={procesando === sol.id && procesando !== null}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Historial */}
      {procesadas.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Historial reciente</h2>
          <div className="space-y-2">
            {procesadas.slice(0, 20).map(sol => (
              <Card key={sol.id} className={`p-3 border-l-4 ${sol.estado === "aprobado" ? "border-l-green-500" : "border-l-red-500"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={ESTADO_BADGE[sol.estado]}>{sol.estado}</Badge>
                    <span className="text-sm">{ENTIDAD_LABELS[sol.entidad]} #{sol.entidadId}</span>
                    <span className="text-sm font-medium">{formatARS(sol.monto)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(sol.createdAt).toLocaleDateString("es-AR")}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
