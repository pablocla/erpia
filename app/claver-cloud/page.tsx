"use client"

import { useEffect, useState } from "react"
import { Activity, Building2, RefreshCw, Server, Shield, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type PlataformaMetricas = {
  clientes: number
  entornosEnError: number
  slaVencidos: number
  mttrHoras: number
  jobs30d: { porEstado: Record<string, number> }
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function ClaverCloudHomePage() {
  const [plataforma, setPlataforma] = useState<PlataformaMetricas | null>(null)
  const [loading, setLoading] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/claver/ops/metricas", { headers: authHeaders() })
      if (res.ok) {
        setPlataforma(await res.json())
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
          <h1 className="text-3xl font-bold tracking-tight">Console Home</h1>
          <p className="text-muted-foreground">Claver Cloud Platform Overview</p>
        </div>
        <Button variant="outline" onClick={cargar} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plataforma?.clientes ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Active organizations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Environments in Error</CardTitle>
            <Server className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{plataforma?.entornosEnError ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Breaches</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{plataforma?.slaVencidos ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Tickets exceeding SLA</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform MTTR</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plataforma?.mttrHoras ?? "—"}h</div>
            <p className="text-xs text-muted-foreground">Mean Time To Recovery</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Additional dashboard widgets can be added here in the future (e.g. recent alerts, quick actions) */}
    </div>
  )
}
