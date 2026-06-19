"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { useToast } from "@/hooks/use-toast"
import {
  Wheat, Truck, TrendingUp, TrendingDown,
  FileText, DollarSign, BarChart3, Layers,
  ArrowUpRight, RefreshCcw, CloudSun, Leaf, ShieldCheck,
} from "lucide-react"
import Link from "next/link"

interface StockGrano {
  nombre: string
  totalTn: number
  capacidadTn: number
}

interface PizarraItem {
  granoId: number
  nombre: string
  codigo: string
  precio: number | null
  moneda: string
  fuente: string | null
  variacion: number | null
  fechaData: string | null
}

interface DashboardData {
  stockPorGrano: StockGrano[]
  camionesHoy: number
  tnIngresadasHoy: number
  liquidacionesPendientes: number
  contratosPendientes: number
  pizarra: PizarraItem[]
}

interface ClimaLote {
  loteId: number
  lote: string
  hasCoords: boolean
  lluvia5d: number | null
  forecast: Array<{ date: string; lluviaMm: number; tMax: number; tMin: number }>
  fuente: string
}

interface ClimaData {
  generatedAt: string
  lotes: ClimaLote[]
}

interface NdviData {
  generatedAt: string
  promedioNdvi: number
  lotes: Array<{
    loteId: number
    lote: string
    cultivo: string
    ndvi: number
    estado: "excelente" | "bueno" | "atencion" | "critico"
    fuente: string
  }>
}

const ARS = (v: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v)
const NUM = (v: number, d = 1) => new Intl.NumberFormat("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v)

export default function AgroDashboardPage() {
  const { toast } = useToast()
  const { data, isLoading, mutate } = useAuthFetch<DashboardData>("/api/agro/dashboard", { refreshInterval: 120000 })
  const { data: pizarraData, mutate: mutatePizarra } = useAuthFetch<PizarraItem[]>("/api/agro/pizarra", { refreshInterval: 300000 })
  const { data: clima } = useAuthFetch<ClimaData>("/api/agro/clima", { refreshInterval: 900000 })
  const { data: ndvi } = useAuthFetch<NdviData>("/api/agro/ndvi", { refreshInterval: 1800000 })

  const [refreshing, setRefreshing] = useState(false)

  async function handleRefreshPizarra() {
    setRefreshing(true)
    await mutatePizarra()
    await mutate()
    setRefreshing(false)
    toast({ title: "Pizarra actualizada" })
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const pizarra = pizarraData ?? data?.pizarra ?? []

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-[var(--font-fraunces)]">AGRO / Acopio</h1>
          <p className="text-sm text-muted-foreground">Gestión de granos, balanza, contratos y liquidaciones</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefreshPizarra} disabled={refreshing}>
            <RefreshCcw className={`mr-1 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar pizarra
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/agro/balanza/nuevo">
              <Truck className="mr-1 h-4 w-4" /> Pesar camión
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" /> Camiones hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.camionesHoy ?? 0}</p>
            <p className="text-xs text-muted-foreground">{NUM(data?.tnIngresadasHoy ?? 0)} tn ingresadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" /> Contratos abiertos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.contratosPendientes ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              <Link href="/dashboard/agro/contratos" className="text-primary hover:underline">Ver contratos →</Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Liquidaciones pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.liquidacionesPendientes ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              <Link href="/dashboard/agro/liquidaciones" className="text-primary hover:underline">Liquidar →</Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Layers className="h-4 w-4" /> Silos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.stockPorGrano?.length ?? 0} granos</p>
            <p className="text-xs text-muted-foreground">
              {NUM(data?.stockPorGrano?.reduce((s, g) => s + g.totalTn, 0) ?? 0)} tn en stock total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pizarra de precios + Stock */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pizarra */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Pizarra de precios
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pizarra.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos de pizarra. Cargue precios manualmente.</p>
            ) : (
              <div className="divide-y">
                {pizarra.map((p) => (
                  <div key={p.granoId} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{p.nombre}</p>
                      <p className="text-xs text-muted-foreground">{p.fuente ?? "—"} · {p.precio ? "Disponible" : "Sin datos"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {p.precio ? (
                          p.moneda === "USD"
                            ? `USD ${NUM(p.precio, 2)}`
                            : ARS(p.precio)
                        ) : "—"}
                      </p>
                      {p.variacion != null && (
                        <Badge variant={p.variacion >= 0 ? "default" : "destructive"} className="text-xs">
                          {p.variacion >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {p.variacion >= 0 ? "+" : ""}{NUM(p.variacion, 2)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/agro/pizarra">
                  <BarChart3 className="mr-1 h-3 w-3" /> Ver pizarra completa
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stock por grano */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wheat className="h-5 w-5 text-primary" />
              Stock en silos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.stockPorGrano ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin stock registrado.</p>
            ) : (
              <div className="space-y-3">
                {data?.stockPorGrano.map((g) => {
                  const pct = g.capacidadTn > 0 ? Math.round((g.totalTn / g.capacidadTn) * 100) : 0
                  return (
                    <div key={g.nombre}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{g.nombre}</span>
                        <span className="text-muted-foreground">{NUM(g.totalTn)} tn</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{pct}% de {NUM(g.capacidadTn)} tn cap.</p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agricultura 4.0 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudSun className="h-5 w-5 text-sky-600" />
              Clima por campo (Open-Meteo)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(clima?.lotes ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin lotes geolocalizados. Cargue lat/lon en Lotes.</p>
            ) : (
              <div className="space-y-3">
                {clima?.lotes.map((l) => {
                  const maxLluvia = Math.max(...(l.forecast.map((d) => d.lluviaMm).concat([1])))
                  return (
                    <div key={l.loteId} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{l.lote}</p>
                        <Badge variant="outline" className="text-xs">{l.lluvia5d == null ? "Sin datos" : `${NUM(l.lluvia5d, 1)} mm / 5d`}</Badge>
                      </div>
                      <div className="flex gap-1">
                        {l.forecast.slice(0, 5).map((d) => (
                          <div key={d.date} className="flex-1">
                            <div className="h-14 rounded bg-sky-50 relative overflow-hidden border border-sky-100">
                              <div
                                className="absolute bottom-0 left-0 right-0 bg-sky-400/70 transition-all"
                                style={{ height: `${Math.round((d.lluviaMm / maxLluvia) * 100)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-center mt-1 text-muted-foreground">{new Date(d.date).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-emerald-600" />
              Salud de cultivo (NDVI)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(ndvi?.lotes ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin lotes para evaluar NDVI.</p>
            ) : (
              <div className="space-y-3">
                <div className="rounded-md bg-muted px-3 py-2 text-sm">
                  NDVI promedio: <span className="font-semibold">{NUM(ndvi?.promedioNdvi ?? 0, 3)}</span>
                  <Badge variant="outline" className="ml-2 text-[10px]">MVP</Badge>
                </div>
                {ndvi?.lotes.map((l) => {
                  const pct = Math.round(l.ndvi * 100)
                  const tone =
                    l.estado === "excelente" ? "bg-emerald-500" :
                    l.estado === "bueno" ? "bg-lime-500" :
                    l.estado === "atencion" ? "bg-amber-500" : "bg-red-500"
                  return (
                    <div key={l.loteId} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{l.lote}</p>
                        <Badge variant={l.estado === "critico" ? "destructive" : "secondary"} className="text-xs capitalize">{l.estado}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{l.cultivo}</p>
                      <div className="h-2 rounded bg-muted overflow-hidden">
                        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">NDVI {NUM(l.ndvi, 3)} ({pct}%)</p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/dashboard/agro/balanza", label: "Balanza", desc: "Ver tickets", icon: Truck },
          { href: "/dashboard/agro/contratos", label: "Contratos", desc: "Cereales", icon: FileText },
          { href: "/dashboard/agro/liquidaciones", label: "Liquidaciones", desc: "A productores", icon: DollarSign },
          { href: "/dashboard/agro/lotes", label: "Lotes / Campos", desc: "Agricultura 4.0", icon: Wheat },
          { href: "/dashboard/agro/carta-porte", label: "Carta de Porte", desc: "CPE AFIP", icon: ShieldCheck },
          { href: "/dashboard/agro/productor", label: "Portal Productor", desc: "Saldos y liquidaciones", icon: Layers },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors"
          >
            <item.icon className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  )
}
