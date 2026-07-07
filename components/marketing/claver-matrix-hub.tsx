"use client"

import { ClaverShell } from "@/components/marketing/claver-shell"
import { ClaverVentasContacto } from "@/components/marketing/claver-ventas-contacto"
import { ClaverLandingFaq } from "@/components/marketing/claver-landing-faq"
import {
  EcosistemaCollapsibleSection,
  EcosistemaExpansionSection,
  FiadoAppPreviewSection,
  FiadoFinalCtaSection,
  FiadoHeroSection,
  FiadoSocialProofSection,
  FiadoStepsSection,
} from "@/components/marketing/product-entry-sections"
import { ScrollReveal } from "@/components/ui/motion"

export function ClaverMatrixHub() {
  return (
    <ClaverShell context="matrix">
      <FiadoHeroSection />

      <FiadoAppPreviewSection />
      <FiadoStepsSection />
      <FiadoSocialProofSection />
      <EcosistemaExpansionSection />
      <EcosistemaCollapsibleSection />

      <section aria-labelledby="faq-heading" className="bg-[#f8fafc] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal className="text-center">
            <h2
              id="faq-heading"
              className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900 sm:text-3xl"
            >
              Preguntas frecuentes
            </h2>
          </ScrollReveal>
          <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white px-4 py-2 shadow-sm sm:px-6">
            <ClaverLandingFaq />
          </div>
        </div>
      </section>

      <FiadoFinalCtaSection secondaryHref="/claver/contacto" secondaryLabel="Hablar con ventas" />

      <ClaverVentasContacto pagina="/" variant="dark" />
    </ClaverShell>
  )
}