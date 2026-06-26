"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, Target, Ticket } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

type Overview = {
  empresa: { nombre: string; razonSocial: string } | null
  implementacion: {
    codigo: string
    faseNombre: string
    porcentajeAvance: number
    packOnboardEntregado: boolean
    fechaObjetivoGoLive: string | null
    atrasado: boolean
  } | null
  ticketsResumen: { abiertos: number; vencidosSla: number }
  errores: { ref: string; mensaje: string; severidad: string }[]
  pasosCliente: { titulo: string; hecho: boolean; sku: string }[]
  analistaContacto: string | null
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function ClaverClienteHomePage() {
  const [data, setData] = useState<Overview | null>(null)

  useEffect(() => {
    fetch("/api/claver-cliente/overview", { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
  }, [])

  if (!data) {
    return <p className="text-sm text-muted-foreground">Cargando resumen…</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{data.empresa?.razonSocial ?? "Tu proyecto"}</h1>
        {data.analistaContacto && (
          <p className="text-sm text-muted-foreground mt-1">
            Analista asignado: {data.analistaContacto}
          </p>
        )}
      </div>

      {data.implementacion && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Implementación {data.implementacion.codigo}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>{data.implementacion.faseNombre}</span>
              <span>{data.implementacion.porcentajeAvance}%</span>
            </div>
            <Progress value={data.implementacion.porcentajeAvance} />
            {data.implementacion.atrasado && (
              <Badge variant="outline" className="text-amber-700 border-amber-300">
                Objetivo go-live atrasado
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>Abiertos: <strong>{data.ticketsResumen.abiertos}</strong></p>
            {data.ticketsResumen.vencidosSla > 0 && (
              <p className="text-amber-700">SLA vencido: {data.ticketsResumen.vencidosSla}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {data.errores.length === 0 ? (
              <p className="text-muted-foreground">Sin alertas recientes</p>
            ) : (
              <ul className="space-y-2">
                {data.errores.slice(0, 3).map((e) => (
                  <li key={e.ref} className="border rounded-md p-2 text-xs">
                    <span className="font-medium">{e.ref}</span> — {e.mensaje}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {data.pasosCliente.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tus pasos pendientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.pasosCliente.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {p.hecho ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <span className="h-4 w-4 rounded-full border" />
                )}
                <span>{p.titulo}</span>
                <Badge variant="outline" className="text-[10px] ml-auto">{p.sku}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}