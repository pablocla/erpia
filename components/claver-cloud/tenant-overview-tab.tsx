"use client"

import Link from "next/link"
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Circle,
  ExternalLink,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type {
  TenantActivityItem,
  TenantHealth,
  TenantLifecycle,
  TenantPipelineLeadSummary,
} from "@/lib/ops/tenant-lifecycle-service"

const HEALTH_DOT = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  error: "bg-red-500",
}

const fmtFecha = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))

export interface TenantOverviewTabProps {
  lifecycle: TenantLifecycle
  health: TenantHealth
  recentActivity: TenantActivityItem[]
  pipelineLead: TenantPipelineLeadSummary | null
  proyecto: { id: number; codigo: string; faseActual: string; porcentajeAvance: number } | null
  readiness: {
    listoGoLive: boolean
    score: number
  }
  stats: {
    productosActivos: number
    productosCatalogo: number
    tareasPendientes: number
  }
}

export function TenantOverviewTab({
  lifecycle,
  health,
  recentActivity,
  pipelineLead,
  proyecto,
  readiness,
  stats,
}: TenantOverviewTabProps) {
  return (
    <div className="space-y-6">
      <Card className="border-violet-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-violet-400" />
            Ciclo de vida del recurso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 sm:gap-0">
            {lifecycle.pasos.map((paso, idx) => (
              <div key={paso.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1 min-w-[72px]">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                      paso.actual && "border-violet-500 bg-violet-500/20",
                      paso.completado && !paso.actual && "border-emerald-500 bg-emerald-500/10",
                      !paso.completado && !paso.actual && "border-muted bg-muted/30",
                    )}
                  >
                    {paso.completado ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : paso.actual ? (
                      <Circle className="h-4 w-4 text-violet-400 fill-violet-400/30" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] text-center leading-tight",
                      paso.actual ? "text-violet-300 font-medium" : "text-muted-foreground",
                    )}
                  >
                    {paso.label}
                  </span>
                </div>
                {idx < lifecycle.pasos.length - 1 && (
                  <div
                    className={cn(
                      "hidden sm:block h-0.5 w-8 lg:w-12 mx-1",
                      paso.completado ? "bg-emerald-500/60" : "bg-border",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          {(lifecycle.estado === "suspendido" || lifecycle.estado === "baja") && (
            <p className="mt-4 text-sm text-red-400 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Tenant suspendido
              {lifecycle.suspendidoAt && ` desde ${fmtFecha(lifecycle.suspendidoAt)}`}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="SKUs activos" value={`${stats.productosActivos}/${stats.productosCatalogo}`} />
        <KpiCard label="Tareas marketplace" value={String(stats.tareasPendientes)} />
        <KpiCard
          label="CCA"
          value={proyecto ? `${proyecto.porcentajeAvance}%` : "—"}
          sub={proyecto?.faseActual}
        />
        <KpiCard
          label="Go-live"
          value={readiness.listoGoLive ? "Listo" : "Pendiente"}
          ok={readiness.listoGoLive}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", HEALTH_DOT[health.nivel])} />
              Salud operativa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {health.detalles.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between text-sm border rounded-md px-3 py-2"
              >
                <span className="text-muted-foreground">{d.label}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    d.nivel === "ok" && "border-emerald-500/30 text-emerald-400",
                    d.nivel === "warn" && "border-amber-500/30 text-amber-400",
                    d.nivel === "error" && "border-red-500/30 text-red-400",
                  )}
                >
                  {d.valor}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Enlaces rápidos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {pipelineLead && (
              <QuickLink
                href="/claver-cloud/comercial"
                label={`Pipeline: ${pipelineLead.etapaLabel}`}
                detail={pipelineLead.nombre}
              />
            )}
            {proyecto && (
              <QuickLink
                href={`/claver-cloud/implementation/${proyecto.id}`}
                label="Proyecto CCA"
                detail={`${proyecto.codigo} · ${proyecto.faseActual}`}
              />
            )}
            <QuickLink href="/claver-cloud/registros" label="Registros web" />
            <QuickLink href="/claver-cloud/marketplace" label="Torre marketplace" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((item) => (
                <li key={item.id} className="flex gap-3 text-sm border-b border-border/50 pb-3 last:border-0 last:pb-0">
                  <div className="shrink-0 w-16 text-[10px] text-muted-foreground pt-0.5">
                    {fmtFecha(item.createdAt)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {item.tipo}
                      </Badge>
                      {item.severidad && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            (item.severidad === "error" || item.severidad === "fatal") &&
                              "border-red-500/40 text-red-400",
                          )}
                        >
                          {item.severidad}
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium mt-0.5">{item.titulo}</p>
                    {item.detalle && (
                      <p className="text-xs text-muted-foreground truncate">{item.detalle}</p>
                    )}
                  </div>
                  {item.href && (
                    <Button size="sm" variant="ghost" className="shrink-0" asChild>
                      <Link href={item.href}>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Acciones super admin</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>
            <strong className="text-foreground">Provisionar</strong> — crea job + tarea si es SEMI_AUTO/HUMAN_GATE.
          </p>
          <p>
            <strong className="text-foreground">Activar directo</strong> — bypass entitlement sin esperar checklist.
          </p>
          <p>
            <strong className="text-foreground">Diagnosticar</strong> — healthcheck automático desde el header.
          </p>
          <p className="text-xs pt-2 border-t">
            Usá <strong className="text-foreground">Impersonar ERP</strong> para parametrizar con auditoría (sesión 2 h).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  ok,
}: {
  label: string
  value: string
  sub?: string
  ok?: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-2xl font-bold", ok === true && "text-emerald-400", ok === false && "text-amber-400")}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function QuickLink({
  href,
  label,
  detail,
}: {
  href: string
  label: string
  detail?: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/50 transition-colors group"
    >
      <div className="min-w-0">
        <p className="font-medium">{label}</p>
        {detail && <p className="text-xs text-muted-foreground truncate">{detail}</p>}
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
    </Link>
  )
}