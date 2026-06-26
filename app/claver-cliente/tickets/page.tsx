"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

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

export default function ClaverClienteTicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([])

  useEffect(() => {
    fetch("/api/claver-cliente/overview", { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setTickets(d?.tickets ?? []))
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Tickets de soporte</h1>
      {tickets.length === 0 && (
        <p className="text-sm text-muted-foreground">No hay tickets registrados.</p>
      )}
      {tickets.map((t) => (
        <Card key={t.id}>
          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">{t.numero} — {t.titulo}</p>
              <p className="text-xs text-muted-foreground">{t.horasAbierto}h abierto</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{t.estado}</Badge>
              <Badge variant="outline">{t.prioridad}</Badge>
              {t.slaVencido && <Badge variant="destructive">SLA</Badge>}
              <Link href={`/claver-cliente/tickets/${t.id}`} className="text-sm text-primary">
                Ver
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}