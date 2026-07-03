"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Clock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAuthHeaders, useAuthStore } from "@/lib/stores/auth-store"
import { formatTrialCountdown, type TrialStatus } from "@/lib/comercial/trial-service"
import { cn } from "@/lib/utils"

export function TrialBanner() {
  const token = useAuthStore((s) => s.token)
  const [trial, setTrial] = useState<TrialStatus | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch("/api/config/trial", { headers: getAuthHeaders(token) })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setTrial(data?.trial ?? null))
      .catch(() => setTrial(null))
  }, [token])

  if (!trial || dismissed) return null

  const urgente = trial.diasRestantes <= 3 && trial.activo
  const vencido = trial.expirado

  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        vencido
          ? "border-destructive/40 bg-destructive/10"
          : urgente
            ? "border-amber-500/40 bg-amber-500/10"
            : "border-primary/30 bg-primary/5",
      )}
      role="status"
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            vencido ? "bg-destructive/15" : "bg-primary/15",
          )}
        >
          {vencido ? (
            <Clock className="h-4 w-4 text-destructive" />
          ) : (
            <Sparkles className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {vencido
              ? "Tu período de prueba terminó"
              : `Prueba gratis — ${formatTrialCountdown(trial.diasRestantes)}`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {vencido
              ? "Contactá a Claver para activar tu plan y seguir operando sin límites."
              : `Trial de ${trial.trialDias} días. Vence el ${new Intl.DateTimeFormat("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                }).format(new Date(trial.expiresAt))}.`}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" variant={vencido ? "default" : "outline"} asChild>
          <Link href="/dashboard/apps">Ver planes</Link>
        </Button>
        {!vencido && (
          <Button size="sm" variant="ghost" className="text-xs" onClick={() => setDismissed(true)}>
            Ocultar
          </Button>
        )}
      </div>
    </div>
  )
}