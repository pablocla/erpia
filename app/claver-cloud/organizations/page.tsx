"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Building2, RefreshCw, Server } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CLAVER_GROUP } from "@/lib/brand"

type ClienteCard = {
  id: number
  nombre: string
  razonSocial: string
  rubro: string
  entorno: string
  planHosting?: string
  entornos: { codigo: string; estado: string; version: string | null }[]
  metricas: { ticketsAbiertos: number; jobsActivos: number; logsError: number }
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function estadoColor(estado: string) {
  if (estado === "activo") return "bg-emerald-500/10 text-emerald-700 border-emerald-300"
  if (estado === "error") return "bg-red-500/10 text-red-700 border-red-300"
  return "bg-amber-500/10 text-amber-800 border-amber-300"
}

export default function ClaverOrganizationsPage() {
  const [clientes, setClientes] = useState<ClienteCard[]>([])
  const [scope, setScope] = useState<string>("all")
  const [loading, setLoading] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/claver/ops/clientes", { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setClientes(Array.isArray(data.data) ? data.data : [])
        setScope(data.scope ?? "all")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void cargar()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            Tenant Fleet Overview
            <Badge variant="outline" className="bg-amber-500/10 text-amber-800 border-amber-300">
              {CLAVER_GROUP.name} Ops · {scope === "all" ? "Acceso total" : "Asignados"}
            </Badge>
          </p>
        </div>
        <Button variant="outline" onClick={cargar} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {clientes.map((c) => (
          <Card key={c.id} className="hover:border-primary/40 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {c.nombre}
              </CardTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                {c.razonSocial} · {c.rubro}
                <Badge variant="outline" className="text-[10px]">
                  {c.planHosting === "dedicated" ? "Dedicated" : "Shared"}
                </Badge>
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {c.entornos.map((e) => (
                  <Badge key={e.codigo} variant="outline" className={estadoColor(e.estado)}>
                    <Server className="h-3 w-3 mr-1" />
                    {e.codigo}: {e.estado}
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-md border p-2">
                  <p className="font-bold text-amber-700">{c.metricas.ticketsAbiertos}</p>
                  <p className="text-muted-foreground">Tickets</p>
                </div>
                <div className="rounded-md border p-2">
                  <p className="font-bold text-blue-700">{c.metricas.jobsActivos}</p>
                  <p className="text-muted-foreground">Jobs</p>
                </div>
                <div className="rounded-md border p-2">
                  <p className="font-bold text-red-700">{c.metricas.logsError}</p>
                  <p className="text-muted-foreground">Errores</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild size="sm" variant="default">
                  <Link href={`/claver-cloud/tenants/${c.id}`}>Super Admin</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/claver-cloud/operations/${c.id}`}>Ops</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clientes.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-12">
          No tenants assigned to your account.
        </p>
      )}
    </div>
  )
}
