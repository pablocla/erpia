"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, Sparkles, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { authFetch, getAuthHeaders } from "@/lib/stores/auth-store"

type Step = { id: string; label: string; href: string }
type State = { completados: string[]; dismissed: boolean; origen: string }

export function PropiedadOnboardingChecklist({
  onStepVisit,
}: {
  onStepVisit?: (stepId: string) => void
}) {
  const [steps, setSteps] = useState<Step[]>([])
  const [state, setState] = useState<State | null>(null)
  const [pendiente, setPendiente] = useState(false)
  const [hidden, setHidden] = useState(false)

  const cargar = useCallback(async () => {
    const res = await fetch("/api/comercial/onboarding-propiedad", { headers: getAuthHeaders() })
    if (!res.ok) return
    const data = await res.json()
    setSteps(data.steps ?? [])
    setState(data.state ?? null)
    setPendiente(Boolean(data.pendiente))
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function dismiss() {
    await authFetch("/api/comercial/onboarding-propiedad", {
      method: "POST",
      body: JSON.stringify({ action: "dismiss" }),
    })
    setHidden(true)
    setPendiente(false)
  }

  if (hidden || !pendiente || !state || steps.length === 0) return null

  const done = new Set(state.completados)

  return (
    <Card className="border-primary/25 bg-primary/5">
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Primeros pasos — Claver Propiedad
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {done.size}/{steps.length} completados · embudo {state.origen}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => void dismiss()}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((s) => {
          const ok = done.has(s.id)
          return (
            <Link
              key={s.id}
              href={s.href}
              className="flex items-center gap-2 rounded-lg border bg-background/80 px-3 py-2 text-sm hover:bg-background transition-colors"
              onClick={() => onStepVisit?.(s.id)}
            >
              {ok ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className={ok ? "text-muted-foreground line-through" : ""}>{s.label}</span>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

/** Marca un paso completado (fire-and-forget desde paneles). */
export async function completarPasoOnboardingPropiedad(stepId: string) {
  await authFetch("/api/comercial/onboarding-propiedad", {
    method: "POST",
    body: JSON.stringify({ action: "completar", stepId }),
  })
}