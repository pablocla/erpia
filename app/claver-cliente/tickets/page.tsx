"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageSkeleton } from "@/components/layout/page-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusBadge } from "@/components/layout"
import type { StatusVariant } from "@/lib/ui/status-map"

type TicketRow = {
  id: number
  numero: string
  titulo: string
  estado: string
  prioridad: string
  slaVencido: boolean
  horasAbierto: number
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function estadoVariant(estado: string): StatusVariant {
  const e = (estado || "").toLowerCase()
  if (e.includes("cerr") || e.includes("resuel") || e.includes("done")) return "success"
  if (e.includes("progres") || e.includes("curso")) return "info"
  if (e.includes("pend") || e.includes("abiert")) return "warning"
  return "neutral"
}

function prioridadVariant(p: string): StatusVariant {
  const x = (p || "").toLowerCase()
  if (x.includes("alta") || x.includes("urgent") || x === "high") return "error"
  if (x.includes("media") || x === "medium") return "warning"
  return "neutral"
}

export default function ClaverClienteTicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const cargar = () => {
    setLoading(true)
    setError("")
    fetch("/api/claver-cliente/overview", { headers: authHeaders() })
      .then(async (r) => {
        if (!r.ok) throw new Error("Error")
        return r.json()
      })
      .then((d) => setTickets(d?.tickets ?? []))
      .catch(() => {
        setTickets([])
        setError("No se pudieron cargar los tickets.")
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
  }, [])

  if (loading) {
    return <PageSkeleton kpis={0} tableRows={5} tableCols={3} />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Tickets de soporte</h1>
          <p className="text-sm text-muted-foreground">
            Consultá el estado de tus pedidos de ayuda con el equipo Claver.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={cargar} className="min-h-[40px]">
          Actualizar
        </Button>
      </div>

      {error && (
        <EmptyState
          icon={Ticket}
          title="Error al cargar tickets"
          description={error}
          actionLabel="Reintentar"
          onAction={cargar}
        />
      )}

      {!error && tickets.length === 0 && (
        <EmptyState
          icon={Ticket}
          title="No hay tickets registrados"
          description="Cuando abras un caso de soporte o tu analista te asigne uno, va a aparecer acá."
          actionLabel="Volver al resumen"
          onAction={() => {
            window.location.href = "/claver-cliente"
          }}
        />
      )}

      {tickets.map((t) => (
        <Card key={t.id} className="hover:border-primary/30 transition-colors">
          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">
                <span className="font-mono text-xs text-muted-foreground mr-2">{t.numero}</span>
                {t.titulo}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.horasAbierto}h abierto</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge variant={estadoVariant(t.estado)} label={t.estado} />
              <StatusBadge variant={prioridadVariant(t.prioridad)} label={t.prioridad} />
              {t.slaVencido && <StatusBadge variant="error" label="SLA vencido" />}
              <Button size="sm" variant="outline" asChild className="min-h-[40px]">
                <Link href={`/claver-cliente/tickets/${t.id}`}>Ver detalle</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
