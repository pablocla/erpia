"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CreditCard, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TENANT_PLAN_LIMITS, type TenantPlanId } from "@/lib/ops/tenant-plan-limits"

type BillingRow = {
  empresaId: number
  nombre: string
  plan: TenantPlanId
  mrrSkusArs: number
  mrrPlanArs: number
  mrrTotalArs: number
  skusActivos: number
  limiteSkus: number
  opsSuperAdmin: boolean
}

type FleetBilling = {
  planes: typeof TENANT_PLAN_LIMITS
  rows: BillingRow[]
  totales: {
    tenants: number
    mrrTotalArs: number
    conSuperAdmin: number
  }
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

const planColor: Record<TenantPlanId, string> = {
  Starter: "bg-slate-500/10 text-slate-700",
  Pro: "bg-blue-500/10 text-blue-700",
  Enterprise: "bg-violet-500/10 text-violet-700",
}

export default function ClaverCloudBillingPage() {
  const [data, setData] = useState<FleetBilling | null>(null)
  const [loading, setLoading] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/claver/billing", { headers: authHeaders() })
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void cargar()
  }, [])

  if (!data) {
    return <p className="text-sm text-muted-foreground p-6">{loading ? "Cargando billing…" : "Sin datos"}</p>
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <CreditCard className="h-5 w-5" />
            <span className="text-sm font-medium">Billing comercial</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">MRR por tenant</h1>
          <p className="text-muted-foreground mt-1">
            Plan base + SKUs activos del marketplace — scope del analista
          </p>
        </div>
        <Button variant="outline" onClick={() => void cargar()} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">MRR total flota</p>
            <p className="text-2xl font-bold">{fmt(data.totales.mrrTotalArs)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Tenants</p>
            <p className="text-2xl font-bold">{data.totales.tenants}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Con Super Admin SKU</p>
            <p className="text-2xl font-bold">{data.totales.conSuperAdmin}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {(Object.keys(TENANT_PLAN_LIMITS) as TenantPlanId[]).map((id) => {
          const p = TENANT_PLAN_LIMITS[id]
          return (
            <Card key={id}>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {id}
                  <Badge variant="outline" className={planColor[id]}>{fmt(p.precioBaseArs)}/mes</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>Hasta {p.maxSkusActivos} SKUs activos</p>
                <p>Super Admin: {p.superAdminPanel ? "✓" : "—"}</p>
                <p>Playbooks auto: {p.playbooksAuto ? "✓" : "—"}</p>
                <p>Impersonación: {p.impersonacionErp ? "✓" : "—"}</p>
                <p>Playbooks custom: {p.playbooksCustom ? "✓" : "—"}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle por tenant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.rows.map((r) => (
            <div
              key={r.empresaId}
              className="flex flex-wrap items-center gap-2 border rounded-lg p-3 text-sm hover:border-primary/30"
            >
              <div className="flex-1 min-w-[140px]">
                <p className="font-medium">{r.nombre}</p>
                <p className="text-xs text-muted-foreground">ID {r.empresaId}</p>
              </div>
              <Badge variant="outline" className={planColor[r.plan]}>{r.plan}</Badge>
              <span className="text-xs text-muted-foreground">
                {r.skusActivos}/{r.limiteSkus} SKUs
              </span>
              <span className="font-medium">{fmt(r.mrrTotalArs)}/mes</span>
              {r.opsSuperAdmin && <Badge className="bg-primary/80 text-[10px]">ops.superadmin</Badge>}
              <Button size="sm" variant="outline" asChild>
                <Link href={`/claver-cloud/tenants/${r.empresaId}`}>Panel</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}