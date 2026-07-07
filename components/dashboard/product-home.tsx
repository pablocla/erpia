"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MotionCard, MotionNumber } from "@/components/ui/motion"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import React from "react"

export interface ProductHomeKPI {
  id: string
  titulo: string
  valor: string
  rawValue?: number
  format?: "currency" | "number" | "text"
  subtitulo?: string
  icon: React.ElementType
  colorClass?: string
  href?: string
  variacion?: number
}

export interface ProductHomeAction {
  label: string
  description: string
  href: string
}

interface ProductHomeProps {
  marca: string
  kpis: ProductHomeKPI[]
  actions: ProductHomeAction[]
  chart?: React.ReactNode
}

function KPICard({ kpi }: { kpi: ProductHomeKPI }) {
  const Icon = kpi.icon
  const card = (
    <MotionCard hover={!!kpi.href}>
      <Card className={`glass-panel border-border/50 relative overflow-hidden group ${kpi.href ? "cursor-pointer hover:shadow-lg transition-all" : ""}`}>
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors pointer-events-none" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.titulo}</CardTitle>
          <Icon className={`h-4 w-4 ${kpi.colorClass || "text-muted-foreground"}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${kpi.colorClass || ""}`}>
            {kpi.rawValue !== undefined && kpi.format !== "text" ? (
              <MotionNumber
                value={kpi.rawValue}
                format={(n) =>
                  kpi.format === "number"
                    ? n.toLocaleString("es-AR")
                    : new Intl.NumberFormat("es-AR", {
                        style: "currency",
                        currency: "ARS",
                        maximumFractionDigits: 0,
                      }).format(n)
                }
              />
            ) : (
              kpi.valor
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {kpi.subtitulo && <p className="text-xs text-muted-foreground">{kpi.subtitulo}</p>}
            {kpi.variacion !== undefined && (
              <span className={`text-xs flex items-center gap-0.5 ${kpi.variacion >= 0 ? "text-green-600" : "text-red-600"}`}>
                {kpi.variacion >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(kpi.variacion)}% vs mes ant.
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </MotionCard>
  )

  return kpi.href ? <Link href={kpi.href}>{card}</Link> : card
}

export function ProductHome({ marca, kpis, actions, chart }: ProductHomeProps) {
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Bienvenido a {marca}</h1>
        <p className="text-muted-foreground mt-1">Tu resumen de hoy.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map(kpi => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {chart && (
        <div className="mt-6">
          {chart}
        </div>
      )}
      {actions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Acciones rápidas</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {actions.map((action, idx) => (
              <Link 
                key={idx} 
                href={action.href} 
                className="group relative flex flex-col items-start justify-between rounded-xl border bg-white p-5 shadow-sm transition-all hover:border-primary hover:shadow-md hover:ring-1 hover:ring-primary/20"
              >
                <div>
                  <h3 className="font-semibold text-slate-900">{action.label}</h3>
                  <p className="mt-1 text-sm text-slate-500">{action.description}</p>
                </div>
                <div className="mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
