"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth/hooks"
import { launchIndustryDemo } from "@/components/onboarding/launch-industry-demo"
import { LandingFChrome, LandingWrap } from "@/components/marketing/landing-f-chrome"
import { Button } from "@/components/ui/button"
import { trackEvent, trackFunnel } from "@/hooks/use-page-tracker"
import {
  CORE_ERP_MODULES,
  FACEBOOK_CAMPAIGN_ERP_CORE,
  type CoreErpModule,
} from "@/lib/marketing/facebook-campaigns"

const DEMO_INDUSTRY = "kiosco"

export function ErpFacebookLanding() {
  const { loginConToken } = useAuth()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    trackEvent("fb_pulse", { campaignId: FACEBOOK_CAMPAIGN_ERP_CORE.id })
    trackFunnel("facebook_erp", "visit_landing")
  }, [])

  async function enterErp(modulo?: CoreErpModule) {
    setError("")
    setLoadingId(modulo?.id ?? "core")
    if (modulo) {
      trackEvent("fb_click_modulo", { modulo: modulo.id, dashboardPath: modulo.dashboardPath })
      trackFunnel("facebook_erp", "click_modulo")
    }
    trackEvent("fb_enter_erp", { modulo: modulo?.id ?? "dashboard" })
    trackFunnel("facebook_erp", "enter_demo")
    try {
      const dest = await launchIndustryDemo(DEMO_INDUSTRY, loginConToken, {
        nextPath: modulo?.dashboardPath ?? "/dashboard",
      })
      window.location.assign(dest)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir el ERP de prueba.")
      setLoadingId(null)
    }
  }

  const busy = loadingId !== null

  return (
    <LandingFChrome extraFooter={<Link href="/demo">Elegir otro rubro</Link>}>
      <LandingWrap className="pb-16 pt-8 sm:pt-12">
        <p className="mb-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide bg-[var(--landing-badge-free)] text-[var(--landing-badge-free-fg)]">
          ERP · Argentina · Sin tarjeta
        </p>
        <h1 className="max-w-3xl font-[var(--font-fraunces)] text-3xl font-semibold leading-[1.12] tracking-tight sm:text-5xl">
          Un sistema. Toda tu operación.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-[var(--muted-foreground)] sm:text-lg">
          Caja, stock, factura AFIP, cobro, turnos, compras y reportes. Entrá y recorré el CORE del ERP
          con datos de prueba.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            size="lg"
            className="bg-[var(--landing-cta)] text-[var(--landing-cta-fg)] hover:bg-[var(--landing-cta-hover)]"
            disabled={busy}
            onClick={() => enterErp()}
          >
            {busy && loadingId === "core" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="mr-2 h-4 w-4" />
            )}
            {FACEBOOK_CAMPAIGN_ERP_CORE.ctaLanding}
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login/register">Crear mi cuenta</Link>
          </Button>
        </div>

        {error && (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          Tocá un módulo para abrir esa pantalla adentro del sistema.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CORE_ERP_MODULES.map((mod) => (
            <button
              key={mod.id}
              type="button"
              disabled={busy}
              onClick={() => enterErp(mod)}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-left transition hover:border-[var(--foreground)]/25 hover:bg-[var(--muted)]/40 disabled:opacity-60"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold tracking-tight">{mod.label}</p>
                {busy && loadingId === mod.id ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{mod.tagline}</p>
            </button>
          ))}
        </div>
      </LandingWrap>
    </LandingFChrome>
  )
}
