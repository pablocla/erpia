"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Building2, RefreshCw, Server, ArrowRight, BarChart3 } from "lucide-react"
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

export default function ClaverOperationsSelectorPage() {
  const [clientes, setClientes] = useState<ClienteCard[]>([])
  const [loading, setLoading] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/claver/ops/clientes", { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setClientes(Array.isArray(data.data) ? data.data : [])
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
          <h1 className="text-3xl font-bold tracking-tight">Operations Console</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            Seleccioná un tenant para administrar su pipeline y logs operativos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/claver-cloud/operations/reports">
              <BarChart3 className="h-4 w-4 mr-2" />
              Ver Reports Globales
            </Link>
          </Button>
          <Button variant="outline" onClick={cargar} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {clientes.map((c) => (
          <Card key={c.id} className="hover:border-primary/40 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {c.nombre}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  ID: {c.id}
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {c.razonSocial} · {c.rubro}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-1">
                {c.entornos.map((e) => (
                  <Badge
                    key={e.codigo}
                    variant="outline"
                    className={
                      e.estado === "activo"
                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-300"
                        : "bg-amber-500/10 text-amber-800 border-amber-300"
                    }
                  >
                    <Server className="h-3 w-3 mr-1" />
                    {e.codigo}: {e.estado}
                  </Badge>
                ))}
              </div>
              
              <Button asChild className="w-full">
                <Link href={`/claver-cloud/operations/${c.id}`} className="flex items-center justify-center gap-2">
                  Administrar Operaciones
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
