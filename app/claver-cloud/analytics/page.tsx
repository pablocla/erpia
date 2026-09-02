"use client"

import { useCallback, useEffect, useState } from "react"
import { authFetch } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Clock,
  Eye,
  Loader2,
  MousePointerClick,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react"
import { PageShell, PageHeader, KpiStrip, StatusBadge } from "@/components/layout"
import { PageSkeleton } from "@/components/layout/page-skeleton"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts"

type TraficoData = {
  pageviews: number
  pageviewsPrev: number
  pageviewsChange: number | null
  visitors: number
  visitorsPrev: number
  visitorsChange: number | null
  bounceRate: number
  avgDurationMs: number
}

type TopPage = { path: string; views: number }

type FunnelStep = {
  order: number
  name: string
  label: string
  count: number
  dropoff: number
  conversionFromFirst: number
}

type FunnelData = {
  funnelId: string
  label: string
  description: string
  steps: FunnelStep[]
  worstDropoff: { step: string; dropoff: number } | null
  overallConversion: number
}

type AnalyticsAlert = {
  id: string
  severity: "critical" | "warning" | "info"
  title: string
  description: string
}

type DashboardData = {
  trafico: TraficoData
  topPages: TopPage[]
  alerts: AnalyticsAlert[]
  funnels: FunnelData[]
  feed: { id: number; sessionId: string; path: string; evento: string; createdAt: string; empresaId: number | null }[]
}

const fmtDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

const SEVERITY_MAP = {
  critical: { variant: "error" as const, icon: AlertTriangle },
  warning: { variant: "warning" as const, icon: AlertTriangle },
  info: { variant: "info" as const, icon: TrendingUp },
}

const FUNNEL_COLORS = [
  "oklch(0.65 0.22 145)",  // green
  "oklch(0.62 0.20 160)",
  "oklch(0.58 0.18 180)",
  "oklch(0.55 0.15 200)",
  "oklch(0.52 0.12 220)",
  "oklch(0.48 0.10 250)",  // purple
]

export default function ClaverAnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [days, setDays] = useState("7")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await authFetch(`/api/claver/analytics/dashboard?days=${days}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando analytics")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    void load()
  }, [load])

  if (loading && !data) {
    return <PageSkeleton kpis={4} tableRows={6} tableCols={3} />
  }

  return (
    <PageShell>
      <PageHeader
        variant="surface"
        title="Analytics & Observabilidad"
        description="Tráfico, funnels de conversión, drop-off y alertas automáticas. Entendé cuántos entran, hasta dónde llegan y por qué se van."
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <BarChart3 className="h-3.5 w-3.5" />
            Observabilidad
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-[140px] min-h-[40px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="14">Últimos 14 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 90 días</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading} className="min-h-[40px]">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          {/* ─── Alertas ────────────────────────────────────── */}
          {data.alerts.length > 0 && (
            <div className="space-y-2">
              {data.alerts.map((a) => {
                const cfg = SEVERITY_MAP[a.severity]
                return (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 rounded-lg border p-3 bg-card"
                  >
                    <StatusBadge variant={cfg.variant} label={a.severity.toUpperCase()} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ─── KPIs de Tráfico ─────────────────────────────── */}
          <KpiStrip
            columns={4}
            items={[
              {
                label: "Visitantes únicos",
                value: (
                  <span className="flex items-center gap-2">
                    {data.trafico.visitors}
                    {data.trafico.visitorsChange !== null && (
                      <span
                        className={`text-xs font-normal flex items-center gap-0.5 ${
                          data.trafico.visitorsChange >= 0
                            ? "text-[var(--status-success-foreground)]"
                            : "text-[var(--status-error-foreground)]"
                        }`}
                      >
                        {data.trafico.visitorsChange >= 0 ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                        {Math.abs(data.trafico.visitorsChange)}%
                      </span>
                    )}
                  </span>
                ),
                hint: `Período anterior: ${data.trafico.visitorsPrev}`,
              },
              {
                label: "Pageviews",
                value: (
                  <span className="flex items-center gap-2">
                    {data.trafico.pageviews.toLocaleString("es-AR")}
                    {data.trafico.pageviewsChange !== null && (
                      <span
                        className={`text-xs font-normal ${
                          data.trafico.pageviewsChange >= 0
                            ? "text-[var(--status-success-foreground)]"
                            : "text-[var(--status-error-foreground)]"
                        }`}
                      >
                        {data.trafico.pageviewsChange >= 0 ? "+" : ""}
                        {data.trafico.pageviewsChange}%
                      </span>
                    )}
                  </span>
                ),
              },
              {
                label: "Bounce rate",
                value: (
                  <span
                    className={
                      data.trafico.bounceRate > 70
                        ? "text-[var(--status-error-foreground)]"
                        : data.trafico.bounceRate > 50
                          ? "text-[var(--status-warning-foreground)]"
                          : undefined
                    }
                  >
                    {data.trafico.bounceRate}%
                  </span>
                ),
                hint: "% visitantes que ven 1 sola página",
              },
              {
                label: "Tiempo promedio",
                value: fmtDuration(data.trafico.avgDurationMs),
                hint: "Duración media por visita",
              },
            ]}
          />

          {/* ─── Top Pages + Funnels Grid ──────────────────── */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  Páginas más visitadas
                </CardTitle>
                <CardDescription>Top 10 rutas por pageviews</CardDescription>
              </CardHeader>
              <CardContent>
                {data.topPages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin datos aún</p>
                ) : (
                  <div className="space-y-2">
                    {data.topPages.map((p, i) => (
                      <div
                        key={p.path}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
                          {i + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs truncate">
                              {p.path}
                            </span>
                            <Badge variant="secondary" className="shrink-0 text-xs">
                              {p.views}
                            </Badge>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary/60"
                              style={{
                                width: `${Math.round((p.views / (data.topPages[0]?.views || 1)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Live Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                  Actividad reciente
                </CardTitle>
                <CardDescription>Últimos 50 eventos</CardDescription>
              </CardHeader>
              <CardContent>
                {data.feed.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin actividad registrada</p>
                ) : (
                  <div className="max-h-[320px] overflow-y-auto space-y-1.5">
                    {data.feed.slice(0, 20).map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center gap-2 text-xs border-b border-border/40 pb-1.5"
                      >
                        <span className="text-muted-foreground shrink-0 w-[100px]">
                          {new Date(ev.createdAt).toLocaleString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </span>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {ev.evento}
                        </Badge>
                        <span className="font-mono truncate">{ev.path}</span>
                        {ev.empresaId && (
                          <Badge variant="secondary" className="text-[10px] shrink-0 ml-auto">
                            E#{ev.empresaId}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ─── Funnels ───────────────────────────────────── */}
          {data.funnels.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-muted-foreground" />
                Funnels de Conversión
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {data.funnels.map((funnel) => (
                  <Card key={funnel.funnelId}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{funnel.label}</CardTitle>
                        <Badge
                          variant="outline"
                          className={
                            funnel.overallConversion > 20
                              ? "border-emerald-300 text-emerald-600 bg-emerald-50"
                              : funnel.overallConversion > 5
                                ? "border-amber-300 text-amber-700 bg-amber-50"
                                : "border-red-300 text-red-600 bg-red-50"
                          }
                        >
                          {funnel.overallConversion}% conversión total
                        </Badge>
                      </div>
                      <CardDescription>{funnel.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {funnel.steps[0].count === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          Sin datos de funnel aún. Los eventos se registran automáticamente.
                        </p>
                      ) : (
                        <>
                          <div className="h-[160px] mb-3">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={funnel.steps} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis
                                  dataKey="label"
                                  type="category"
                                  width={120}
                                  tick={{ fontSize: 11 }}
                                />
                                <Tooltip
                                  formatter={(value: any, _name: any, item: any) => [
                                    `${value ?? 0} (${item?.payload?.conversionFromFirst ?? 0}%)`,
                                    "Usuarios",
                                  ]}
                                />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                  {funnel.steps.map((_s, i) => (
                                    <Cell
                                      key={i}
                                      fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]}
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Drop-off summary */}
                          <div className="space-y-1.5">
                            {funnel.steps.slice(1).map((step) => (
                              <div
                                key={step.name}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-muted-foreground truncate">
                                  → {step.label}
                                </span>
                                <span
                                  className={
                                    step.dropoff > 60
                                      ? "text-[var(--status-error-foreground)] font-medium"
                                      : step.dropoff > 30
                                        ? "text-[var(--status-warning-foreground)]"
                                        : "text-muted-foreground"
                                  }
                                >
                                  {step.dropoff > 0 ? `-${step.dropoff}% drop-off` : "0% drop"}
                                </span>
                              </div>
                            ))}
                          </div>

                          {funnel.worstDropoff && funnel.worstDropoff.dropoff > 30 && (
                            <div className="mt-3 p-2 rounded-md bg-[var(--status-warning-background)] border border-[var(--status-warning-border)] text-xs">
                              ⚠️ Mayor abandono en <strong>{funnel.worstDropoff.step}</strong>: {funnel.worstDropoff.dropoff}% drop-off
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </PageShell>
  )
}
