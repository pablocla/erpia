"use client"

import Link from "next/link"
import {
  ArrowLeft,
  Building2,
  Link2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Server,
  Stethoscope,
  UserCog,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TenantHealth, TenantLifecycle } from "@/lib/ops/tenant-lifecycle-service"

const fmtArs = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

const LIFECYCLE_STYLES: Record<string, string> = {
  prospecto: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  trial: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  implementacion: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  activo: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  suspendido: "bg-red-500/15 text-red-300 border-red-500/30",
  baja: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
}

const HEALTH_STYLES = {
  ok: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  warn: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  error: "bg-red-500/15 text-red-300 border-red-500/30",
}

export interface TenantResourceHeaderProps {
  empresa: {
    id: number
    nombre: string
    razonSocial: string
    cuit: string | null
    rubro: string
    entornoAfip: string | null
    planHosting: string | null
  }
  lifecycle: TenantLifecycle
  health: TenantHealth
  readinessScore: number
  listoGoLive: boolean
  productosActivos: number
  productosCatalogo: number
  billing?: {
    mrrTotalArs: number
    mpSubscriptionStatus: string | null
    plan: string
  }
  comercial?: {
    origenLabel: string
    diasDesdeAlta: number
    trial?: { activo: boolean; diasRestantes: number } | null
  }
  loading?: boolean
  actionLoading?: string | null
  onRefresh: () => void
  onImpersonate: () => void
  onDiagnosticar: () => void
  onLifecycle: (action: "suspend" | "reactivate") => void
}

export function TenantResourceHeader({
  empresa,
  lifecycle,
  health,
  readinessScore,
  listoGoLive,
  productosActivos,
  productosCatalogo,
  billing,
  comercial,
  loading,
  actionLoading,
  onRefresh,
  onImpersonate,
  onDiagnosticar,
  onLifecycle,
}: TenantResourceHeaderProps) {
  const canSuspend = lifecycle.accionesDisponibles.includes("suspend")
  const canReactivate = lifecycle.accionesDisponibles.includes("reactivate")

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 -ml-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/claver-cloud">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Centro de mando
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/claver-cloud/operations">
            <Server className="h-4 w-4 mr-1" />
            Operations
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/claver-cloud/go-live">
            <PlayCircle className="h-4 w-4 mr-1" />
            Go-live
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/claver-cloud/registros">
            <Link2 className="h-4 w-4 mr-1" />
            Registros web
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-primary">
            <Building2 className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">Tenant · #{empresa.id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-[var(--font-fraunces)]">
            {empresa.nombre}
          </h1>
          <p className="text-sm text-muted-foreground">
            {empresa.razonSocial} · CUIT {empresa.cuit ?? "s/d"} · {empresa.rubro}
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn("text-sm font-semibold", LIFECYCLE_STYLES[lifecycle.estado])}
            >
              {lifecycle.label}
            </Badge>
            <Badge variant="outline" className={cn("text-sm", HEALTH_STYLES[health.nivel])}>
              {health.label}
            </Badge>
            <Badge variant="outline">AFIP: {empresa.entornoAfip ?? "homologación"}</Badge>
            <Badge variant="outline">{empresa.planHosting === "dedicated" ? "Dedicated" : "Shared"}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{lifecycle.descripcion}</p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading} className="min-h-[40px]">
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Actualizar
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={onImpersonate}
            disabled={!!actionLoading || lifecycle.estado === "suspendido"}
            className="min-h-[40px]"
          >
            <UserCog className="h-4 w-4 mr-2" />
            Impersonar ERP
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDiagnosticar}
            disabled={actionLoading === "diagnosticar"}
            className="min-h-[40px]"
          >
            <Stethoscope className="h-4 w-4 mr-2" />
            Diagnosticar
          </Button>
          {canSuspend && (
            <Button
              size="sm"
              variant="outline"
              className="border-[var(--status-error-border)] text-[var(--status-error-foreground)] hover:bg-[var(--status-error-muted)] min-h-[40px]"
              onClick={() => onLifecycle("suspend")}
              disabled={actionLoading === "suspend"}
            >
              <PauseCircle className="h-4 w-4 mr-2" />
              Suspender
            </Button>
          )}
          {canReactivate && (
            <Button
              size="sm"
              variant="outline"
              className="border-[var(--status-success-border)] text-[var(--status-success-foreground)] hover:bg-[var(--status-success-muted)] min-h-[40px]"
              onClick={() => onLifecycle("reactivate")}
              disabled={actionLoading === "reactivate"}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Reactivar
            </Button>
          )}
          <Button size="sm" variant="outline" asChild className="min-h-[40px]">
            <Link href={`/claver-cloud/operations/${empresa.id}`}>
              <Server className="h-4 w-4 mr-2" />
              Ops tenant
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild className="min-h-[40px]">
            <Link href={`/claver-cloud/implementation`}>
              Implementación
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 rounded-xl border bg-card/50 p-3">
        <StatusCell label="SKUs activos" value={`${productosActivos}/${productosCatalogo}`} />
        <StatusCell
          label="Readiness"
          value={`${readinessScore}%`}
          highlight={listoGoLive ? "ok" : "warn"}
        />
        {billing && (
          <StatusCell label="MRR" value={fmtArs(billing.mrrTotalArs)} />
        )}
        {billing?.mpSubscriptionStatus && (
          <StatusCell label="Mercado Pago" value={billing.mpSubscriptionStatus} />
        )}
        {comercial && (
          <StatusCell label="Origen" value={comercial.origenLabel} />
        )}
        {comercial?.trial?.activo && (
          <StatusCell label="Trial" value={`${comercial.trial.diasRestantes}d`} highlight="warn" />
        )}
        {!comercial?.trial?.activo && comercial && (
          <StatusCell label="Antigüedad" value={`${comercial.diasDesdeAlta}d`} />
        )}
        <StatusCell
          label="Tickets"
          value={String(health.ticketsAbiertos)}
          highlight={health.ticketsAbiertos > 0 ? "warn" : "ok"}
        />
      </div>
    </div>
  )
}

function StatusCell({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: "ok" | "warn" | "error"
}) {
  return (
    <div className="space-y-0.5 min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{label}</p>
      <p
        className={cn(
          "text-sm font-semibold truncate",
          highlight === "ok" && "text-emerald-400",
          highlight === "warn" && "text-amber-400",
          highlight === "error" && "text-red-400",
        )}
      >
        {value}
      </p>
    </div>
  )
}