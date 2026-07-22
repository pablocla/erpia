"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { resolveBuenDiaConfig, type BuenDiaKPI } from "@/lib/dashboard/buen-dia-config"
import { getRubroUx, type Rubro } from "@/lib/onboarding/onboarding-ia"
import { type ModoLite } from "@/lib/comercial/pack-calle-catalog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MotionCard, MotionFadeDown, MotionNumber } from "@/components/ui/motion"
import Link from "next/link"
import { authFetch } from "@/lib/stores"

interface BuenDiaHomeProps {
  modoLite: string
  rubro: string
}

export function BuenDiaHome({ modoLite, rubro }: BuenDiaHomeProps) {
  const { user } = useAuthStore()
  const [data, setData] = useState<Record<string, number | string | null> | null>(null)
  const [loading, setLoading] = useState(true)

  const config = resolveBuenDiaConfig(modoLite as ModoLite, (rubro as Rubro) || "otro")
  const ux = getRubroUx(rubro)

  useEffect(() => {
    async function fetchKpis() {
      try {
        const res = await authFetch("/api/dashboard/buen-dia")
        if (res.ok) {
          setData(await res.json())
        }
      } catch (err) {
        console.error("Error fetching BuenDia KPIs", err)
      } finally {
        setLoading(false)
      }
    }
    fetchKpis()
  }, [])

  const hoy = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())

  const primary = ux.quickActions?.[0]

  return (
    <div className="space-y-6 mb-8">
      <MotionFadeDown>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Buen día, {user?.nombre?.split(" ")[0] || "equipo"}
              </h1>
              <p className="text-muted-foreground capitalize">{hoy}</p>
            </div>
            {ux.quickActions && ux.quickActions.length > 1 && (
              <div className="hidden sm:flex flex-wrap gap-2">
                {ux.quickActions.slice(1, 4).map((action, i) => (
                  <Link key={i} href={action.href}>
                    <Button variant="secondary" size="sm">
                      {action.label}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>
          {primary && (
            <Link href={primary.href} className="w-full sm:w-auto sm:self-start">
              <Button size="lg" className="w-full sm:w-auto min-h-12 text-base font-semibold">
                {primary.label}
              </Button>
            </Link>
          )}
        </div>
      </MotionFadeDown>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {config.kpis.map((kpi, i) => {
          const rawValue = data ? data[kpi.id] : null
          const Icon = kpi.icon

          let displayValue = <span className="text-muted-foreground">—</span>
          if (loading) {
            displayValue = <div className="h-8 w-16 animate-pulse bg-muted rounded" />
          } else if (rawValue !== null && rawValue !== undefined) {
            if (kpi.format === "currency") {
              displayValue = (
                <MotionNumber
                  value={Number(rawValue)}
                  format={(n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)}
                />
              )
            } else if (kpi.format === "number") {
              displayValue = <MotionNumber value={Number(rawValue)} />
            } else {
              displayValue = <span>{String(rawValue)}</span>
            }
          }

          const card = (
              <Card className={`relative overflow-hidden group h-full ${kpi.fallbackLink ? "hover:border-primary/50 transition-colors cursor-pointer" : ""}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {displayValue}
                  </div>
                  {(rawValue === null || rawValue === undefined) && !loading && (
                    <p className="text-xs text-muted-foreground mt-2">Sin datos aún</p>
                  )}
                </CardContent>
              </Card>
          )

          return (
            <MotionCard key={kpi.id} className="h-full">
              {kpi.fallbackLink ? <Link href={kpi.fallbackLink} className="block h-full">{card}</Link> : card}
            </MotionCard>
          )
        })}
      </div>
    </div>
  )
}
