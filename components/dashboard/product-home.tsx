"use client"

import Link from "next/link"
import {
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Plus,
  ExternalLink,
  BookOpen,
  type LucideIcon,
} from "lucide-react"
import type { ProductShellConfig } from "@/lib/comercial/product-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface ProductHomeKPI {
  id: string
  titulo: string
  valor: string
  rawValue?: number
  format?: "currency" | "number" | "text"
  icon: LucideIcon
  colorClass?: string
  href?: string
}

export interface ProductHomeAction {
  label: string
  description?: string
  href: string
}

interface ProductHomeProps {
  shell?: ProductShellConfig
  marca?: string
  kpis?: ProductHomeKPI[]
  actions?: ProductHomeAction[]
}

export function ProductHome({ shell, marca, kpis, actions }: ProductHomeProps) {
  const displayMarca = shell?.marca ?? marca ?? "Claver Sub-SaaS"
  const IconoMarca = shell?.icono ?? BookOpen

  const displayKpis =
    kpis ??
    shell?.kpis.map((k) => ({
      id: k.id,
      titulo: k.label,
      valor: k.format === "currency" ? "$0" : k.format === "number" ? "0" : "Al día",
      icon: k.icon,
      href: k.href,
    })) ??
    []

  const primaryAction = shell?.primaryAction ?? actions?.[0] ?? { label: "Ir a sección", href: "/dashboard" }
  const secondaryActions = actions
    ? actions.slice(1)
    : shell?.tabs
        .filter((t) => t.href !== "#more" && t.href !== primaryAction.href)
        .slice(0, 3)
        .map((t) => ({ label: t.label, href: t.href })) ?? []

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header del Sub-SaaS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-card border rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
            <IconoMarca className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{displayMarca}</h1>
              <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20 font-semibold">
                Sub-SaaS Activo
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Panel simplificado de operaciones · Modo autónomo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="lg" className="rounded-xl shadow-md gap-2 font-semibold">
            <Link href={primaryAction.href}>
              <Plus className="h-5 w-5" />
              {primaryAction.label}
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 KPIs del Dolor del Rubro */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {displayKpis.map((kpi) => {
          const KpiIcon = kpi.icon || BookOpen
          const isLink = Boolean(kpi.href)
          const CardContentInner = (
            <Card className="h-full border-muted/80 hover:shadow-md hover:border-primary/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                  {kpi.titulo}
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                  <KpiIcon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{kpi.valor}</div>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  Actualizado en vivo
                </p>
              </CardContent>
            </Card>
          )

          return isLink ? (
            <Link key={kpi.id} href={kpi.href!} className="block group">
              {CardContentInner}
            </Link>
          ) : (
            <div key={kpi.id} className="block group">
              {CardContentInner}
            </div>
          )
        })}
      </div>

      {/* Accesos Rápidos y Tablas por Producto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-muted/80">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Accesos Rápidos del Producto</span>
              <Sparkles className="h-4 w-4 text-primary" />
            </CardTitle>
            <CardDescription>
              Operaciones principales para gestionar {displayMarca} sin fricción.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[primaryAction, ...secondaryActions].slice(0, 4).map((act, idx) => (
              <Link
                key={idx}
                href={act.href}
                className="flex items-center justify-between p-4 rounded-xl border bg-muted/30 hover:bg-primary/5 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center border group-hover:border-primary/30 transition-all">
                    <BookOpen className="h-4 w-4 text-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {act.label}
                    </div>
                    <div className="text-xs text-muted-foreground">Ir a sección</div>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Card de Guía / Ayuda Rápida */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Modo Autónomo</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Estás operando en modo simplificado de {displayMarca}. El módulo de contabilidad general y compras sigue activo en segundo plano.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-background/80 rounded-xl border text-xs text-muted-foreground space-y-1">
              <div className="font-semibold text-foreground">¿Querés ver el ERP completo?</div>
              <div>Podés cambiar a modo avanzado en la configuración de la barra lateral.</div>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full justify-between">
              <Link href="/dashboard/configuracion">
                <span>Ajustes del producto</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
