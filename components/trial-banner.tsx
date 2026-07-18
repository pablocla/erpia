"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Clock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAuthHeaders, useAuthStore } from "@/lib/stores/auth-store"
import { formatTrialCountdown, type TrialStatus } from "@/lib/comercial/trial-service"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface TrialBannerProps {
  /** Slug del sub-SaaS activo para checkout MP (ej. fiado, cobra, turnos). */
  subscribeSlug?: string
}

interface AccessPayload {
  tieneAnclaGratis?: boolean
  anclaSkus?: string[]
  precioUpgradeArs?: number
  ofertaLema?: string | null
  bloqueoTotal?: boolean
  mpAutorizado?: boolean
}

export function TrialBanner({ subscribeSlug = "fiado" }: TrialBannerProps) {
  const token = useAuthStore((s) => s.token)
  const { toast } = useToast()
  const [trial, setTrial] = useState<TrialStatus | null>(null)
  const [access, setAccess] = useState<AccessPayload | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch("/api/config/trial", { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setTrial(data?.trial ?? null)
        setAccess(data?.access ?? null)
      })
      .catch(() => {
        setTrial(null)
        setAccess(null)
      })
  }, [token])

  async function iniciarSuscripcion() {
    if (!token) return
    setSubscribing(true)
    try {
      // Pack monetizado (no ancla gratis): create-subscription aplica piso $10.000
      const endpoint =
        (access?.precioUpgradeArs ?? 0) > 0 || subscribeSlug === "fiado"
          ? "/api/billing/create-subscription"
          : "/api/billing/subscribe"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: endpoint.endsWith("subscribe")
          ? JSON.stringify({ slug: subscribeSlug })
          : undefined,
      })
      const data = await res.json()
      if (data.free) {
        toast({ title: "Activado", description: data.message ?? "Módulo gratis activado" })
        return
      }
      if (!res.ok || !data.init_point) {
        throw new Error(data.error ?? "No se pudo iniciar el pago")
      }
      window.location.href = data.init_point as string
    } catch (e) {
      toast({
        title: "Error al suscribir",
        description: e instanceof Error ? e.message : "Intentá de nuevo",
        variant: "destructive",
      })
    } finally {
      setSubscribing(false)
    }
  }

  if (!trial || dismissed || access?.mpAutorizado) return null

  const tieneAncla = Boolean(access?.tieneAnclaGratis)
  const urgente = trial.diasRestantes <= 3 && trial.activo
  const vencido = trial.expirado

  // Con ancla gratis y trial vencido: no asustar — solo upsell de módulos de pago
  const titulo = vencido
    ? tieneAncla
      ? "Tu trial de módulos de pago terminó"
      : "Tu período de prueba terminó"
    : `Prueba gratis — ${formatTrialCountdown(trial.diasRestantes)}`

  const subtitulo = vencido
    ? tieneAncla
      ? "La libreta Fiado sigue gratis. Activá POS, cobranzas o el pack para recuperar caja, stock y el resto."
      : "Contactá a Claver o activá tu plan para seguir operando sin límites."
    : tieneAncla
      ? `${access?.ofertaLema ?? "Libreta gratis + módulos en trial."} El trial de pago vence el ${new Intl.DateTimeFormat("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(new Date(trial.expiresAt))}.`
      : `Trial de ${trial.trialDias} días. Vence el ${new Intl.DateTimeFormat("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(new Date(trial.expiresAt))}.`

  const ctaLabel = vencido
    ? tieneAncla
      ? "Sumar módulos de pago"
      : "Activar plan"
    : "Suscribirme"

  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        vencido && !tieneAncla
          ? "border-destructive/40 bg-destructive/10"
          : vencido && tieneAncla
            ? "border-amber-500/40 bg-amber-500/10"
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
            vencido && !tieneAncla ? "bg-destructive/15" : "bg-primary/15",
          )}
        >
          {vencido && !tieneAncla ? (
            <Clock className="h-4 w-4 text-destructive" />
          ) : (
            <Sparkles className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{titulo}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitulo}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          variant={vencido || urgente ? "default" : "outline"}
          onClick={() => void iniciarSuscripcion()}
          disabled={subscribing}
        >
          {subscribing ? "Redirigiendo…" : ctaLabel}
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <Link href="/dashboard/mi-plan">Mi plan</Link>
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <Link href="/claver/contacto">Ventas</Link>
        </Button>
        {(!vencido || tieneAncla) && (
          <Button size="sm" variant="ghost" className="text-xs" onClick={() => setDismissed(true)}>
            Ocultar
          </Button>
        )}
      </div>
    </div>
  )
}
