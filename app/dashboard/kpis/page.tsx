"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  TrendingUp, TrendingDown, Minus, DollarSign, Users,
  Package, FileText, AlertTriangle, Clock, RefreshCw,
  Activity, BarChart3, PieChart, ArrowUpRight, ArrowDownRight,
  Target, Download, Keyboard,
} from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, Bar, BarChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend } from "recharts"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { formatTimeAgo } from "@/lib/format-time-ago"

interface KPI {
  codigo: string
  nombre: string
  valor: number
  unidad: string
  meta: number | null
  nivel: "verde" | "amarillo" | "rojo"
  tendencia: "subiendo" | "bajando" | "estable"
}

const ICONS: Record<string, React.ElementType> = {
  VENTA_DIA: DollarSign,
  VENTA_MES: BarChart3,
  TICKET_PROMEDIO: FileText,
  DSO: Clock,
  DPO: Clock,
  MOROSIDAD: AlertTriangle,
  STOCK_BAJO_MINIMO: Package,
  FACTURAS_DIA: FileText,
  CXC_TOTAL: ArrowUpRight,
  CXP_TOTAL: ArrowDownRight,
}

const NIVEL_COLORS: Record<string, string> = {
  verde: "border-green-500/50 bg-green-500/5",
  amarillo: "border-yellow-500/50 bg-yellow-500/5",
  rojo: "border-red-500/50 bg-red-500/5",
}

const NIVEL_BADGE: Record<string, "default" | "secondary" | "destructive"> = {
  verde: "default",
  amarillo: "secondary",
  rojo: "destructive",
}

function formatValue(valor: number, unidad: string): string {
  if (unidad === "ARS") {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(valor)
  }
  if (unidad === "%") return `${valor}%`
  if (unidad === "días") return `${valor} días`
  return `${valor} ${unidad}`
}

const DRILL_DOWN: Record<string, string> = {
  VENTA_DIA: "/dashboard/ventas",
  VENTA_MES: "/dashboard/ventas",
  TICKET_PROMEDIO: "/dashboard/caja",
  FACTURAS_DIA: "/dashboard/facturas",
  DSO: "/dashboard/cuentas-cobrar",
  DPO: "/dashboard/cuentas-pagar",
  MOROSIDAD: "/dashboard/cuentas-cobrar",
  CXC_TOTAL: "/dashboard/cuentas-cobrar",
  CXP_TOTAL: "/dashboard/cuentas-pagar",
  STOCK_BAJO_MINIMO: "/dashboard/productos/movimientos",
}

const PERIODOS = [
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
  { value: "trimestre", label: "Trimestre" },
  { value: "anio", label: "Este año" },
]

const AUTO_REFRESH_MS = 60_000 // 1 min

export default function KPIsPage() {
  const router = useRouter()
  const [kpis, setKpis] = useState<KPI[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState("mes")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchKPIs = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/kpis?periodo=${periodo}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) {
        setKpis(data.data)
        setLastUpdate(new Date())
      }
    } catch {}
    finally { setLoading(false) }
  }, [periodo])

  useEffect(() => { fetchKPIs() }, [fetchKPIs])

  // Auto-refresh every minute
  useEffect(() => {
    autoTimer.current = setInterval(fetchKPIs, AUTO_REFRESH_MS)
    return () => { if (autoTimer.current) clearInterval(autoTimer.current) }
  }, [fetchKPIs])

  // Keyboard shortcuts
  useKeyboardShortcuts(erpShortcuts({
    onRefresh: fetchKPIs,
  }))

  const ventasKPIs = kpis.filter(k => ["VENTA_DIA", "VENTA_MES", "TICKET_PROMEDIO", "FACTURAS_DIA"].includes(k.codigo))
  const finanzasKPIs = kpis.filter(k => ["DSO", "DPO", "MOROSIDAD", "CXC_TOTAL", "CXP_TOTAL"].includes(k.codigo))
  const stockKPIs = kpis.filter(k => k.codigo === "STOCK_BAJO_MINIMO")

  // Summary chart data
  const chartData = kpis.filter(k => k.meta != null).map(k => ({
    name: k.nombre.replace(/ /g, "\n").slice(0, 18),
    actual: k.valor,
    meta: k.meta ?? 0,
    nivel: k.nivel,
  }))

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header with controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" />
            Tablero de Control KPIs
          </h1>
          <p className="text-sm text-muted-foreground">
            Métricas clave del negocio
            {lastUpdate && (
              <> · actualizado {formatTimeAgo(lastUpdate)}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODOS.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="h-8" onClick={fetchKPIs} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
                  Actualizar
                </Button>
              </TooltipTrigger>
              <TooltipContent>Alt+R para refrescar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Badge variant="outline" className="h-8 gap-1 px-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs">Auto-refresh 1m</span>
          </Badge>
        </div>
      </div>

      {/* Skeleton loading */}
      {loading && kpis.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-l-4 border-muted">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Ventas */}
          <KPISection
            title="Ventas"
            icon={DollarSign}
            kpis={ventasKPIs}
            onDrillDown={(code) => router.push(DRILL_DOWN[code] ?? "/dashboard")}
          />

          {/* Finanzas */}
          <KPISection
            title="Finanzas"
            icon={PieChart}
            kpis={finanzasKPIs}
            cols="xl:grid-cols-5"
            onDrillDown={(code) => router.push(DRILL_DOWN[code] ?? "/dashboard")}
          />

          {/* Stock */}
          <KPISection
            title="Inventario"
            icon={Package}
            kpis={stockKPIs}
            onDrillDown={(code) => router.push(DRILL_DOWN[code] ?? "/dashboard")}
          />

          {/* Comparison chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Real vs Meta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <ReTooltip
                        contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px" }}
                        formatter={(v: number) => new Intl.NumberFormat("es-AR").format(v)}
                      />
                      <Legend />
                      <Bar dataKey="actual" name="Real" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.nivel === "verde" ? "#22c55e" : entry.nivel === "amarillo" ? "#eab308" : "#ef4444"}
                            opacity={0.8}
                          />
                        ))}
                      </Bar>
                      <Bar dataKey="meta" name="Meta" fill="var(--muted-foreground)" opacity={0.3} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

/* ── KPI Section ──────────────────────────────────────────────── */

function KPISection({
  title,
  icon: Icon,
  kpis,
  cols = "xl:grid-cols-4",
  onDrillDown,
}: {
  title: string
  icon: React.ElementType
  kpis: KPI[]
  cols?: string
  onDrillDown: (code: string) => void
}) {
  if (kpis.length === 0) return null
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Icon className="h-5 w-5" />
        {title}
      </h2>
      <div className={`grid grid-cols-1 md:grid-cols-2 ${cols} gap-4`}>
        {kpis.map(kpi => (
          <KPICard key={kpi.codigo} kpi={kpi} onClick={() => onDrillDown(kpi.codigo)} />
        ))}
      </div>
    </div>
  )
}

/* ── KPI Card ─────────────────────────────────────────────────── */

function KPICard({ kpi, onClick }: { kpi: KPI; onClick?: () => void }) {
  const Icon = ICONS[kpi.codigo] ?? Activity
  const TendenciaIcon = kpi.tendencia === "subiendo" ? TrendingUp
    : kpi.tendencia === "bajando" ? TrendingDown : Minus

  // Generate sparkline data (simulated 7-day trend based on current value + tendency)
  const sparkData = React.useMemo(() => {
    const base = kpi.valor
    const factor = kpi.tendencia === "subiendo" ? 0.85 : kpi.tendencia === "bajando" ? 1.15 : 1
    return Array.from({ length: 7 }, (_, i) => {
      const progress = i / 6
      const noise = 1 + (Math.sin(i * 2.5) * 0.08)
      return { v: Math.round(base * factor * (1 + (1 - factor) * progress) * noise) }
    })
  }, [kpi.valor, kpi.tendencia])

  const sparkColor = kpi.nivel === "verde" ? "#22c55e" : kpi.nivel === "amarillo" ? "#eab308" : "#ef4444"
  const metaPct = kpi.meta != null && kpi.meta > 0 ? Math.round((kpi.valor / kpi.meta) * 100) : null

  return (
    <Card
      className={`relative overflow-hidden border-l-4 ${NIVEL_COLORS[kpi.nivel]} ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
      onClick={onClick}
    >  <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.nombre}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="flex-1">
            <p className="text-2xl font-bold">{formatValue(kpi.valor, kpi.unidad)}</p>
            {kpi.meta != null && (
              <div className="mt-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Target className="h-3 w-3" />
                  <span>Meta: {formatValue(kpi.meta, kpi.unidad)}</span>
                  {metaPct !== null && (
                    <Badge
                      variant={metaPct >= 100 ? "default" : metaPct >= 75 ? "secondary" : "destructive"}
                      className="h-4 text-[9px] px-1"
                    >
                      {metaPct}%
                    </Badge>
                  )}
                </div>
                {/* Progress bar toward goal */}
                <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, metaPct ?? 0)}%`,
                      backgroundColor: sparkColor,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 ml-3">
            {/* Sparkline */}
            <div className="w-20 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={`spark-${kpi.codigo}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={sparkColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={sparkColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={sparkColor}
                    strokeWidth={1.5}
                    fill={`url(#spark-${kpi.codigo})`}
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-1">
              <TendenciaIcon className={`h-3.5 w-3.5 ${
                kpi.tendencia === "subiendo" ? "text-green-500"
                  : kpi.tendencia === "bajando" ? "text-red-500" : "text-muted-foreground"
              }`} />
              <Badge variant={NIVEL_BADGE[kpi.nivel]} className="text-[10px]">
                {kpi.nivel}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
