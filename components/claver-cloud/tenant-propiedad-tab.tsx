"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Building2,
  CheckCircle2,
  Circle,
  ExternalLink,
  Home,
  Loader2,
  AlertTriangle,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { TenantPropiedadOverview } from "@/lib/ops/tenant-propiedad-service"

const fmtArs = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

interface TenantPropiedadTabProps {
  empresaId: number
  onImpersonate: (path?: string) => void
}

export function TenantPropiedadTab({ empresaId, onImpersonate }: TenantPropiedadTabProps) {
  const [data, setData] = useState<TenantPropiedadOverview | null>(null)
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/claver/tenants/${empresaId}/propiedad`, { headers: authHeaders() })
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [empresaId])

  useEffect(() => {
    void cargar()
  }, [cargar])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando vertical Propiedad…
      </div>
    )
  }

  if (!data?.esPropiedad) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Este tenant no tiene el pack Propiedad activo. Provisioná{" "}
          <strong className="text-foreground">pool-propiedad</strong> desde Servicios o el wizard de
          provisioning.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Consorcios" value={String(data.consorcios.length)} icon={Building2} />
        <Kpi
          label="Morosos expensas"
          value={String(data.morosos.total)}
          icon={AlertTriangle}
          warn={data.morosos.total > 0}
        />
        <Kpi label="Propiedades" value={String(data.inmobiliaria.propiedades)} icon={Home} />
        <Kpi
          label="Contratos activos"
          value={String(data.inmobiliaria.contratosActivos)}
          icon={Users}
        />
      </div>

      {data.packId && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Pack activo:</span>
          <Badge variant="outline">{data.packId}</Badge>
          {data.onboarding.pendiente && (
            <Badge variant="secondary" className="border-amber-500/40 text-amber-700">
              Checklist {data.onboarding.completados}/{data.onboarding.total}
            </Badge>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Consorcios
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => onImpersonate(data.links.consorcios)}>
              Impersonar ERP
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.consorcios.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin consorcios cargados.</p>
            ) : (
              data.consorcios.map((c) => (
                <div key={c.id} className="border rounded-md p-3 text-sm space-y-1">
                  <p className="font-medium">{c.nombre}</p>
                  <p className="text-xs text-muted-foreground">{c.direccion}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">{c.unidades} unidades</Badge>
                    <Badge variant="outline">
                      Últ. liquidación: {c.ultimoPeriodoLiquidado ?? "—"}
                    </Badge>
                    {c.gastosPeriodoActual === 0 && (
                      <Badge variant="outline" className="border-amber-500/40 text-amber-700">
                        Sin gastos mes actual
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="h-4 w-4" />
              Inmobiliaria
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => onImpersonate(data.links.inmobiliaria)}>
              Impersonar ERP
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <StatRow label="Propiedades en cartera" value={data.inmobiliaria.propiedades} />
            <StatRow label="Contratos activos" value={data.inmobiliaria.contratosActivos} />
            <StatRow
              label="Vencen en 30 días"
              value={data.inmobiliaria.contratosPorVencer30d}
              warn={data.inmobiliaria.contratosPorVencer30d > 0}
            />
            <StatRow
              label="Sin facturar este mes"
              value={data.inmobiliaria.alquileresSinFacturarMes}
              warn={data.inmobiliaria.alquileresSinFacturarMes > 0}
            />
          </CardContent>
        </Card>
      </div>

      {data.morosos.total > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              Morosos expensas ({data.morosos.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {data.morosos.items.map((m) => (
                <li key={m.expensaId} className="flex flex-wrap justify-between gap-2 border rounded-md px-3 py-2">
                  <div>
                    <span className="font-medium">{m.consorcioNombre}</span>
                    <span className="text-muted-foreground"> · UF {m.unidadNumero}</span>
                    {m.residenteNombre && (
                      <p className="text-xs text-muted-foreground">{m.residenteNombre}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{fmtArs(m.monto)}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.periodo} · {m.diasMora}d mora
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Checklist onboarding Propiedad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.onboarding.pasos.map((paso) => (
            <div
              key={paso.id}
              className="flex items-center justify-between gap-2 border rounded-md px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                {paso.hecho ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className={cn(paso.hecho && "text-muted-foreground line-through")}>{paso.label}</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => onImpersonate(paso.href)}>
                Abrir
              </Button>
            </div>
          ))}
          {!data.onboarding.pendiente && (
            <p className="text-xs text-emerald-600 pt-2">Checklist completado o cerrado por el cliente.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/claver-cloud/tenants/${empresaId}?tab=ops`}>Ver readiness Ops</Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => void cargar()}>
          Actualizar
        </Button>
      </div>
    </div>
  )
}

function Kpi({
  label,
  value,
  icon: Icon,
  warn,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  warn?: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <p className={cn("text-2xl font-bold", warn && "text-amber-600")}>{value}</p>
      </CardContent>
    </Card>
  )
}

function StatRow({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="flex justify-between items-center border rounded-md px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", warn && value > 0 && "text-amber-600")}>{value}</span>
    </div>
  )
}