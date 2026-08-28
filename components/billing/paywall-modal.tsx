"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Lock, Sparkles, CheckCircle2, CalendarClock } from "lucide-react"
import { useRouter } from "next/navigation"
import { DISPAROS_CONFIG, type DisparoKey } from "@/lib/comercial/paywall-disparo"
import { PactarImplementacionArca } from "@/components/comercial/pactar-implementacion-arca"

export interface PaywallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  disparoKey?: DisparoKey
  title?: string
  description?: string
  requiredSku?: string
}

export function PaywallModal({
  open,
  onOpenChange,
  disparoKey,
  title,
  description,
  requiredSku,
}: PaywallModalProps) {
  const router = useRouter()
  const [pactarOpen, setPactarOpen] = useState(false)
  const config = disparoKey ? DISPAROS_CONFIG[disparoKey] : null

  const modalTitle = config?.titulo ?? title ?? "Función Premium"
  const modalDesc = config?.descripcion ?? description ?? "Esta función requiere una suscripción o módulo activo."
  const aclaracion = config?.aclaracionGratis
  const ctaText = config?.ctaLabel ?? "Ver opciones de activación"
  const targetHref = config?.checkoutHref ?? (requiredSku ? `/dashboard/facturacion-recurrente?activar=${requiredSku}` : "/dashboard/facturacion-recurrente")
  const pactar = config?.ctaModo === "pactar-implementacion"

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="flex flex-col items-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Lock className="h-7 w-7" />
            </div>
            <DialogTitle className="text-xl font-bold leading-snug">{modalTitle}</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">
              {modalDesc}
            </DialogDescription>
          </DialogHeader>

          {aclaracion && (
            <div className="my-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-600 dark:text-slate-400 text-left flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{aclaracion}</span>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2.5">
            <Button
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-500 font-semibold text-white shadow-sm"
              onClick={() => {
                if (pactar) {
                  onOpenChange(false)
                  setPactarOpen(true)
                  return
                }
                onOpenChange(false)
                router.push(targetHref)
              }}
            >
              {pactar ? <CalendarClock className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {ctaText}
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full text-slate-500 text-xs hover:text-slate-700 dark:hover:text-slate-300"
            >
              {disparoKey === "factura_afip"
                ? "Seguir vendiendo con ticket interno"
                : "Seguir usando versión gratuita"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <PactarImplementacionArca
        hideTrigger
        open={pactarOpen}
        onOpenChange={setPactarOpen}
        defaultArca={disparoKey !== "whatsapp_outbound"}
        defaultWhatsapp={disparoKey !== "factura_afip"}
        pagina={disparoKey ? `paywall:${disparoKey}` : "paywall"}
      />
    </>
  )
}
