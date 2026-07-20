"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { IndustrySelector } from "@/components/onboarding/industry-selector"
import { DemoFeaturedPacks } from "@/components/onboarding/demo-featured-packs"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { CLAVER_GROUP } from "@/lib/marketing/brand-system"
import { useAuth } from "@/lib/auth/hooks"
import { launchIndustryDemo } from "@/components/onboarding/launch-industry-demo"
import { Button } from "@/components/ui/button"
import { activarRegisterHref } from "@/lib/comercial/activar-intent"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MotionFadeDown } from "@/components/ui/motion"

function DemoSensorPageContent() {
  const searchParams = useSearchParams()
  const activarParam = searchParams.get("activar")
  const { loginConToken } = useAuth()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function handleSelect(industryId: string) {
    setError("")
    setLoadingId(industryId)
    try {
      const dest = await launchIndustryDemo(industryId, loginConToken, { activar: activarParam })
      // Hard navigation: la sesión queda en localStorage/cookie y el dashboard no pega
      // APIs sin token (SPA replace a veces corría effects antes de hidratar el store).
      window.location.assign(dest)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión")
      setLoadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <MotionFadeDown>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <Link href="/claver">
              <BrandLogo size="md" theme="dark" variant="group-full" showByClaver={false} />
            </Link>
            <Button variant="outline" className="border-white/20 bg-white/5" asChild>
              <Link href="/login">Ya tengo cuenta</Link>
            </Button>
          </div>

          <p className="text-sm text-slate-400">Grupo {CLAVER_GROUP.name}</p>
          <h1 className="mt-2 font-[var(--font-fraunces)] text-3xl font-semibold sm:text-4xl lg:text-5xl">
            Probá Claver con datos de tu rubro
          </h1>
          <p className="mt-4 max-w-2xl text-slate-400">
            Elegí tu industria: creamos una empresa demo aislada, con módulos y ejemplos listos.
            Sin tarjeta. Entrá al panel en menos de un minuto.
          </p>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            <span className="font-medium text-white">Elegí tu rubro</span>
            <span className="text-slate-400">
              {" "}
              — la demo se arma al momento (puede tardar 15–40 s la primera vez)
            </span>
          </div>

          {activarParam && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
              <span className="text-emerald-100">
                ¿Te gustó la demo? Guardá tu cuenta con el mismo producto — 14 días gratis.
              </span>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500" asChild>
                <Link href={activarRegisterHref(activarParam)}>Crear mi cuenta</Link>
              </Button>
            </div>
          )}
        </MotionFadeDown>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-8">
          <DemoFeaturedPacks onSelect={handleSelect} loadingId={loadingId} />
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:p-6 backdrop-blur">
          <p className="mb-4 text-sm text-slate-400">O elegí otro rubro del catálogo completo</p>
          <IndustrySelector onSelect={handleSelect} loadingId={loadingId} />
        </div>

        <div className="mt-10 flex flex-wrap gap-3 text-sm text-slate-400">
          <Link href="/claver/claverp" className="hover:text-white inline-flex items-center gap-1">
            Clavis — comercio <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <span>·</span>
          <Link href="/claver/clavergrow" className="hover:text-white inline-flex items-center gap-1">
            Clavergrow — agro <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <span>·</span>
          <Link href="/claver-cloud" className="hover:text-white">
            Implementación Claver Cloud
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function DemoSensorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <DemoSensorPageContent />
    </Suspense>
  )
}