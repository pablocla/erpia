"use client"

import Link from "next/link"
import { ClaverShell } from "@/components/marketing/claver-shell"
import { ClaverVentasContacto } from "@/components/marketing/claver-ventas-contacto"
import { ClaverLandingFaq } from "@/components/marketing/claver-landing-faq"
import {
  CommercialTrustBar,
  EcosistemaExpansionSection,
  ProductAppPreviewSection,
  ProductFinalCtaSection,
  ProductHeroSection,
  ProductPainOutcomeSection,
  ProductPricingStrip,
  ProductSocialProofSection,
  ProductStepsSection,
} from "@/components/marketing/product-entry-sections"
import type { ProductEntryConfig } from "@/lib/comercial/go-to-market-vitrine"
import type { SubSaasApp } from "@/lib/comercial/sub-saas-catalog"
import { Button } from "@/components/ui/button"
import { ScrollReveal } from "@/components/ui/motion"

interface CombateProductLandingProps {
  app: SubSaasApp
  entry: ProductEntryConfig
}

export function CombateProductLanding({ app, entry }: CombateProductLandingProps) {
  const pagina = `/claver/apps/${entry.slug}`

  return (
    <ClaverShell context="matrix">
      <ProductHeroSection entry={entry} showBreadcrumb />

      <CommercialTrustBar />

      <ProductAppPreviewSection entry={entry} />

      <ProductPainOutcomeSection pains={app.pains} outcomes={app.outcomes} rubros={app.rubros} />

      <ProductStepsSection entry={entry} />

      <ProductSocialProofSection entry={entry} />

      <ProductPricingStrip precioArs={app.precioArs} trialDias={app.trialDias} />

      <EcosistemaExpansionSection subtitle={entry.ecosistemaSubtitle} />

      <section className="bg-white px-4 py-8 text-center sm:px-6">
        <Button variant="link" asChild>
          <Link href="/claver/apps">Ver todas las apps de Claver</Link>
        </Button>
      </section>

      <section aria-labelledby="product-faq-heading" className="bg-[#f8fafc] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal className="text-center">
            <h2
              id="product-faq-heading"
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

      <ProductFinalCtaSection entry={entry} />

      <ClaverVentasContacto pagina={pagina} variant="dark" />
    </ClaverShell>
  )
}