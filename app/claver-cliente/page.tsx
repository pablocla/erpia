"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, CheckCircle2, Target, Ticket, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PageSkeleton } from "@/components/layout/page-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusBadge } from "@/components/layout"

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const cargar = () => {
    setLoading(true)
    setError("")
    fetch("/api/claver-cliente/overview", { headers: authHeaders() })
      .then(async (r) => {
        if (!r.ok) throw new Error("No se pudo cargar el resumen")
        return r.json()
      })
      .then((d) => setData(d))
      .catch(() => {
        setData(null)
        setError("No se pudo cargar tu proyecto. Reintentá o volvé a ingresar.")
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
  }, [])

  if (loading) {
    return <PageSkeleton kpis={2} tableRows={4} tableCols={2} />
  }

  if (!data || error) {
    return (
      <EmptyState
        icon={Target}
        title="No pudimos cargar el resumen"
        description={error || "Revisá tu sesión de stakeholder e intentá de nuevo."}
        actionLabel="Reintentar"
        onAction={cargar}
        secondaryActionLabel="Ir a tickets"
        onSecondaryAction={() => {
          window.location.href = "/claver-cliente/tickets"
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium text-primary mb-1">Portal de seguimiento</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {data.empresa?.razonSocial ?? data.empresa?.nombre ?? "Tu proyecto"}
          </h1>
          {data.analistaContacto && (
            <p className="text-sm text-muted-foreground mt-1">
              Analista asignado: <span className="text-foreground">{data.analistaContacto}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild className="min-h-[40px]">
            <Link href="/claver-cliente/tickets">
              <Ticket className="h-4 w-4 mr-2" />
              Tickets
            </Link>
          </Button>
          <Button size="sm" asChild className="min-h-[40px]">
            <Link href="/claver-cliente/scrum">
              Ver servicios
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {data.implementacion ? (
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
              <span className="font-semibold">{data.implementacion.porcentajeAvance}%</span>
            </div>
            <Progress value={data.implementacion.porcentajeAvance} />
            <div className="flex flex-wrap gap-2">
              {data.implementacion.atrasado ? (
                <StatusBadge variant="warning" label="Go-live atrasado" />
              ) : (
                <StatusBadge variant="success" label="En curso" />
              )}
              {data.implementacion.packOnboardEntregado && (
                <StatusBadge variant="info" label="Pack ONBOARD entregado" />
              )}
              {data.implementacion.fechaObjetivoGoLive && (
                <span className="text-xs text-muted-foreground self-center">
                  Objetivo:{" "}
                  {new Date(data.implementacion.fechaObjetivoGoLive).toLocaleDateString("es-AR")}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Target}
          title="Sin implementación vinculada"
          description="Cuando tu analista cree el proyecto CCA, vas a ver el avance acá."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="hover:border-primary/30 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <p>
              Abiertos: <strong>{data.ticketsResumen.abiertos}</strong>
            </p>
            {data.ticketsResumen.vencidosSla > 0 && (
              <StatusBadge
                variant="warning"
                label={`SLA vencido: ${data.ticketsResumen.vencidosSla}`}
              />
            )}
            <Button variant="outline" size="sm" asChild className="min-h-[40px]">
              <Link href="/claver-cliente/tickets">Ver tickets</Link>
            </Button>
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
                  <CheckCircle2 className="h-4 w-4 text-[var(--status-success)]" />
                ) : (
                  <span className="h-4 w-4 rounded-full border shrink-0" />
                )}
                <span className={p.hecho ? "text-muted-foreground line-through" : ""}>
                  {p.titulo}
                </span>
                <Badge variant="outline" className="text-[10px] ml-auto font-mono">
                  {p.sku}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
