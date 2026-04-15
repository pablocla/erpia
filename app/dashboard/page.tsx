"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SkeletonKPI, SkeletonCard } from "@/components/ui/skeleton"
import { MotionCard, MotionList, MotionFadeDown, MotionNumber, ScrollReveal } from "@/components/ui/motion"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts"
import {
  DollarSign, TrendingUp, TrendingDown, FileText, ShoppingCart,
  Wallet, AlertTriangle, RefreshCw, ArrowUpRight, ArrowDownRight, Sparkles, Rocket,
  BarChart3, Bot,
} from "lucide-react"
import Link from "next/link"
import { getRubroUx, normalizeRubroValue, type Rubro } from "@/lib/onboarding/onboarding-ia"

interface DashboardStats {
  resumenMes: {
    totalVentas: number
    totalFacturas: number
    totalCompras: number
    ivaDebito: number
    ivaCredito: number
    ivaPagar: number
    variacionVentas: number
  }
  ventasPorMes: { mes: string; ventas: number; facturas: number }[]
  topClientes: { cliente: string; total: number; facturas: number }[]
  alertas: { stockBajo: number; cajaAbierta: boolean }
}

function KPICard({
  titulo,
  valor,
  rawValue,
  subtitulo,
  icon: Icon,
  variacion,
  colorClass = "",
  href,
}: {
  titulo: string
  valor: string
  rawValue?: number
  subtitulo?: string
  icon: React.ElementType
  variacion?: number
  colorClass?: string
  href?: string
}) {
  const card = (
    <MotionCard hover={!!href}>
      <Card className={`glass-panel border-border/50 relative overflow-hidden group ${href ? "cursor-pointer hover:shadow-lg transition-all" : ""}`}>
        {/* Decorative corner glow */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors pointer-events-none" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
          <Icon className={`h-4 w-4 ${colorClass || "text-muted-foreground"}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${colorClass}`}>
            {rawValue !== undefined ? (
              <MotionNumber
                value={rawValue}
                format={(n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)}
              />
            ) : (
              valor
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {subtitulo && <p className="text-xs text-muted-foreground">{subtitulo}</p>}
            {variacion !== undefined && (
              <span className={`text-xs flex items-center gap-0.5 ${variacion >= 0 ? "text-green-600" : "text-red-600"}`}>
                {variacion >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(variacion)}% vs mes ant.
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </MotionCard>
  )

  return href ? <Link href={href}>{card}</Link> : card
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState("mes")
  const [rubro, setRubro] = useState<Rubro>("otro")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [usingDemo, setUsingDemo] = useState(false)

  const authHeaders = useCallback((): HeadersInit => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const cargarStats = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/estadisticas/dashboard?periodo=${periodo}`, { headers: authHeaders() })
      const data = await res.json()
      const parsed: DashboardStats = {
        resumenMes: {
          totalVentas: data.ventas?.totalVentas ?? data.resumenMes?.totalVentas ?? 0,
          totalFacturas: data.ventas?.totalFacturas ?? data.resumenMes?.totalFacturas ?? 0,
          totalCompras: data.compras?.totalCompras ?? data.resumenMes?.totalCompras ?? 0,
          ivaDebito: data.iva?.debito ?? data.resumenMes?.ivaDebito ?? 0,
          ivaCredito: data.iva?.credito ?? data.resumenMes?.ivaCredito ?? 0,
          ivaPagar: data.iva?.saldo ?? data.resumenMes?.ivaPagar ?? 0,
          variacionVentas: data.resumenMes?.variacionVentas ?? 0,
        },
        ventasPorMes: data.ventasPorMes ?? data.ventasMensuales ?? [],
        topClientes: data.topClientes ?? [],
        alertas: data.alertas ?? { stockBajo: 0, cajaAbierta: false },
      }
      // If all values are zero, overlay demo data so the dashboard looks alive
      const isEmpty =
        parsed.resumenMes.totalVentas === 0 &&
        parsed.resumenMes.totalCompras === 0 &&
        parsed.ventasPorMes.length === 0 &&
        parsed.topClientes.length === 0
      if (isEmpty) {
        parsed.resumenMes = {
          totalVentas: 2_847_600, totalFacturas: 142, totalCompras: 1_350_200,
          ivaDebito: 597_996, ivaCredito: 283_542, ivaPagar: 314_454, variacionVentas: 12.4,
        }
        parsed.ventasPorMes = [
          { mes: "Ene", ventas: 1_820_000, facturas: 90 },
          { mes: "Feb", ventas: 2_110_000, facturas: 105 },
          { mes: "Mar", ventas: 1_960_000, facturas: 98 },
          { mes: "Abr", ventas: 2_480_000, facturas: 115 },
          { mes: "May", ventas: 2_310_000, facturas: 110 },
          { mes: "Jun", ventas: 2_847_600, facturas: 142 },
        ]
        parsed.topClientes = [
          { cliente: "Distribuidora Norte S.A.", total: 485_200, facturas: 24 },
          { cliente: "Comercial del Sur SRL",  total: 342_100, facturas: 18 },
          { cliente: "PyME Tech Argentina",     total: 278_900, facturas: 15 },
          { cliente: "Ferretería Central",      total: 195_400, facturas: 12 },
          { cliente: "Almacén Don Pedro",       total: 156_800, facturas: 9 },
        ]
        parsed.alertas = { stockBajo: 3, cajaAbierta: true }
        setUsingDemo(true)
      } else {
        setUsingDemo(false)
      }
      setStats(parsed)
      setLastUpdate(new Date())
    } catch {
      setStats({
        resumenMes: {
          totalVentas: 2_847_600, totalFacturas: 142, totalCompras: 1_350_200,
          ivaDebito: 597_996, ivaCredito: 283_542, ivaPagar: 314_454, variacionVentas: 12.4,
        },
        ventasPorMes: [
          { mes: "Ene", ventas: 1_820_000, facturas: 90 },
          { mes: "Feb", ventas: 2_110_000, facturas: 105 },
          { mes: "Mar", ventas: 1_960_000, facturas: 98 },
          { mes: "Abr", ventas: 2_480_000, facturas: 115 },
          { mes: "May", ventas: 2_310_000, facturas: 110 },
          { mes: "Jun", ventas: 2_847_600, facturas: 142 },
        ],
        topClientes: [
          { cliente: "Distribuidora Norte S.A.", total: 485_200, facturas: 24 },
          { cliente: "Comercial del Sur SRL",  total: 342_100, facturas: 18 },
          { cliente: "PyME Tech Argentina",     total: 278_900, facturas: 15 },
        ],
        alertas: { stockBajo: 3, cajaAbierta: true },
      })
      setUsingDemo(true)
    } finally {
      setLoading(false)
    }
  }

  const cargarRubro = useCallback(async () => {
    try {
      const res = await fetch("/api/config/empresa", { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setRubro(normalizeRubroValue(data?.rubro))
    } catch {
      setRubro("otro")
    }
  }, [authHeaders])

  useEffect(() => {
    const savedPeriodo = typeof window !== "undefined" ? window.localStorage.getItem("dashboard:periodo") : null
    if (savedPeriodo && ["mes", "trimestre", "anio"].includes(savedPeriodo)) setPeriodo(savedPeriodo)
  }, [])

  useEffect(() => {
    cargarStats()
    const interval = setInterval(cargarStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [periodo])

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("dashboard:periodo", periodo)
  }, [periodo])

  useEffect(() => {
    cargarRubro()
  }, [cargarRubro])

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v)

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-28" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonKPI key={i} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <SkeletonCard className="lg:col-span-2 h-72" />
          <SkeletonCard className="h-72" />
        </div>
      </div>
    )
  }

  const s = stats!
  const rubroConfig = getRubroUx(rubro)
  const saludOperativa = Math.max(
    0,
    100
      - (s.alertas.stockBajo > 0 ? 20 : 0)
      - (!s.alertas.cajaAbierta ? 25 : 0)
      - (s.resumenMes.ivaPagar > 0 ? 15 : 0)
      - (s.resumenMes.totalVentas === 0 ? 15 : 0),
  )
  const saludColorClass =
    saludOperativa >= 85 ? "text-green-700" : saludOperativa >= 65 ? "text-amber-700" : "text-red-700"

  const ivaData = [
    { name: "IVA Débito", value: s.resumenMes.ivaDebito, color: "#f97316" },
    { name: "IVA Crédito", value: s.resumenMes.ivaCredito, color: "#22c55e" },
  ]

  return (
    <div className="space-y-6">
      <MotionFadeDown>
        <div className="glass-panel border-border/40 relative overflow-hidden rounded-xl p-5 sm:p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between shadow-sm">
          {/* Subtle gradient background for main header */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3 shadow-[0_0_12px_rgba(var(--primary-rgb),0.15)] glow-pulse">
              <Sparkles className="h-3.5 w-3.5" />
              Centro de control operativo
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gradient">Dashboard Ejecutivo</h1>
            <p className="text-muted-foreground text-sm mt-1.5 max-w-xl">
              Resumen ejecutivo consolidado del negocio. Perfil activo: <span className="font-semibold text-foreground">{rubroConfig.nombre}</span>
              {lastUpdate && (
                <span className="ml-2 text-xs opacity-60">
                  — Actualizado {lastUpdate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="text-xs">
              Rubro: {rubroConfig.nombre}
            </Badge>

            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-36 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes">Este mes</SelectItem>
                <SelectItem value="trimestre">Trimestre</SelectItem>
                <SelectItem value="anio">Este año</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={cargarStats} disabled={loading} className="bg-background/50 backdrop-blur-md hover:bg-muted ml-2">
              <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </MotionFadeDown>

      {usingDemo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-300/50 rounded-lg text-xs text-amber-700 dark:text-amber-300">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>
            <strong>Modo demostración</strong> — Los datos mostrados son ilustrativos. Conectá tu base de datos para ver cifras reales.
          </span>
          <Link href="/dashboard/onboarding" className="ml-auto shrink-0">
            <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 border-amber-300">
              <Rocket className="h-3 w-3" />
              Configurar
            </Button>
          </Link>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">KPIs clave del rubro</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              {rubroConfig.foco.map((item) => (
                <Badge key={item} variant="secondary" className="text-[11px] font-medium px-3 py-1 bg-secondary shadow-sm">
                  {item}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Alertas a instrumentar</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              {rubroConfig.alertas.map((item) => (
                <Badge key={item} className="text-[11px] font-medium px-3 py-1 bg-amber-500/10 text-amber-700 border-amber-300 shadow-sm" variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-panel border-border/50 lg:col-span-2">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 tracking-wide uppercase text-muted-foreground">
              <Rocket className="h-4 w-4 text-primary" />
              Acciones rápidas operativas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {rubroConfig.quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group rounded-lg border bg-background/70 px-3 py-2.5 text-sm font-medium hover:border-primary hover:bg-primary/5 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 flex items-center justify-between"
                >
                  <span>{action.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Salud operativa</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-4">
              {/* Circular progress */}
              <div className="relative h-16 w-16 shrink-0">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" className="text-muted/40" strokeWidth="5" />
                  <circle
                    cx="32" cy="32" r="28" fill="none"
                    className={saludOperativa >= 85 ? "text-green-500" : saludOperativa >= 65 ? "text-amber-500" : "text-red-500"}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${(saludOperativa / 100) * 175.9} 175.9`}
                    style={{ transition: "stroke-dasharray 1s cubic-bezier(0.16, 1, 0.3, 1)" }}
                  />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${saludColorClass}`}>
                  {saludOperativa}%
                </span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">
                  Score basado en caja, stock, actividad de ventas e IVA.
                </p>
              </div>
            </div>
            {saludOperativa < 70 && (
              <Link href="/dashboard/onboarding">
                <Button variant="outline" size="sm" className="w-full">Revisar checklist go-live</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {(s.alertas.stockBajo > 0 || !s.alertas.cajaAbierta) && (
        <MotionList fast className="flex flex-wrap gap-3">
          {s.alertas.stockBajo > 0 && (
            <MotionCard>
              <Link href="/dashboard/productos">
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 hover:bg-orange-100 transition-colors cursor-pointer badge-glow">
                  <AlertTriangle className="h-4 w-4" />
                  <strong>{s.alertas.stockBajo}</strong> producto(s) con stock bajo
                </div>
              </Link>
            </MotionCard>
          )}
          {!s.alertas.cajaAbierta && (
            <MotionCard>
              <Link href="/dashboard/caja">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 hover:bg-blue-100 transition-colors cursor-pointer badge-glow">
                  <Wallet className="h-4 w-4" />
                  La caja no está abierta
                </div>
              </Link>
            </MotionCard>
          )}
        </MotionList>
      )}

      {/* AI Insights Widget */}
      <AIInsightsWidget />

      <MotionList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          titulo="Total Ventas"
          valor={formatCurrency(s.resumenMes.totalVentas)}
          rawValue={s.resumenMes.totalVentas}
          subtitulo={`${s.resumenMes.totalFacturas} facturas emitidas`}
          icon={DollarSign}
          variacion={s.resumenMes.variacionVentas}
          colorClass="text-green-700"
          href="/dashboard/ventas"
        />
        <KPICard
          titulo="Total Compras"
          valor={formatCurrency(s.resumenMes.totalCompras)}
          rawValue={s.resumenMes.totalCompras}
          subtitulo="Facturas de compra"
          icon={ShoppingCart}
          href="/dashboard/compras"
        />
        <KPICard
          titulo="IVA a Pagar"
          valor={formatCurrency(s.resumenMes.ivaPagar)}
          rawValue={s.resumenMes.ivaPagar}
          subtitulo={`Débito $${s.resumenMes.ivaDebito.toLocaleString()} | Crédito $${s.resumenMes.ivaCredito.toLocaleString()}`}
          icon={FileText}
          colorClass={s.resumenMes.ivaPagar > 0 ? "text-red-700" : "text-green-700"}
          href="/dashboard/impuestos"
        />
        <KPICard
          titulo="Resultado Bruto"
          valor={formatCurrency(s.resumenMes.totalVentas - s.resumenMes.totalCompras)}
          rawValue={s.resumenMes.totalVentas - s.resumenMes.totalCompras}
          subtitulo="Ventas − Compras del período"
          icon={s.resumenMes.totalVentas >= s.resumenMes.totalCompras ? TrendingUp : TrendingDown}
          colorClass={s.resumenMes.totalVentas >= s.resumenMes.totalCompras ? "text-green-700" : "text-red-700"}
        />
      </MotionList>

      <ScrollReveal>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="glass-panel border-border/50 lg:col-span-2">
            <CardHeader className="border-b border-border/40 bg-muted/10 pb-4">
              <CardTitle className="text-base font-semibold">Evolución de Ingresos (Facturado vs Mes)</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {s.ventasPorMes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
                  <BarChart3 className="h-10 w-10 opacity-20" />
                  <p>Emití tu primera factura para ver el gráfico</p>
                  <Link href="/dashboard/ventas">
                    <Button variant="outline" size="sm" className="text-xs mt-1">Ir a Facturación</Button>
                  </Link>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={s.ventasPorMes} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" className="text-xs" tick={{ fontSize: 11 }} />
                    <YAxis className="text-xs" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v), "Ventas"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="ventas" radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out">
                      {s.ventasPorMes.map((_, i) => (
                        <Cell key={i} fill={i === s.ventasPorMes.length - 1 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.4)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50">
            <CardHeader className="border-b border-border/40 bg-muted/10 pb-4">
              <CardTitle className="text-base font-semibold">Carga Impositiva (IVA)</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {s.resumenMes.ivaDebito + s.resumenMes.ivaCredito === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
                  <FileText className="h-8 w-8 opacity-20" />
                  <p className="text-center">IVA se calcula desde tus facturas</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={ivaData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3} animationDuration={900} animationEasing="ease-out">
                      {ivaData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="mt-2 p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Saldo a pagar</p>
                <p className={`text-xl font-bold ${s.resumenMes.ivaPagar > 0 ? "text-red-700" : "text-green-700"}`}>
                  {formatCurrency(s.resumenMes.ivaPagar)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollReveal>

      {s.topClientes.length > 0 && (
        <ScrollReveal>
          <Card className="glass-panel border-border/50">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-muted/10 pb-4">
              <CardTitle className="text-base font-semibold">Distribuición de Cartera de Clientes</CardTitle>
              <Link href="/dashboard/clientes">
                <Button variant="outline" size="sm" className="h-8">Análisis completo</Button>
              </Link>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="space-y-3">
              {s.topClientes.map((c, i) => {
                const pct = s.resumenMes.totalVentas > 0 ? (c.total / s.resumenMes.totalVentas) * 100 : 0
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate">{c.cliente}</p>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <Badge variant="secondary" className="text-xs">{c.facturas} fact.</Badge>
                          <p className="font-bold text-sm">{formatCurrency(c.total)}</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full">
                        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
          </Card>
        </ScrollReveal>
      )}
    </div>
  )
}

// ─── AI Insights Widget ───────────────────────────────────────────────────────

interface AlertaIA {
  id: number
  tipo: string
  prioridad: string
  titulo: string
  descripcion: string
  accion: string | null
}

function AIInsightsWidget() {
  const [alertas, setAlertas] = useState<AlertaIA[]>([])
  const [loaded, setLoaded] = useState(false)
  const [iaEnabled, setIaEnabled] = useState(true)

  useEffect(() => {
    // Check if IA module is active first
    fetch("/api/config/modulos")
      .then(r => r.json())
      .then(d => {
        if (d.ia === false) {
          setIaEnabled(false)
          setLoaded(true)
          return
        }
        return fetch("/api/ai/alertas?no_leidas=true")
          .then(r => r.json())
          .then(d => { if (d.success) setAlertas((d.data ?? []).slice(0, 3)) })
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  // Don't render the widget at all if IA is disabled
  if (!iaEnabled) return null

  const priColor: Record<string, string> = {
    alta: "text-red-500",
    media: "text-yellow-500",
    baja: "text-green-500",
  }

  return (
    <MotionCard>
      <Card className="glass-panel border-amber-500/20 shadow-[0_4px_24px_-8px_rgba(245,158,11,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent pointer-events-none" />
        <CardHeader className="pb-3 border-b border-border/40 bg-amber-50/30 dark:bg-amber-900/10 flex flex-row items-center justify-between relative z-10">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-500 tracking-wide uppercase">
            <Bot className="h-5 w-5 text-amber-500" />
            Alertas IA
          </CardTitle>
          <Link href="/dashboard/ia">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              Ir al asistente
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          {!loaded ? (
            <p className="text-xs text-muted-foreground py-3">Cargando alertas...</p>
          ) : alertas.length === 0 ? (
            <div className="py-3 text-center text-sm text-muted-foreground">
              Sin alertas pendientes. <Link href="/dashboard/ia" className="text-primary hover:underline">Abrir asistente</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {alertas.map(a => (
                <div key={a.id} className="flex items-start gap-2 py-1.5 border-b last:border-0">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${priColor[a.prioridad] ?? "text-gray-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.titulo}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{a.descripcion}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{a.prioridad}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </MotionCard>
  )
}
