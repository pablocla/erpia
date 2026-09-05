"use client"

import * as React from "react"
import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cloudAuthHeaders } from "@/lib/claver-cloud/auth-headers"
import { cn } from "@/lib/utils"

export type StatusChecks = {
  database?: boolean
  directUrl?: boolean
  jwt?: boolean
  vercel?: boolean
  vercelEnv?: string
  mpConfigured?: boolean
  mpMock?: boolean
  mpWebhookSecret?: boolean
  resend?: boolean
  twilio?: boolean
  gemini?: boolean
  cronSecret?: boolean
  afipProd?: boolean
}

export type DeploymentStatusData = {
  go: boolean
  message: string
  webhookUrl?: string
  checks: StatusChecks
  bloqueantes?: string[]
  advertencias?: string[]
  missingCriticalCount?: number
}

export function LiveDeploymentStatusPill({ className }: { className?: string }) {
  const [data, setData] = React.useState<DeploymentStatusData | null>(null)
  const [loading, setLoading] = React.useState(true)

  const checkStatus = React.useCallback(async () => {
    try {
      const res = await fetch("/api/go-live/status", {
        headers: cloudAuthHeaders(),
      })
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void checkStatus()
    const timer = setInterval(() => void checkStatus(), 60_000)
    return () => clearInterval(timer)
  }, [checkStatus])

  if (loading && !data) {
    return (
      <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground px-2.5 py-1 rounded-full border border-border/40 bg-muted/20", className)}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
        </span>
        <span className="font-mono text-[11px]">Verificando...</span>
      </div>
    )
  }

  const isOk = data?.go ?? true
  const mpMock = data?.checks?.mpMock
  const isProd = data?.checks?.vercelEnv === "production" || data?.checks?.afipProd

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/claver-cloud/platform-health"
            className={cn(
              "group inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs transition-all hover:bg-muted/60",
              isOk
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/40 bg-amber-500/10 text-amber-300",
              className,
            )}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  isOk ? "bg-emerald-400" : "bg-amber-400",
                )}
              />
              <span
                className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  isOk ? "bg-emerald-500" : "bg-amber-500",
                )}
              />
            </span>
            <span className="font-medium">
              {isOk ? "Sistemas Online" : "Revisión Req."}
            </span>
            {mpMock && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                MP Mock
              </span>
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">
          <p className="font-semibold">{data?.message || "Estado de la infraestructura"}</p>
          <div className="mt-1 space-y-0.5 text-muted-foreground text-[11px]">
            <p>• BD PostgreSQL: {data?.checks?.database ? "Conectada" : "Error"}</p>
            <p>• Mercado Pago: {mpMock ? "Modo Mock (Sandbox)" : "Producción Activo"}</p>
            <p>• AFIP: {data?.checks?.afipProd ? "Producción" : "Homologación (Testing)"}</p>
            <p>• Entorno: {data?.checks?.vercelEnv || (isProd ? "Producción" : "Desarrollo")}</p>
          </div>
          <p className="mt-1.5 text-[10px] text-violet-300">Clic para abrir Salud de Plataforma →</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function LiveDeploymentStatusBar({
  onRefresh,
}: {
  onRefresh?: () => void
}) {
  const [data, setData] = React.useState<DeploymentStatusData | null>(null)
  const [loading, setLoading] = React.useState(true)

  const cargar = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/go-live/status", {
        headers: cloudAuthHeaders(),
      })
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void cargar()
  }, [cargar])

  const checks = data?.checks ?? {}
  const isGo = data?.go ?? false
  const bloqueantes = data?.bloqueantes ?? []
  const advertencias = data?.advertencias ?? []

  return (
    <Card className={cn(
      "border transition-all shadow-sm",
      isGo ? "border-violet-500/20 bg-gradient-to-r from-violet-500/5 via-background to-background" : "border-amber-500/30 bg-amber-500/5"
    )}>
      <CardHeader className="pb-3 pt-4 px-4 sm:px-6 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "p-2 rounded-lg",
            isGo ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
          )}>
            {isGo ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
          </div>
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              Estado de Despliegue & Producción
              <Badge variant="outline" className={cn(
                "text-[10px] uppercase font-mono",
                isGo ? "border-emerald-500/40 text-emerald-400" : "border-amber-500/40 text-amber-400"
              )}>
                {isGo ? "Go-Live Habilitado" : "Bloqueantes Detectados"}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              {data?.message || "Diagnóstico continuo de microservicios, bases y webhooks."}
            </CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void cargar()
              onRefresh?.()
            }}
            disabled={loading}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
            <Link href="/claver-cloud/platform-health">
              Diagnóstico completo
              <ExternalLink className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-6">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {/* Base de datos */}
          <div className="flex items-center justify-between rounded-lg border bg-background/50 p-2.5 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Database className="h-4 w-4 text-violet-400 shrink-0" />
              <span className="truncate">PostgreSQL / Supabase</span>
            </div>
            <Badge variant="secondary" className={cn(
              "text-[10px]",
              checks.database ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
            )}>
              {checks.database ? "Conectada" : "Falla"}
            </Badge>
          </div>

          {/* Mercado Pago */}
          <div className="flex items-center justify-between rounded-lg border bg-background/50 p-2.5 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Zap className="h-4 w-4 text-blue-400 shrink-0" />
              <span className="truncate">Mercado Pago (Cobros)</span>
            </div>
            <Badge variant="secondary" className={cn(
              "text-[10px]",
              checks.mpMock
                ? "bg-amber-500/15 text-amber-300 font-mono"
                : checks.mpConfigured
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
            )}>
              {checks.mpMock ? "Mock / Dev" : checks.mpConfigured ? "Producción" : "Sin Token"}
            </Badge>
          </div>

          {/* AFIP */}
          <div className="flex items-center justify-between rounded-lg border bg-background/50 p-2.5 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Server className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="truncate">AFIP Facturación</span>
            </div>
            <Badge variant="secondary" className={cn(
              "text-[10px]",
              checks.afipProd ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/15 text-slate-300"
            )}>
              {checks.afipProd ? "Producción" : "Homologación"}
            </Badge>
          </div>

          {/* Webhooks & Crons */}
          <div className="flex items-center justify-between rounded-lg border bg-background/50 p-2.5 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Activity className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="truncate">Webhooks & Outbox</span>
            </div>
            <Badge variant="secondary" className={cn(
              "text-[10px]",
              checks.mpWebhookSecret ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
            )}>
              {checks.mpWebhookSecret ? "Firmados OK" : "Sin Firma"}
            </Badge>
          </div>
        </div>

        {bloqueantes.length > 0 && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Variables Críticas Bloqueantes para Salida a Producción:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-red-300 font-mono text-[11px]">
              {bloqueantes.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        )}

        {advertencias.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {advertencias.slice(0, 3).map((a, i) => (
              <span key={i} className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                ⚠ {a}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
