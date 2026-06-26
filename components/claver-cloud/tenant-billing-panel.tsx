"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { CreditCard, ExternalLink, Loader2 } from "lucide-react"
import { TENANT_PLAN_LIMITS, type TenantPlanId } from "@/lib/ops/tenant-plan-limits"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type BillingData = {
  billing: {
    plan: TenantPlanId
    mrrSkusArs: number
    mrrPlanArs: number
    mrrTotalArs: number
    skusActivos: number
    limiteSkus: number
    opsSuperAdmin: boolean
  }
  plan: { id: TenantPlanId; maxSkusActivos: number; playbooksCustom: boolean }
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

const planColor: Record<TenantPlanId, string> = {
  Starter: "bg-slate-500/10 text-slate-700",
  Pro: "bg-blue-500/10 text-blue-700",
  Enterprise: "bg-violet-500/10 text-violet-700",
}

export function TenantBillingPanel({ empresaId }: { empresaId: number }) {
  const [data, setData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [changing, setChanging] = useState<TenantPlanId | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/claver/tenants/${empresaId}/billing`, { headers: authHeaders() })
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [empresaId])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const cambiarPlan = async (plan: TenantPlanId) => {
    setChanging(plan)
    try {
      const res = await fetch(`/api/claver/tenants/${empresaId}/billing`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ plan }),
      })
      if (res.ok) setData(await res.json())
    } finally {
      setChanging(null)
    }
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">{loading ? "Cargando billing…" : "Sin datos"}</p>
  }

  const { billing } = data

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          MRR estimado: <strong className="text-foreground">{fmt(billing.mrrTotalArs)}/mes</strong>
          <span className="text-xs">({fmt(billing.mrrPlanArs)} plan + {fmt(billing.mrrSkusArs)} SKUs)</span>
        </p>
        <Button size="sm" variant="ghost" asChild>
          <Link href="/claver-cloud/billing">
            Flota completa
            <ExternalLink className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Plan actual</p>
            <Badge variant="outline" className={cn("mt-1", planColor[billing.plan])}>{billing.plan}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">SKUs activos</p>
            <p className="text-xl font-bold">
              {billing.skusActivos}/{billing.limiteSkus}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Cambiar plan comercial</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(TENANT_PLAN_LIMITS) as TenantPlanId[]).map((id) => {
            const p = TENANT_PLAN_LIMITS[id]
            const activo = billing.plan === id
            return (
              <div
                key={id}
                className={cn(
                  "border rounded-lg p-3 text-sm space-y-2",
                  activo && "border-primary/50 bg-primary/5",
                )}
              >
                <p className="font-medium">{id}</p>
                <p className="text-xs text-muted-foreground">{fmt(p.precioBaseArs)}/mes · {p.maxSkusActivos} SKUs</p>
                <Button
                  size="sm"
                  variant={activo ? "secondary" : "outline"}
                  className="w-full"
                  disabled={activo || changing != null}
                  onClick={() => void cambiarPlan(id)}
                >
                  {changing === id && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  {activo ? "Actual" : "Seleccionar"}
                </Button>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}