"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { X, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getIndustryExperience } from "@/lib/comercial/app-experience"

const STORAGE_KEY_DEMO = "claver_onboarding_tour_v1"
const STORAGE_KEY_WEB = "claver_web_onboarding_v1"

type TourStep = {
  title: string
  body: string
  hint?: string
}

const DEFAULT_STEPS: TourStep[] = [
  {
    title: "Bienvenido a tu demo",
    body: "Este ERP está configurado para tu rubro. El menú lateral muestra solo lo que necesitás.",
    hint: "Podés buscar módulos con la lupa del sidebar.",
  },
  {
    title: "Tu módulo estrella",
    body: "Entrá al módulo principal de tu industria — ahí está el valor para el cliente.",
    hint: "Usá ?present=1 en la URL para modo presentación sin distracciones.",
  },
  {
    title: "Primeros pasos",
    body: "Seguí los 3 pasos del encabezado en cada pantalla — te guían sin manual.",
    hint: "Cada app viene empaquetada para tu rubro.",
  },
  {
    title: "Trial y planes",
    body: "Arriba ves cuántos días de prueba quedan. Desde Apps podés activar más productos.",
    hint: "El banner de trial te avisa 3 días antes del vencimiento.",
  },
]

function stepsForIndustry(industryId: string | null | undefined): TourStep[] {
  const guide = getIndustryExperience(industryId)
  if (!guide?.primaryAction) return DEFAULT_STEPS

  return [
    {
      title: `Demo: ${guide.title}`,
      body: guide.subtitle,
      hint: guide.wowMoment,
    },
    {
      title: "Empezá acá",
      body: `Tu acción principal: ${guide.primaryAction.label}.`,
      hint: guide.steps[0],
    },
    {
      title: "Seguí en orden",
      body: guide.steps.slice(1).join(" → "),
      hint: "Modo presentación: agregá ?present=1 a la URL.",
    },
    DEFAULT_STEPS[3]!,
  ]
}

const WEB_SIGNUP_STEPS: TourStep[] = [
  {
    title: "¡Bienvenido a Claver!",
    body: "Tu trial de 14 días ya está activo. En 3 pasos vas a estar operando sin Excel.",
    hint: "El banner arriba te muestra los días restantes.",
  },
  {
    title: "Elegí tu app",
    body: "Entrá a Apps y activá el paquete de tu rubro (fiado, consorcios, turnos, etc.).",
    hint: "Podés probar rubros en claver.com.ar/demo antes de decidir.",
  },
  {
    title: "Seguí la guía en pantalla",
    body: "Cada módulo tiene 3 pasos arriba — no hace falta leer un manual.",
    hint: "Usá el buscador del menú (lupa) si no encontrás un módulo.",
  },
  {
    title: "¿Ayuda humana?",
    body: "Respondé el mail de bienvenida o escribinos por WhatsApp — te acompañamos el primer fiado o venta.",
    hint: "Trial: extendemos 7 días si pedís demo guiada.",
  },
]

export function OnboardingTour({
  enabled,
  industryId,
  variant = "demo",
}: {
  enabled: boolean
  industryId?: string | null
  variant?: "demo" | "web"
}) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const storageKey = variant === "web" ? STORAGE_KEY_WEB : STORAGE_KEY_DEMO
  const STEPS = useMemo(
    () => (variant === "web" ? WEB_SIGNUP_STEPS : stepsForIndustry(industryId)),
    [variant, industryId],
  )

  useEffect(() => {
    if (!enabled) return
    if (typeof window === "undefined") return
    if (localStorage.getItem(storageKey) === "done") return
    const t = window.setTimeout(() => setOpen(true), variant === "web" ? 1200 : 800)
    return () => window.clearTimeout(t)
  }, [enabled, storageKey, variant])

  const finish = useCallback(() => {
    localStorage.setItem(storageKey, "done")
    setOpen(false)
  }, [storageKey])

  const next = useCallback(() => {
    if (step >= STEPS.length - 1) {
      finish()
      return
    }
    setStep((s) => s + 1)
  }, [step, finish, STEPS.length])

  const prev = useCallback(() => {
    setStep((s) => Math.max(0, s - 1))
  }, [])

  if (!open) return null

  const current = STEPS[step]

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Cerrar tour"
        onClick={finish}
      />
      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl border bg-card p-5 shadow-2xl",
          "animate-in fade-in slide-in-from-bottom-4 duration-300",
        )}
        role="dialog"
        aria-labelledby="onboarding-tour-title"
      >
        <button
          type="button"
          onClick={finish}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground"
          aria-label="Omitir tour"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-xs font-medium text-primary mb-2">
          Paso {step + 1} de {STEPS.length}
        </p>
        <h2 id="onboarding-tour-title" className="text-lg font-semibold pr-8">
          {current.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{current.body}</p>
        {current.hint && (
          <p className="mt-3 text-xs rounded-lg bg-muted/60 px-3 py-2 text-muted-foreground">
            {current.hint}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={finish} className="text-xs">
            Omitir
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={prev}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Atrás
              </Button>
            )}
            <Button size="sm" onClick={next}>
              {step >= STEPS.length - 1 ? "Empezar" : "Siguiente"}
              {step < STEPS.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}