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
  GTM_VITRINE_COPY_US,
  HOME_DOLOR_EVENT,
  HOME_DOLOR_STORAGE_KEY,
  PRODUCT_ENTRIES,
  PRODUCT_ENTRIES_US,
  resolveHomeDolor,
  ventasWhatsappMessage,
  type HomeDolorSlug,
} from "@/lib/comercial/go-to-market-vitrine"
import { activarRegisterHref } from "@/lib/comercial/activar-intent"

function MatrixHubInner({ isUs = false, initialDolor }: { isUs?: boolean; initialDolor?: HomeDolorSlug }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const dolorParam = searchParams.get("dolor")
  const [dolor, setDolor] = useState<HomeDolorSlug>(() => initialDolor ?? resolveHomeDolor(dolorParam))

  useEffect(() => {
    if (initialDolor) {
      setDolor(initialDolor)
      return
    }
    setDolor(resolveHomeDolor(dolorParam))
  }, [dolorParam, initialDolor])

  // Si no hay ?dolor= ni initialDolor, recuperar última elección de la sesión (S3).
  useEffect(() => {
    if (dolorParam || initialDolor) return
    try {
      const stored = sessionStorage.getItem(HOME_DOLOR_STORAGE_KEY)
      if (stored) {
        const resolved = resolveHomeDolor(stored)
        if (resolved !== "oficios") {
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

  const entries = isUs ? PRODUCT_ENTRIES_US : PRODUCT_ENTRIES
  const entry = entries[dolor]
  const waMessage = ventasWhatsappMessage(dolor)
  const registerHref = activarRegisterHref(entry.ctaPrimaryActivar)

  return (
    <ClaverShell context="matrix" isUs={isUs}>
      <ProductHeroSection
        entry={entry}
        secondaryCtaHref={`#${GTM_VITRINE_COPY.combateHeadingId}`}
        chips={<HeroDolorChips active={dolor} onChange={onDolorChange} />}
      />

      <CommercialTrustBar isUs={isUs} />

      <CombateHomeSection highlightSlug={dolor} isUs={isUs} />

      <ProductAppPreviewSection entry={entry} isUs={isUs} />
      <ProductStepsSection entry={entry} isUs={isUs} />
      <ProductSocialProofSection entry={entry} isUs={isUs} />

      {/* 4 colectivos freemium (11 apps agrupadas) — no satura el hero */}
      <MicroSaasColectivosSection highlightColectivo={colectivoFromHomeDolor(dolor)} isUs={isUs} />

      <EcosistemaExpansionSection subtitle={entry.ecosistemaSubtitle} isUs={isUs} />
      <PacksHomeStripSection isUs={isUs} />
      <EcosistemaCollapsibleSection isUs={isUs} />

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
        secondaryLabel={isUs ? "Talk to Sales" : "Hablar con ventas"}
        isUs={isUs}
      />

      <ClaverVentasContacto
        pagina="/"
        variant="dark"
        waMessage={waMessage}
        registerHref={registerHref}
        isUs={isUs}
      />
    </ClaverShell>
  )
}

function MatrixHubFallback({ isUs = false, initialDolor }: { isUs?: boolean; initialDolor?: HomeDolorSlug }) {
  const entries = isUs ? PRODUCT_ENTRIES_US : PRODUCT_ENTRIES
  const slug = initialDolor ?? (isUs ? "fiado" : "oficios")
  const entry = (entries as any)[slug] ?? entries.fiado
  return (
    <ClaverShell context="matrix" isUs={isUs}>
      <ProductHeroSection entry={entry} secondaryCtaHref={`#${GTM_VITRINE_COPY.combateHeadingId}`} />
      <CommercialTrustBar isUs={isUs} />
      <CombateHomeSection highlightSlug={slug} isUs={isUs} />
      <ProductAppPreviewSection entry={entry} isUs={isUs} />
      <ProductStepsSection entry={entry} isUs={isUs} />
      <ProductSocialProofSection entry={entry} isUs={isUs} />
      <EcosistemaExpansionSection isUs={isUs} />
      <PacksHomeStripSection isUs={isUs} />
      <EcosistemaCollapsibleSection isUs={isUs} />
      <ProductFinalCtaSection
        entry={entry}
        secondaryHref="/claver/contacto"
        secondaryLabel={isUs ? "Talk to Sales" : "Hablar con ventas"}
        isUs={isUs}
      />
      <ClaverVentasContacto pagina="/" variant="dark" isUs={isUs} />
    </ClaverShell>
  )
}

/** Home Grupo Claver — un dolor primero, ecosistema después (GTM S1–S3 / S6). */
export function ClaverMatrixHub({ isUs = false, initialDolor }: { isUs?: boolean; initialDolor?: HomeDolorSlug }) {
  return (
    <Suspense fallback={<MatrixHubFallback isUs={isUs} initialDolor={initialDolor} />}>
      <MatrixHubInner isUs={isUs} initialDolor={initialDolor} />
    </Suspense>
  )
}
