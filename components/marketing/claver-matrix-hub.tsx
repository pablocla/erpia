"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ClaverShell } from "@/components/marketing/claver-shell"
import { ClaverVentasContacto } from "@/components/marketing/claver-ventas-contacto"
import { ClaverLandingFaq } from "@/components/marketing/claver-landing-faq"
import { HeroDolorChips } from "@/components/marketing/hero-dolor-chips"
import {
  CombateHomeSection,
  PacksHomeStripSection,
} from "@/components/marketing/commercial-catalog-sections"
import { MicroSaasColectivosSection } from "@/components/marketing/micro-saas-colectivos-section"
import { colectivoFromHomeDolor } from "@/lib/comercial/micro-saas-portfolio"
import {
  CommercialTrustBar,
  EcosistemaCollapsibleSection,
  EcosistemaExpansionSection,
  ProductAppPreviewSection,
  ProductFinalCtaSection,
  ProductHeroSection,
  ProductSocialProofSection,
  ProductStepsSection,
} from "@/components/marketing/product-entry-sections"
import { ScrollReveal } from "@/components/ui/motion"
import {
  GTM_VITRINE_COPY,
  HOME_DOLOR_EVENT,
  HOME_DOLOR_STORAGE_KEY,
  PRODUCT_ENTRIES,
  resolveHomeDolor,
  ventasWhatsappMessage,
  type HomeDolorSlug,
} from "@/lib/comercial/go-to-market-vitrine"
import { activarRegisterHref } from "@/lib/comercial/activar-intent"

function MatrixHubInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const dolorParam = searchParams.get("dolor")
  const [dolor, setDolor] = useState<HomeDolorSlug>(() => resolveHomeDolor(dolorParam))

  useEffect(() => {
    setDolor(resolveHomeDolor(dolorParam))
  }, [dolorParam])

  // Si no hay ?dolor=, recuperar última elección de la sesión (S3).
  useEffect(() => {
    if (dolorParam) return
    try {
      const stored = sessionStorage.getItem(HOME_DOLOR_STORAGE_KEY)
      if (stored) {
        const resolved = resolveHomeDolor(stored)
        if (resolved !== "fiado") {
          setDolor(resolved)
        }
      }
    } catch {
      /* private mode */
    }
    // Solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(HOME_DOLOR_STORAGE_KEY, dolor)
    } catch {
      /* private mode */
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(HOME_DOLOR_EVENT, { detail: dolor }))
    }
  }, [dolor])

  const onDolorChange = useCallback(
    (slug: HomeDolorSlug) => {
      setDolor(slug)
      const params = new URLSearchParams(searchParams.toString())
      if (slug === "fiado") {
        params.delete("dolor")
      } else {
        params.set("dolor", slug)
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const entry = PRODUCT_ENTRIES[dolor]
  const waMessage = ventasWhatsappMessage(dolor)
  const registerHref = activarRegisterHref(entry.ctaPrimaryActivar)

  return (
    <ClaverShell context="matrix">
      <ProductHeroSection
        entry={entry}
        secondaryCtaHref={`#${GTM_VITRINE_COPY.combateHeadingId}`}
        chips={<HeroDolorChips active={dolor} onChange={onDolorChange} />}
      />

      <CommercialTrustBar />

      <CombateHomeSection highlightSlug={dolor} />

      <ProductAppPreviewSection entry={entry} />
      <ProductStepsSection entry={entry} />
      <ProductSocialProofSection entry={entry} />

      {/* 4 colectivos freemium (11 apps agrupadas) — no satura el hero */}
      <MicroSaasColectivosSection highlightColectivo={colectivoFromHomeDolor(dolor)} />

      <EcosistemaExpansionSection subtitle={entry.ecosistemaSubtitle} />
      <PacksHomeStripSection />
      <EcosistemaCollapsibleSection />

      <section aria-labelledby="faq-heading" className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal className="text-center">
            <h2
              id="faq-heading"
              className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900 sm:text-3xl"
            >
              Preguntas frecuentes
            </h2>
          </ScrollReveal>
          <div className="mt-8 rounded-2xl border border-slate-200/80 bg-[#f8fafc] px-4 py-2 shadow-sm sm:px-6">
            <ClaverLandingFaq />
          </div>
        </div>
      </section>

      <ProductFinalCtaSection
        entry={entry}
        secondaryHref="/claver/contacto"
        secondaryLabel="Hablar con ventas"
      />

      <ClaverVentasContacto
        pagina="/"
        variant="dark"
        waMessage={waMessage}
        registerHref={registerHref}
      />
    </ClaverShell>
  )
}

function MatrixHubFallback() {
  const entry = PRODUCT_ENTRIES.fiado
  return (
    <ClaverShell context="matrix">
      <ProductHeroSection entry={entry} secondaryCtaHref={`#${GTM_VITRINE_COPY.combateHeadingId}`} />
      <CommercialTrustBar />
      <CombateHomeSection highlightSlug="fiado" />
      <ProductAppPreviewSection entry={entry} />
      <ProductStepsSection entry={entry} />
      <ProductSocialProofSection entry={entry} />
      <EcosistemaExpansionSection />
      <PacksHomeStripSection />
      <EcosistemaCollapsibleSection />
      <ProductFinalCtaSection
        entry={entry}
        secondaryHref="/claver/contacto"
        secondaryLabel="Hablar con ventas"
      />
      <ClaverVentasContacto pagina="/" variant="dark" />
    </ClaverShell>
  )
}

/** Home Grupo Claver — un dolor primero, ecosistema después (GTM S1–S3 / S6). */
export function ClaverMatrixHub() {
  return (
    <Suspense fallback={<MatrixHubFallback />}>
      <MatrixHubInner />
    </Suspense>
  )
}
