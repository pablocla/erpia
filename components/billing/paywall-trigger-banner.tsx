"use client"

import { useState } from "react"
import { Sparkles, ArrowRight, X, ShieldAlert, MessageSquare, CreditCard, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PaywallModal } from "@/components/billing/paywall-modal"
import { DISPAROS_CONFIG, type DisparoKey } from "@/lib/comercial/paywall-disparo"

export interface PaywallTriggerBannerProps {
  disparoKey: DisparoKey
  badgeText?: string
  headline?: string
  subheadline?: string
  ctaText?: string
  variant?: "emerald" | "amber" | "indigo" | "rose"
  className?: string
  onAction?: () => void
}

const VARIANTS = {
  emerald: {
    border: "border-emerald-500/30 dark:border-emerald-500/20",
    bg: "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-emerald-900/10",
    badge: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    btn: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20",
    icon: Sparkles,
  },
  amber: {
    border: "border-amber-500/30 dark:border-amber-500/20",
    bg: "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-amber-900/10",
    badge: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
    btn: "bg-amber-600 hover:bg-amber-500 text-white shadow-sm shadow-amber-600/20",
    icon: MessageSquare,
  },
  indigo: {
    border: "border-indigo-500/30 dark:border-indigo-500/20",
    bg: "bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-950/40 dark:via-indigo-900/10",
    badge: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    btn: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/20",
    icon: CreditCard,
  },
  rose: {
    border: "border-rose-500/30 dark:border-rose-500/20",
    bg: "bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-950/40 dark:via-rose-900/10",
    badge: "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30",
    btn: "bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/20",
    icon: ShieldAlert,
  },
}

export function PaywallTriggerBanner({
  disparoKey,
  badgeText,
  headline,
  subheadline,
  ctaText,
  variant = "emerald",
  className = "",
  onAction,
}: PaywallTriggerBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  if (dismissed) return null

  const config = DISPAROS_CONFIG[disparoKey]
  const v = VARIANTS[variant] ?? VARIANTS.emerald
  const Icon = v.icon

  const finalHeadline = headline || config?.titulo || "Potenciá tu negocio con automatizaciones"
  const finalSubheadline =
    subheadline ||
    config?.descripcion ||
    "Activá funciones inteligentes para recuperar deudas y cobrar automáticamente."
  const finalCta = ctaText || config?.ctaLabel || "Activar ahora"

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-200 ${v.border} ${v.bg} ${className}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/80 shadow-xs border border-border">
              <Icon className="h-5 w-5 text-foreground" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-foreground">{finalHeadline}</span>
                {badgeText && (
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-medium ${v.badge}`}>
                    {badgeText}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                {finalSubheadline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              size="sm"
              className={`text-xs font-semibold h-8 px-3 ${v.btn}`}
              onClick={() => {
                if (onAction) onAction()
                setModalOpen(true)
              }}
            >
              {finalCta}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setDismissed(true)}
              title="Ocultar sugerencia"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <PaywallModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        disparoKey={disparoKey}
      />
    </>
  )
}
