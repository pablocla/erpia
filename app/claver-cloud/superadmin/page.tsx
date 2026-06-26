"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Building2,
  Layers,
  Play,
  RefreshCw,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Fleet = {
  scope: string
  totales: {
    tenants: number
    readinessPromedio: number
    listosGoLive: number
    tareasPendientes: number
    entornosEnError: number
    skusActivosTotal: number
  }
  tenants: {
    id: number
    nombre: string
    rubro: string
    readinessScore: number
    listoGoLive: boolean
    tareasPendientes: number
    skusActivos: number
    entornosError: number
  }[]
  servicios: {
    sku: string
    nombre: string
    lema: string
    descripcion: string
    incluye: string[]
    precioArs: number
  }[]
  playbooks: { id: string; nombre: string; categoria: string }[]
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function ClaverSuperAdminDashboardPage() {
  const [data, setData] = useState<Fleet | null>(null)
  const [loading, setLoading] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/claver/superadmin/dashboard", { headers: authHeaders() })
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void cargar()
  }, [])

  if (!data) {
    return <p className="text-sm text-muted-foreground p-6">{loading ? "Cargando flota…" : "Sin datos"}</p>
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-medium">Super Administrador</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de flota</h1>
          <p className="text-muted-foreground mt-1">
            Paneles y ejecuciones automáticas como servicio — scope: {data.scope}
          </p>
        </div>
        <Button variant="outline" onClick={() => void cargar()} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Tenants", value: data.totales.tenants, icon: Building2 },
          { label: "Readiness Ø", value: `${data.totales.readinessPromedio}%`, icon: Layers },
          { label: "Go-live OK", value: data.totales.listosGoLive, icon: Sparkles },
          { label: "Tareas MKT", value: data.totales.tareasPendientes, icon: Play },
          { label: "Entornos error", value: data.totales.entornosEnError, icon: Shield },
          { label: "SKUs activos", value: data.totales.skusActivosTotal, icon: Zap },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4 flex items-center gap-3">
              <k.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-xl font-bold">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.servicios.map((s) => (
          <Card key={s.sku} className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                {s.nombre}
                <Badge variant="outline" className="font-mono text-[10px]">
                  {s.sku}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground italic">{s.lema}</p>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>{s.descripcion}</p>
              <ul className="text-xs text-muted-foreground list-disc pl-4">
                {s.incluye.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              {s.precioArs > 0 && (
                <p className="text-xs font-medium">
                  Desde {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(s.precioArs)}/mes
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tenants — ordenados por readiness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.tenants.map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center gap-2 border rounded-lg p-3 text-sm hover:border-primary/30"
            >
              <div className="flex-1 min-w-[160px]">
                <p className="font-medium">{t.nombre}</p>
                <p className="text-xs text-muted-foreground">{t.rubro}</p>
              </div>
              <Badge variant="outline">{t.readinessScore}%</Badge>
              {t.listoGoLive && <Badge className="bg-emerald-600">Go-live</Badge>}
              {t.entornosError > 0 && (
                <Badge variant="destructive">{t.entornosError} env error</Badge>
              )}
              <Button size="sm" asChild>
                <Link href={`/claver-cloud/tenants/${t.id}`}>Super Admin</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {data.playbooks.length} playbooks disponibles por tenant en la pestaña Automatizaciones.
      </p>
    </div>
  )
}