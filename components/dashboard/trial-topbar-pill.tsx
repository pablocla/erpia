"use client"

import Link from "next/link"
import { Clock, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatTrialCountdown } from "@/lib/comercial/trial-service"
import { useComercialAccess } from "@/hooks/use-comercial-access"

const MI_PLAN_HREF = "/dashboard/mi-plan"

export function TrialTopbarPill() {
  const { trial, access, loading } = useComercialAccess()

  if (loading || access?.mpAutorizado || access?.tieneAnclaGratis) return null

  const monetizadosEnTrial = (access?.monetizados ?? []).filter((m) => m.enTrial && !m.gratisPermanente)
  const monetizadosExpirados = (access?.monetizados ?? []).filter((m) => m.expirado && !m.gratisPermanente)
  const showTrial = Boolean(trial && (trial.activo || trial.expirado))
  const showUpgrade = monetizadosEnTrial.length > 0 || monetizadosExpirados.length > 0 || (access?.precioUpgradeArs ?? 0) > 0

  if (!showTrial && !showUpgrade) return null

  const vencido = trial?.expirado || monetizadosExpirados.length > 0
  const urgente = !vencido && trial != null && trial.diasRestantes <= 3

  const label = vencido
    ? "Activar plan"
    : access?.tieneAnclaGratis
      ? `POS trial · ${formatTrialCountdown(trial?.diasRestantes ?? 0)}`
      : `Trial · ${formatTrialCountdown(trial?.diasRestantes ?? 0)}`

  return (
    <Link
      href={MI_PLAN_HREF}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-90 max-w-[min(100%,14rem)]",
        vencido
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : urgente
            ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
            : "border-primary/30 bg-primary/10 text-primary",
      )}
    >
      {vencido ? <Clock className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
      <span className="max-w-[10rem] truncate">{label}</span>
      {!vencido && trial && (
        <Badge variant="secondary" className="h-4 px-1 text-[9px] font-semibold">
          {trial.diasRestantes}d
        </Badge>
      )}
    </Link>
  )
}