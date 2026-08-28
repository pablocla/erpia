"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/auth/hooks"
import { getIndustryTemplate } from "@/lib/comercial/industry-templates"
import { launchIndustryDemo } from "@/components/onboarding/launch-industry-demo"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

const STEPS = [
  "Creando empresa demo aislada",
  "Activando módulos del rubro",
  "Cargando datos de ejemplo",
  "Entrando al panel…",
] as const

export default function DemoIndustryDeepLinkPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { loginConToken } = useAuth()
  const industryId = typeof params.industryId === "string" ? params.industryId : ""
  const present = searchParams.get("present") === "1"
  const activarParam = searchParams.get("activar")
  const template = getIndustryTemplate(industryId)

  const [error, setError] = useState("")
  const [launching, setLaunching] = useState(true)
  const [stepIdx, setStepIdx] = useState(0)
  /** Evita re-disparar el effect en re-renders; el dedup real está en launchIndustryDemo */
  const startedForRef = useRef<string | null>(null)

  useEffect(() => {
    if (!launching || error) return
    const id = window.setInterval(() => {
      setStepIdx((s) => (s < STEPS.length - 1 ? s + 1 : s))
    }, 2800)
    return () => window.clearInterval(id)
  }, [launching, error])

  useEffect(() => {
    if (!template) {
      setLaunching(false)
      setError(`Rubro no encontrado: ${industryId}`)
      return
    }

    const launchKey = `${industryId}::${activarParam ?? ""}::${present ? "1" : "0"}`
    if (startedForRef.current === launchKey) return
    startedForRef.current = launchKey

    let cancelled = false
    ;(async () => {
      try {
        const dest = await launchIndustryDemo(industryId, loginConToken, {
          present,
          activar: activarParam,
        })
        if (!cancelled) {
          setStepIdx(STEPS.length - 1)
          // Hard navigation: asegura cookie + store listos en el dashboard
          window.location.assign(dest)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error de conexión")
          setLaunching(false)
          startedForRef.current = null
        }
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- launch once per industry deep-link
  }, [industryId])

  return (
    <div data-page="landing" className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <Link
          href="/demo"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Elegir otro rubro
        </Link>

        <BrandLogo size="md" theme="light" variant="group-full" showByClaver={false} />

        {template ? (
          <div>
            <p className="text-4xl">{template.emoji}</p>
            <h1 className="mt-2 font-[var(--font-fraunces)] text-2xl font-semibold">
              {template.label}
            </h1>
            <p className="mt-2 text-muted-foreground">{template.tagline}</p>
          </div>
        ) : null}

        {launching && !error && (
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--landing-accent)]" />
            <p className="font-medium text-foreground">Armando tu demo…</p>
            <p className="text-sm">
              Suele demorar entre 10 y 40 segundos la primera vez.
            </p>
            <ol className="mt-2 w-full space-y-2 text-left text-sm">
              {STEPS.map((label, i) => {
                const done = i < stepIdx
                const active = i === stepIdx
                return (
                  <li
                    key={label}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                      active
                        ? "border-[var(--landing-accent)]/30 bg-[var(--landing-badge-free)] text-foreground"
                        : done
                          ? "border-[var(--border)] bg-[var(--card)] text-foreground"
                          : "border-transparent text-muted-foreground"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--landing-accent)]" />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[10px]">
                        {i + 1}
                      </span>
                    )}
                    {label}
                  </li>
                )
              })}
            </ol>
          </div>
        )}

        {error && (
          <>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                className="bg-[var(--landing-cta)] text-[var(--landing-cta-fg)] hover:bg-[var(--landing-cta-hover)]"
                onClick={() => {
                  setError("")
                  setLaunching(true)
                  setStepIdx(0)
                  window.location.reload()
                }}
              >
                Reintentar
              </Button>
              <Button variant="outline" asChild>
                <Link href="/demo">Volver al sensor</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
