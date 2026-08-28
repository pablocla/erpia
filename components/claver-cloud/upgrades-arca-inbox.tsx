"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { CalendarClock, Check, ShieldCheck, Trash2, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { cloudAuthHeaders } from "@/lib/claver-cloud/auth-headers"

type Pendiente = {
  id: number
  nombre: string
  negocio: string | null
  email: string | null
  telefono: string | null
  rubro: string | null
  proximaAccion: string | null
  proximaFecha: string | null
  notas: string | null
  empresaId: number | null
  empresaNombre: string | null
  createdAt: string
}

const fmtFecha = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso))

export function UpgradesArcaInbox({ compact = false }: { compact?: boolean }) {
  const [pendientes, setPendientes] = useState<Pendiente[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [workingId, setWorkingId] = useState<number | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/claver/comercial/upgrades-arca", {
        headers: cloudAuthHeaders(),
      })
      if (!res.ok) return
      const data = await res.json()
      setPendientes(data.pendientes ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function resolver(id: number, accion: "atender" | "descartar") {
    setWorkingId(id)
    try {
      const res = await fetch(`/api/claver/comercial/upgrades-arca/${id}`, {
        method: "PATCH",
        headers: cloudAuthHeaders(true),
        body: JSON.stringify({ accion }),
      })
      if (res.ok) await cargar()
    } finally {
      setWorkingId(null)
    }
  }

  const lista = compact ? pendientes.slice(0, 5) : pendientes

  return (
    <Card className="border-amber-500/30">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-amber-400" />
            Upgrades ARCA / WhatsApp
            {total > 0 && (
              <Badge variant="outline" className="border-amber-500/40 text-amber-300">
                {total} pendiente{total === 1 ? "" : "s"}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Cliente que quiere upgrade y sacar el certificado de factura electrónica. Turno tipo
            Calendly — hay que estar con quien tenga acceso a ARCA.
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={() => void cargar()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {lista.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Nadie pidió certificado esta semana"
            description="Cuando un comerciante pacte el turno, aparece acá como pendiente de upgrade."
          />
        ) : (
          lista.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-border/80 bg-card/50 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {p.empresaNombre || p.negocio || p.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.nombre}
                    {p.email ? ` · ${p.email}` : ""}
                    {p.telefono ? ` · ${p.telefono}` : ""}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {p.rubro === "whatsapp"
                    ? "WhatsApp"
                    : p.rubro === "arca"
                      ? "ARCA"
                      : "ARCA + WhatsApp"}
                </Badge>
              </div>
              {p.proximaFecha && (
                <p className="text-xs font-medium text-amber-300">
                  Turno: {fmtFecha(p.proximaFecha)}
                </p>
              )}
              {p.proximaAccion && (
                <p className="text-xs text-muted-foreground">{p.proximaAccion}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {p.empresaId && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                    <Link href={`/claver-cloud/tenants/${p.empresaId}`}>Ver tenant</Link>
                  </Button>
                )}
                <Button
                  size="sm"
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500"
                  disabled={workingId === p.id}
                  onClick={() => void resolver(p.id, "atender")}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Tomar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  disabled={workingId === p.id}
                  onClick={() => void resolver(p.id, "descartar")}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Descartar
                </Button>
              </div>
            </div>
          ))
        )}
        {compact && total > lista.length && (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/claver-cloud/comercial/upgrades-arca">Ver los {total} pendientes</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
