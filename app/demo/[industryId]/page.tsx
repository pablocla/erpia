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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <Link
          href="/demo"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Elegir otro rubro
        </Link>

        <BrandLogo size="md" theme="dark" variant="group-full" showByClaver={false} />

        {template ? (
          <div>
            <p className="text-4xl">{template.emoji}</p>
            <h1 className="mt-2 font-[var(--font-fraunces)] text-2xl font-semibold">
              {template.label}
            </h1>
            <p className="mt-2 text-slate-400">{template.tagline}</p>
          </div>
        ) : null}

        {launching && !error && (
          <div className="flex flex-col items-center gap-4 text-slate-300">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            <p className="font-medium text-white">Armando tu demo…</p>
            <p className="text-sm text-slate-400">
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
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                        : done
                          ? "border-white/10 bg-white/5 text-slate-300"
                          : "border-transparent text-slate-500"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-600 text-[10px]">
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
                className="bg-emerald-600 hover:bg-emerald-500"
                onClick={() => {
                  setError("")
                  setLaunching(true)
                  setStepIdx(0)
                  window.location.reload()
                }}
              >
                Reintentar
              </Button>
              <Button variant="outline" className="border-white/20" asChild>
                <Link href="/demo">Volver al sensor</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
