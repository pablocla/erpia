"use client"

import { useState, useEffect } from "react"
import {
  Target,
  TrendingUp,
  Users,
  Percent,
  Calendar,
  DollarSign,
  Send,
  Smartphone,
  Award,
  Sparkles,
  Calculator,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAuthHeaders } from "@/lib/stores/auth-store"

type ClienteEnRiesgo = {
  id: number
  nombre: string
  telefono: string
  frecuenciaDias: number
  ultimoPagoDias: number
  comprasTotales: number
  ltvAcumulado: number
  estadoReactivacion?: "pendiente" | "enviando" | "enviado"
}

type ClientePremium = {
  rank: number
  nombre: string
  comprasCount: number
  ticketPromedio: number
  ltv: number
  fidelidad: "Platino" | "Oro" | "Plata"
}

export default function RetencionClientesPage() {
  // Simulador de LTV & Retención
  const [ticketPromedio, setTicketPromedio] = useState<number>(8500)
  const [frecuenciaMensual, setFrecuenciaMensual] = useState<number>(4)
  const [vidaMediaMeses, setVidaMediaMeses] = useState<number>(24)
  const [clientesActivos, setClientesActivos] = useState<number>(850)
  const [recuperacionObjetivo, setRecuperacionObjetivo] = useState<number>(10)

  // Clientes en riesgo
  const [clientesRiesgo, setClientesRiesgo] = useState<ClienteEnRiesgo[]>([
    { id: 1, nombre: "Juan Carlos Pérez", telefono: "+543415551234", frecuenciaDias: 7, ultimoPagoDias: 22, comprasTotales: 42, ltvAcumulado: 385000 },
    { id: 2, nombre: "María Isabel Gómez", telefono: "+543415555678", frecuenciaDias: 15, ultimoPagoDias: 41, comprasTotales: 18, ltvAcumulado: 172000 },
    { id: 3, nombre: "Carlos Alberto Rossi", telefono: "+543415559012", frecuenciaDias: 10, ultimoPagoDias: 29, comprasTotales: 31, ltvAcumulado: 294000 },
    { id: 4, nombre: "Fiambrería El Calpón (B2B)", telefono: "+543415553456", frecuenciaDias: 5, ultimoPagoDias: 14, comprasTotales: 110, ltvAcumulado: 1450000 },
    { id: 5, nombre: "Almacén San José", telefono: "+543415557890", frecuenciaDias: 30, ultimoPagoDias: 75, comprasTotales: 8, ltvAcumulado: 98000 },
  ])

  // Ranking Premium
  const clientesPremium: ClientePremium[] = [
    { rank: 1, nombre: "Fiambrería El Calpón (B2B)", comprasCount: 110, ticketPromedio: 13181, ltv: 1450000, fidelidad: "Platino" },
    { rank: 2, nombre: "Distribuidora Fisherton", comprasCount: 84, ticketPromedio: 10119, ltv: 850000, fidelidad: "Platino" },
    { rank: 3, nombre: "Estancia La Esmeralda", comprasCount: 65, ticketPromedio: 9538, ltv: 620000, fidelidad: "Oro" },
    { rank: 4, nombre: "Juan Carlos Pérez", comprasCount: 42, ticketPromedio: 9166, ltv: 385000, fidelidad: "Oro" },
    { rank: 5, nombre: "Restaurante El Ruedo", comprasCount: 38, ticketPromedio: 9210, ltv: 350000, fidelidad: "Oro" },
  ]

  // Cálculos del simulador
  const ltvUnitario = ticketPromedio * frecuenciaMensual * vidaMediaMeses
  const ltvTotalCartera = ltvUnitario * clientesActivos
  const clientesARecuperar = Math.round(clientesActivos * (recuperacionObjetivo / 100))
  const oportunidadRecuperoMensual = clientesARecuperar * (ticketPromedio * frecuenciaMensual)
  const oportunidadLtvLargoPlazo = clientesARecuperar * ltvUnitario

  const fmt = (n: number) =>
    n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

  const handleReactivar = (id: number, telefono: string, nombre: string) => {
    setClientesRiesgo((prev) =>
      prev.map((c) => (c.id === id ? { ...c, estadoReactivacion: "enviando" } : c)),
    )

    setTimeout(() => {
      setClientesRiesgo((prev) =>
        prev.map((c) => (c.id === id ? { ...c, estadoReactivacion: "enviado" } : c)),
      )
    }, 1200)
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Retención de Clientes y LTV</h1>
          <p className="text-muted-foreground mt-1">
            Enfoque en la relación a largo plazo y rentabilidad por cliente en vez de ganancia individual por producto.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-emerald-500 border-emerald-500 bg-emerald-500/10 px-3 py-1 font-semibold">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Claver AutoPool Activo
          </Badge>
        </div>
      </div>

      {/* Grid de Tarjetas KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">LTV Unitario Promedio</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{fmt(ltvUnitario)}</div>
            <p className="text-xs text-muted-foreground mt-1">Valor proyectado por cliente activo</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Retención (CRR)</CardTitle>
            <Percent className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">76.4%</div>
            <p className="text-xs text-muted-foreground mt-1">+1.2% respecto al mes pasado</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes en Riesgo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">34</div>
            <p className="text-xs text-muted-foreground mt-1">Detección automática por inactividad</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Frecuencia de Compra</CardTitle>
            <Calendar className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-500">7.2 días</div>
            <p className="text-xs text-muted-foreground mt-1">Intervalo promedio entre tickets</p>
          </CardContent>
        </Card>
      </div>

      {/* Simulador Interactivo LTV y ROI */}
      <Card className="border border-border/80 shadow-md">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Simulador de Oportunidad Financiera a Largo Plazo</CardTitle>
              <CardDescription>
                Proyectá la facturación adicional optimizando la retención y el LTV en tu cartera de Rosario.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 grid gap-6 md:grid-cols-2">
          {/* Sliders de Configuración */}
          <div className="space-y-5 pr-0 md:pr-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <Label htmlFor="ticket">Ticket Promedio</Label>
                <span className="text-emerald-500 font-bold">{fmt(ticketPromedio)}</span>
              </div>
              <input
                id="ticket"
                type="range"
                min="2000"
                max="30000"
                step="500"
                value={ticketPromedio}
                onChange={(e) => setTicketPromedio(Number(e.target.value))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <Label htmlFor="frecuencia">Frecuencia de Visita Mensual</Label>
                <span className="text-emerald-500 font-bold">{frecuenciaMensual} veces</span>
              </div>
              <input
                id="frecuencia"
                type="range"
                min="1"
                max="15"
                step="1"
                value={frecuenciaMensual}
                onChange={(e) => setFrecuenciaMensual(Number(e.target.value))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <Label htmlFor="vidaMedia">Vida Media del Cliente</Label>
                <span className="text-emerald-500 font-bold">{vidaMediaMeses} meses</span>
              </div>
              <input
                id="vidaMedia"
                type="range"
                min="3"
                max="60"
                step="3"
                value={vidaMediaMeses}
                onChange={(e) => setVidaMediaMeses(Number(e.target.value))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <Label htmlFor="recuperacion">Objetivo de Recuperación</Label>
                <span className="text-emerald-500 font-bold">{recuperacionObjetivo}% de clientes dormidos</span>
              </div>
              <input
                id="recuperacion"
                type="range"
                min="5"
                max="50"
                step="5"
                value={recuperacionObjetivo}
                onChange={(e) => setRecuperacionObjetivo(Number(e.target.value))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          {/* Resultados de la Simulación */}
          <div className="bg-muted/40 rounded-xl p-6 flex flex-col justify-between border border-border/50">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Impacto en el Negocio</h3>
              
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Oportunidad de Facturación Mensual Inmediata:</span>
                <span className="text-2xl font-extrabold text-blue-500">{fmt(oportunidadRecuperoMensual)}</span>
              </div>

              <div className="space-y-1 border-t border-border pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground block">Impacto en LTV a Largo Plazo ({vidaMediaMeses} meses):</span>
                  <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/20 bg-emerald-500/5">Proyección Relación</Badge>
                </div>
                <span className="text-3xl font-extrabold text-emerald-500">{fmt(oportunidadLtvLargoPlazo)}</span>
              </div>
            </div>

            <div className="mt-6 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10 flex items-start gap-2.5">
              <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-500/90 leading-normal">
                Recuperando <b>{clientesARecuperar} clientes dormidos</b> en Rosario, cada uno aportará un valor de <b>{fmt(ltvUnitario)}</b> a lo largo del tiempo de su relación con tu almacén.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Central: Clientes en riesgo & Leaderboard */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Clientes en Riesgo */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Alertas de Churn: Clientes en Riesgo</CardTitle>
                <CardDescription>Clientes que compran habitualmente y superaron su frecuencia normal.</CardDescription>
              </div>
              <Badge variant="outline" className="border-amber-500/20 text-amber-500 bg-amber-500/5">
                Reactivación Inteligente
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-muted/40 text-xs font-semibold uppercase text-muted-foreground border-y border-border">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Frecuencia Habitual</th>
                    <th className="px-4 py-3">Última Visita</th>
                    <th className="px-4 py-3">LTV Acumulado</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clientesRiesgo.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold">{c.nombre}</div>
                        <div className="text-xs text-muted-foreground">{c.telefono}</div>
                      </td>
                      <td className="px-4 py-3.5">Cada {c.frecuenciaDias} días</td>
                      <td className="px-4 py-3.5">
                        <span className={c.ultimoPagoDias > c.frecuenciaDias * 2 ? "text-rose-500 font-medium" : "text-amber-500 font-medium"}>
                          Hace {c.ultimoPagoDias} días
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium">{fmt(c.ltvAcumulado)}</td>
                      <td className="px-4 py-3.5 text-right">
                        {c.estadoReactivacion === "enviado" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-1 font-semibold flex items-center justify-end w-fit ml-auto gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Enviado
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-500 border-blue-500/20 hover:bg-blue-500/5 gap-1.5 h-8 font-medium"
                            disabled={c.estadoReactivacion === "enviando"}
                            onClick={() => handleReactivar(c.id, c.telefono, c.nombre)}
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            {c.estadoReactivacion === "enviando" ? "Enviando..." : "Reactivar WA"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard de Relación a Largo Plazo */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-1.5">
              <Award className="w-5 h-5 text-amber-500" />
              <CardTitle>Top Spenders (Max LTV)</CardTitle>
            </div>
            <CardDescription>Nuestros clientes con mayor lealtad y valor histórico acumulado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {clientesPremium.map((c) => (
              <div key={c.rank} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-muted-foreground w-4">{c.rank}.</span>
                    <span className="font-semibold text-sm leading-none">{c.nombre}</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-5">
                    {c.comprasCount} compras · Ticket: {fmt(c.ticketPromedio)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-500">{fmt(c.ltv)}</div>
                  <Badge variant="outline" className={
                    c.fidelidad === "Platino"
                      ? "text-purple-500 border-purple-500/20 bg-purple-500/5 text-[10px]"
                      : "text-amber-500 border-amber-500/20 bg-amber-500/5 text-[10px]"
                  }>
                    {c.fidelidad}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
