"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { IndustrySelector } from "@/components/onboarding/industry-selector"
import { DemoFeaturedPacks } from "@/components/onboarding/demo-featured-packs"
import { useAuth } from "@/lib/auth/hooks"
import { launchIndustryDemo } from "@/components/onboarding/launch-industry-demo"
import { Button } from "@/components/ui/button"
import { activarRegisterHref } from "@/lib/comercial/activar-intent"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LandingFChrome, LandingWrap } from "@/components/marketing/landing-f-chrome"

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
      window.location.assign(dest)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión")
      setLoadingId(null)
    }
  }

  return (
    <LandingFChrome extraFooter={<Link href="/f">Ir a la libreta gratis</Link>}>
      <LandingWrap className="pb-16 pt-8 sm:pt-12 lg:pt-16">
        <p className="mb-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide bg-[var(--landing-badge-free)] text-[var(--landing-badge-free-fg)]">
          Argentina · Sin tarjeta
        </p>
        <h1 className="max-w-3xl font-[var(--font-fraunces)] text-3xl font-semibold leading-[1.12] tracking-tight sm:text-5xl">
          Probá Claver con datos de tu rubro
        </h1>
        <p className="mt-4 max-w-2xl text-base text-[var(--muted-foreground)] sm:text-lg">
          Elegí la industria: armamos una empresa demo aislada, con módulos y ejemplos. Entrá al panel en
          menos de un minuto. Sin tarjeta.
        </p>

        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
          <span className="font-medium text-[var(--foreground)]">Elegí tu rubro</span>
          {" — "}
          la demo se arma al momento (puede tardar 15–40 s la primera vez)
        </div>

        {activarParam && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--landing-accent)]/25 bg-[var(--landing-badge-free)]/60 px-4 py-3 text-sm">
            <span>¿Te gustó la demo? Guardá tu cuenta con el mismo producto. Sin tarjeta.</span>
            <Button size="sm" className="bg-[var(--landing-cta)] text-[var(--landing-cta-fg)] hover:bg-[var(--landing-cta-hover)]" asChild>
              <Link href={activarRegisterHref(activarParam)}>Crear mi cuenta</Link>
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-8">
          <DemoFeaturedPacks onSelect={handleSelect} loadingId={loadingId} />
        </div>

        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6">
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">O elegí otro rubro del catálogo</p>
          <IndustrySelector onSelect={handleSelect} loadingId={loadingId} />
        </div>
      </LandingWrap>
    </LandingFChrome>
  )
}

export default function DemoSensorPage() {
  return (
    <Suspense
      fallback={
        <div data-page="landing" className="min-h-screen" />
      }
    >
      <DemoSensorPageContent />
    </Suspense>
  )
}
