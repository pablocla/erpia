"use client"

import * as React from "react"
import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Flame,
  Layers,
  LogIn,
  MoreVertical,
  Plus,
  RefreshCw,
  Rocket,
  ShieldAlert,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cloudAuthHeaders } from "@/lib/claver-cloud/auth-headers"
import { useAuthStore } from "@/lib/stores"
import { cn } from "@/lib/utils"

export type LifecycleStage =
  | "inbound"
  | "trial"
  | "onboarding"
  | "go_live"
  | "paid"
  | "risk"

export type LifecycleTenant = {
  id: number
  nombre: string
  cuit?: string | null
  rubro?: string | null
  etapa: LifecycleStage
  diasDesdeAlta: number
  trialDiasRestantes?: number | null
  trialVencido?: boolean
  readinessScore: number
  mrrArs: number
  entornosError: number
  mpSubscriptionStatus?: string | null
  usuarioPrincipal?: string | null
}

const STAGE_CONFIG: Record<
  LifecycleStage,
  {
    label: string
    shortDesc: string
    color: string
    badgeBg: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  inbound: {
    label: "1. Registro / Lead",
    shortDesc: "Altas web y consultas",
    color: "text-blue-400",
    badgeBg: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    icon: UserPlus,
  },
  trial: {
    label: "2. Trial Activo",
    shortDesc: "Prueba guiada 14 días",
    color: "text-amber-400",
    badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icon: Clock,
  },
  onboarding: {
    label: "3. Setup & AFIP",
    shortDesc: "Datos, CUIT y catálogo",
    color: "text-violet-400",
    badgeBg: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    icon: Wrench,
  },
  go_live: {
    label: "4. Go-Live Aprobado",
    shortDesc: "Checklist PRD completo",
    color: "text-emerald-400",
    badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    icon: Rocket,
  },
  paid: {
    label: "5. Suscripción Paga",
    shortDesc: "MRR activo Mercado Pago",
    color: "text-emerald-300",
    badgeBg: "bg-emerald-600/20 text-emerald-300 border-emerald-500/40",
    icon: CreditCard,
  },
  risk: {
    label: "6. En Riesgo / Churn",
    shortDesc: "Error o trial por vencer",
    color: "text-red-400",
    badgeBg: "bg-red-500/15 text-red-300 border-red-500/30",
    icon: AlertTriangle,
  },
}

export function CustomerLifecyclePipeline({
  onRefresh,
}: {
  onRefresh?: () => void
}) {
  const [tenants, setTenants] = React.useState<LifecycleTenant[]>([])
  const [loading, setLoading] = React.useState(true)
  const [impersonatingId, setImpersonatingId] = React.useState<number | null>(null)
  const [actionBusyId, setActionBusyId] = React.useState<number | null>(null)
  const login = useAuthStore((s) => s.login)

  const cargar = React.useCallback(async () => {
    setLoading(true)
    try {
      // Obtenemos tenants y métricas
      const [altasRes, fleetRes] = await Promise.all([
        fetch("/api/claver/ops/registros-web", { headers: cloudAuthHeaders() }),
        fetch("/api/claver/ops/clientes", { headers: cloudAuthHeaders() }),
      ])

      const altasData = altasRes.ok ? await altasRes.json() : { rows: [] }
      const fleetData = fleetRes.ok ? await fleetRes.json() : { data: [] }

      const rawAltas = (altasData.rows ?? []) as Array<any>
      const rawFleet = (fleetData.data ?? []) as Array<any>

      // Fusionar y clasificar por etapa
      const unified: LifecycleTenant[] = []

      // Procesar clientes
      const allEmpresas = new Map<number, any>()
      for (const f of rawFleet) allEmpresas.set(f.id, f)
      for (const a of rawAltas) {
        if (!allEmpresas.has(a.empresaId)) {
          allEmpresas.set(a.empresaId, {
            id: a.empresaId,
            nombre: a.nombre,
            rubro: a.rubro,
            cuit: a.cuit,
            entornos: [],
            metricas: { ticketsAbiertos: 0, jobsActivos: 0, logsError: 0 },
            _alta: a,
          })
        } else {
          allEmpresas.get(a.empresaId)._alta = a
        }
      }

      for (const [id, e] of allEmpresas.entries()) {
        const alta = e._alta
        const dias = alta?.diasDesdeAlta ?? 1
        const trialRest = alta?.trial?.diasRestantes ?? (alta?.trial?.activo ? 14 : null)
        const trialExpirado = alta?.trial?.expirado ?? (trialRest !== null && trialRest <= 0)
        const hasError = (e.entornos ?? []).some((env: any) => env.estado === "error") || (e.metricas?.logsError ?? 0) > 0
        const isPaid = e.planHosting === "dedicated" || alta?.mrrArs > 0

        let etapa: LifecycleStage = "inbound"

        if (hasError || (trialExpirado && !isPaid)) {
          etapa = "risk"
        } else if (isPaid) {
          etapa = "paid"
        } else if (dias <= 3 && !alta?.cuit) {
          etapa = "inbound"
        } else if (alta?.cuit && dias <= 14 && !isPaid) {
          etapa = trialRest !== null && trialRest > 7 ? "trial" : "onboarding"
        } else if (alta?.cuit && (trialRest === null || trialRest > 0)) {
          etapa = "go_live"
        } else {
          etapa = "trial"
        }

        unified.push({
          id,
          nombre: e.nombre,
          cuit: e.cuit || alta?.cuit,
          rubro: e.rubro,
          etapa,
          diasDesdeAlta: dias,
          trialDiasRestantes: trialRest,
          trialVencido: trialExpirado,
          readinessScore: e.readinessScore ?? 65,
          mrrArs: alta?.mrrArs ?? (isPaid ? 49000 : 0),
          entornosError: hasError ? 1 : 0,
          mpSubscriptionStatus: isPaid ? "authorized" : null,
          usuarioPrincipal: alta?.usuarioPrincipal?.email,
        })
      }

      setTenants(unified)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void cargar()
  }, [cargar])

  // Acción 1-click: Impersonar tenant
  const impersonarTenant = async (empresaId: number, targetPath = "/dashboard") => {
    setImpersonatingId(empresaId)
    try {
      const analystToken = localStorage.getItem("token")
      const analystUser = useAuthStore.getState().user
      if (analystToken) sessionStorage.setItem("claver_analyst_token", analystToken)
      if (analystUser) sessionStorage.setItem("claver_analyst_user", JSON.stringify(analystUser))

      const res = await fetch(`/api/claver/tenants/${empresaId}/impersonate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...cloudAuthHeaders() },
        body: JSON.stringify({ targetPath }),
      })
      if (!res.ok) {
        alert("No se pudo iniciar sesión en ese tenant. Verificá permisos.")
        return
      }
      const session = await res.json()
      login(session.token, {
        id: String(analystUser?.id ?? "0"),
        email: analystUser?.email ?? "",
        nombre: `Analista → ${session.empresa.nombre}`,
        rol: "administrador",
        empresaId: session.empresa.id,
        empresaNombre: session.empresa.nombre,
      })
      window.location.href = session.redirectUrl || targetPath
    } finally {
      setImpersonatingId(null)
    }
  }

  const extenderTrial = async (empresaId: number) => {
    setActionBusyId(empresaId)
    try {
      await fetch("/api/claver/ops/registros-web", {
        method: "PATCH",
        headers: cloudAuthHeaders(true),
        body: JSON.stringify({ action: "extend_trial", empresaId, dias: 7 }),
      })
      await cargar()
      onRefresh?.()
    } finally {
      setActionBusyId(null)
    }
  }

  const stages: LifecycleStage[] = ["inbound", "trial", "onboarding", "go_live", "paid", "risk"]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5 text-violet-400" />
            Ciclo de Vida del Cliente (Customer Lifecycle)
          </h2>
          <p className="text-xs text-muted-foreground">
            Pipeline lineal: desde el primer registro hasta la producción paga y prevención de churn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void cargar()
              onRefresh?.()
            }}
            disabled={loading}
            className="h-8 text-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
            Actualizar
          </Button>
          <Button size="sm" asChild className="h-8 text-xs bg-violet-600 hover:bg-violet-500">
            <Link href="/claver-cloud/provisioning/new">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Nueva Empresa
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 overflow-x-auto">
        {stages.map((st) => {
          const cfg = STAGE_CONFIG[st]
          const list = tenants.filter((t) => t.etapa === st)
          const Icon = cfg.icon

          return (
            <div
              key={st}
              className="flex flex-col rounded-xl border bg-card/40 p-3 min-w-[210px] space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon className={cn("h-4 w-4", cfg.color)} />
                  <span className="text-xs font-semibold">{cfg.label}</span>
                </div>
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", cfg.badgeBg)}>
                  {list.length}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">{cfg.shortDesc}</p>

              <div className="space-y-2 flex-1">
                {list.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center text-[11px] text-muted-foreground">
                    Sin tenants acá
                  </div>
                ) : (
                  list.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-lg border bg-background/80 p-2.5 text-xs space-y-2 shadow-xs hover:border-violet-500/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <Link
                            href={`/claver-cloud/tenants/${t.id}`}
                            className="font-semibold block truncate hover:text-violet-300"
                            title={t.nombre}
                          >
                            {t.nombre}
                          </Link>
                          <span className="text-[10px] text-muted-foreground block truncate">
                            #{t.id} {t.rubro ? `· ${t.rubro}` : ""}
                          </span>
                        </div>

                        {t.trialDiasRestantes !== null && t.trialDiasRestantes !== undefined && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] px-1 shrink-0 font-mono",
                              t.trialDiasRestantes > 3
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-amber-500/15 text-amber-400",
                            )}
                          >
                            {t.trialDiasRestantes}d trial
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                        <span>Antigüedad: {t.diasDesdeAlta}d</span>
                        {t.mrrArs > 0 && (
                          <span className="text-emerald-400 font-semibold font-mono">
                            ${(t.mrrArs / 1000).toFixed(0)}k/m
                          </span>
                        )}
                      </div>

                      {/* Botones de acción directa */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 flex-1 text-[11px] px-2 font-medium bg-violet-500/15 text-violet-200 hover:bg-violet-500/25"
                          onClick={() => void impersonarTenant(t.id)}
                          disabled={impersonatingId === t.id}
                        >
                          <LogIn className="h-3 w-3 mr-1 text-violet-400" />
                          {impersonatingId === t.id ? "Abriendo..." : "Entrar ERP"}
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem asChild>
                              <Link href={`/claver-cloud/tenants/${t.id}`}>
                                <Building2 className="h-3.5 w-3.5 mr-2" />
                                Ficha Técnica Completa
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/claver-cloud/operations/${t.id}`}>
                                <Activity className="h-3.5 w-3.5 mr-2" />
                                Consola de Operaciones
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/claver-cloud/go-live?empresaId=${t.id}`}>
                                <Rocket className="h-3.5 w-3.5 mr-2" />
                                Checklist Go-Live PRD
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => void extenderTrial(t.id)}
                              disabled={actionBusyId === t.id}
                            >
                              <Clock className="h-3.5 w-3.5 mr-2 text-amber-400" />
                              Extender Trial (+7 días)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
