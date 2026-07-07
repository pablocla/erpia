"use client"

import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  Box,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Layers,
  PlayCircle,
  Quote,
  Smartphone,
  Timer,
  Users,
  Wallet,
  Workflow,
  XCircle,
} from "lucide-react"
import { activarRegisterHref } from "@/lib/comercial/activar-intent"
import type { CombateAppSlug, ProductEntryConfig } from "@/lib/comercial/go-to-market-vitrine"
import {
  ECOSISTEMA_CAPACIDADES,
  FIADO_ENTRY, POS_ENTRY,
  GTM_VITRINE_COPY,
} from "@/lib/comercial/go-to-market-vitrine"
import { fmtPrecioArs } from "@/lib/comercial/sub-saas-catalog"
import { ClaverCobraMockup } from "@/components/marketing/claver-cobra-mockup"
import { ClaverFiadoMockup } from "@/components/marketing/claver-fiado-mockup"
import { ClaverPosMockup } from "@/components/marketing/claver-pos-mockup"
import { ClaverMonotributoMockup } from "@/components/marketing/claver-monotributo-mockup"
import { ClaverObraMockup } from "@/components/marketing/claver-obra-mockup"
import { ClaverPropiedadMockup } from "@/components/marketing/claver-propiedad-mockup"
import { ClaverServiciosMockup } from "@/components/marketing/claver-servicios-mockup"
import { ClaverTurnosMockup } from "@/components/marketing/claver-turnos-mockup"
import {
  CatalogoCompletoBanner,
  PacksRubroSection,
  PlataformasSection,
} from "@/components/marketing/commercial-catalog-sections"
import { LANDING_FEATURED_DEMOS } from "@/lib/marketing/landing-seo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { MotionFadeDown, MotionList, MotionListItem, ScrollReveal } from "@/components/ui/motion"
import { cn } from "@/lib/utils"

const TRUST_ICONS = [Smartphone, Users, Timer] as const

const ECOSISTEMA_ICONS = {
  Stock: Box,
  "Caja diaria": Wallet,
  Expensas: Layers,
  Turnos: Calendar,
  Automatizaciones: Workflow,
  Reportes: BarChart3,
  Dashboards: BarChart3,
} as const

function ProductMockup({ slug }: { slug: CombateAppSlug }) {
  if (slug === "cobra") return <ClaverCobraMockup />
  if (slug === "monotributo") return <ClaverMonotributoMockup />
  if (slug === "servicios") return <ClaverServiciosMockup />
  if (slug === "obra") return <ClaverObraMockup />
  if (slug === "propiedad") return <ClaverPropiedadMockup />
  if (slug === "turnos") return <ClaverTurnosMockup />
  if (slug === "pos") return <ClaverPosMockup />
  return <ClaverFiadoMockup />
}

export function ProductHeroSection({
  entry,
  showBreadcrumb = false,
  className,
}: {
  entry: ProductEntryConfig
  showBreadcrumb?: boolean
  className?: string
}) {
  const registerHref = activarRegisterHref(entry.ctaPrimaryActivar)

  return (
    <section
      aria-labelledby="hero-heading"
      className={cn(
        "relative overflow-hidden bg-[#0B1220] pt-28 pb-20 text-white sm:pt-32 sm:pb-24",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.2),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <MotionFadeDown>
          {showBreadcrumb && (
            <Link
              href="/claver/apps"
              className="mb-4 inline-flex items-center text-sm text-white/60 hover:text-white"
            >
              Catálogo de apps
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
            </Link>
          )}
          <Badge className="mb-6 border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
            {entry.badge}
          </Badge>
          <h1
            id="hero-heading"
            className="max-w-3xl font-[var(--font-fraunces)] text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]"
          >
            {entry.h1}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300 leading-relaxed">{entry.subtitle}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              size="lg"
              className="h-12 bg-emerald-500 px-8 font-semibold text-slate-950 hover:bg-emerald-400"
              asChild
            >
              <Link href={registerHref}>
                {entry.ctaPrimary}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-white/20 bg-white/5 px-8 text-white hover:bg-white/10"
              asChild
            >
              <Link href={entry.demoHref}>
                <PlayCircle className="mr-2 h-4 w-4" aria-hidden />
                {entry.ctaSecondary}
              </Link>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
            {entry.trustBullets.map((label, i) => {
              const Icon = TRUST_ICONS[i] ?? Smartphone
              return (
                <li key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-emerald-400" aria-hidden />
                  {label}
                </li>
              )
            })}
          </ul>
        </MotionFadeDown>
      </div>
    </section>
  )
}

export function ProductAppPreviewSection({
  entry,
  className,
}: {
  entry: ProductEntryConfig
  className?: string
}) {
  return (
    <section aria-labelledby="preview-heading" className={cn("bg-white px-4 py-16 sm:px-6", className)}>
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <ScrollReveal>
          <h2
            id="preview-heading"
            className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900 sm:text-3xl"
          >
            {entry.preview.title}
          </h2>
          <p className="mt-3 text-slate-600 leading-relaxed">{entry.preview.description}</p>
        </ScrollReveal>
        <ProductMockup slug={entry.slug} />
      </div>
    </section>
  )
}

export function ProductPainOutcomeSection({
  pains,
  outcomes,
  rubros,
  className,
}: {
  pains: readonly string[]
  outcomes: readonly string[]
  rubros: readonly string[]
  className?: string
}) {
  return (
    <section
      aria-labelledby="pain-outcome-heading"
      className={cn("border-b border-slate-200/80 bg-white py-16", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 id="pain-outcome-heading" className="sr-only">
          Problemas y resultados
        </h2>
        <div className="grid gap-12 lg:grid-cols-2">
          <ScrollReveal>
            <h3 className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900">
              El dolor de hoy
            </h3>
            <ul className="mt-6 space-y-3">
              {pains.map((pain) => (
                <li
                  key={pain}
                  className="flex gap-3 rounded-xl border border-red-100 bg-red-50/80 p-4 text-slate-700"
                >
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden />
                  {pain}
                </li>
              ))}
            </ul>
          </ScrollReveal>
          <ScrollReveal>
            <h3 className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900">
              Lo que ganás
            </h3>
            <ul className="mt-6 space-y-3">
              {outcomes.map((outcome) => (
                <li
                  key={outcome}
                  className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-slate-700"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                  {outcome}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              {rubros.map((rubro) => (
                <Badge key={rubro} variant="secondary" className="text-xs">
                  {rubro}
                </Badge>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

export function ProductStepsSection({
  entry,
  className,
}: {
  entry: ProductEntryConfig
  className?: string
}) {
  return (
    <section
      aria-labelledby="steps-heading"
      className={cn("border-y border-slate-200/80 bg-[#f8fafc] px-4 py-16 sm:px-6", className)}
    >
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="text-center">
          <h2
            id="steps-heading"
            className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900 sm:text-3xl"
          >
            Tres pasos y listo
          </h2>
          <p className="mt-2 text-slate-600">{entry.stepsIntro}</p>
        </ScrollReveal>

        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {entry.steps.map((item) => (
            <li
              key={item.step}
              className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
            >
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 font-[var(--font-fraunces)] text-lg font-bold text-slate-950"
                aria-hidden
              >
                {item.step}
              </span>
              <h3 className="mt-4 font-[var(--font-fraunces)] text-lg font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function ProductSocialProofSection({
  entry,
  className,
}: {
  entry: ProductEntryConfig
  className?: string
}) {
  return (
    <section aria-labelledby="proof-heading" className={cn("bg-white px-4 py-16 sm:px-6", className)}>
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <ScrollReveal>
            <h2 id="proof-heading" className="sr-only">
              Beneficios y testimonio
            </h2>
            <div className="rounded-2xl border border-slate-200/80 bg-[#f8fafc] p-6 sm:p-8">
              <Quote className="h-8 w-8 text-emerald-500/60" aria-hidden />
              <blockquote className="mt-4 font-[var(--font-fraunces)] text-xl font-medium leading-snug text-slate-900 sm:text-2xl">
                &ldquo;{entry.testimonial.quote}&rdquo;
              </blockquote>
              <footer className="mt-4 text-sm text-slate-600">
                <cite className="not-italic font-semibold text-slate-900">{entry.testimonial.author}</cite>
                <span className="block">{entry.testimonial.role}</span>
              </footer>
            </div>
          </ScrollReveal>

          <MotionList className="grid gap-4 sm:grid-cols-1">
            {entry.benefits.map((b) => (
              <MotionListItem key={b.label}>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-5 py-4">
                  <p className="font-[var(--font-fraunces)] text-2xl font-bold text-emerald-800">{b.value}</p>
                  <p className="mt-1 text-sm text-slate-700">{b.label}</p>
                </div>
              </MotionListItem>
            ))}
          </MotionList>
        </div>
      </div>
    </section>
  )
}

export function ProductPricingStrip({
  precioArs,
  trialDias,
  className,
}: {
  precioArs: number
  trialDias: number
  className?: string
}) {
  return (
    <section className={cn("border-y border-slate-200/80 bg-white py-10", className)}>
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">Precio claro</p>
        <p className="mt-2 font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900 sm:text-4xl">
          {fmtPrecioArs(precioArs)}
          <span className="text-lg font-normal text-slate-500"> / mes</span>
        </p>
        <p className="mt-2 text-slate-600">
          {trialDias} días gratis para probar. Sin tarjeta. Cancelás cuando quieras.
        </p>
      </div>
    </section>
  )
}

export function ProductFinalCtaSection({
  entry,
  className,
  secondaryHref,
  secondaryLabel,
}: {
  entry: ProductEntryConfig
  className?: string
  secondaryHref?: string
  secondaryLabel?: string
}) {
  const registerHref = activarRegisterHref(entry.ctaPrimaryActivar)

  return (
    <section
      aria-labelledby="product-cta-heading"
      className={cn(
        "bg-gradient-to-br from-slate-950 via-[#0B1220] to-blue-950 px-4 py-16 text-white sm:px-6",
        className,
      )}
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2 id="product-cta-heading" className="font-[var(--font-fraunces)] text-3xl font-semibold">
          {entry.finalCta.title}
        </h2>
        <p className="mt-3 text-slate-400">{entry.finalCta.subtitle}</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="h-12 bg-emerald-500 px-8 font-semibold text-slate-950 hover:bg-emerald-400"
            asChild
          >
            <Link href={registerHref}>{entry.ctaPrimary}</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 border-white/20 bg-transparent px-8 text-white hover:bg-white/10"
            asChild
          >
            <Link href={secondaryHref ?? entry.demoHref}>{secondaryLabel ?? entry.ctaSecondary}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export function EcosistemaExpansionSection({
  className,
  subtitle,
}: {
  className?: string
  subtitle?: string
}) {
  return (
    <section
      aria-labelledby="ecosistema-heading"
      className={cn("border-t border-slate-200/80 bg-[#f8fafc] px-4 py-16 sm:px-6", className)}
    >
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <h2
            id="ecosistema-heading"
            className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900 sm:text-3xl"
          >
            {GTM_VITRINE_COPY.ecosistemaTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-slate-600">{subtitle ?? GTM_VITRINE_COPY.ecosistemaSubtitle}</p>
        </ScrollReveal>

        <MotionList className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ECOSISTEMA_CAPACIDADES.map((cap) => {
            const Icon = ECOSISTEMA_ICONS[cap.label as keyof typeof ECOSISTEMA_ICONS] ?? Layers
            return (
              <MotionListItem key={cap.label}>
                <Link
                  href={cap.href}
                  className="group flex h-full flex-col rounded-xl border border-slate-200/80 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-700">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="font-semibold text-slate-900 group-hover:text-emerald-800">{cap.label}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{cap.hint}</p>
                </Link>
              </MotionListItem>
            )
          })}
        </MotionList>
      </div>
    </section>
  )
}

export function EcosistemaCollapsibleSection({ className }: { className?: string }) {
  const demos = LANDING_FEATURED_DEMOS.slice(0, 3)

  return (
    <section className={cn("bg-white px-4 py-12 sm:px-6", className)}>
      <div className="mx-auto max-w-7xl">
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="h-auto w-full justify-between py-4 text-left"
              aria-expanded={undefined}
            >
              <span>
                <span className="block font-semibold text-slate-900">Ver más del ecosistema Claver</span>
                <span className="mt-0.5 block text-sm font-normal text-slate-500">
                  Demos por rubro, packs, plataformas y catálogo completo
                </span>
              </span>
              <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-8 space-y-16">
            <div>
              <h3 className="font-[var(--font-fraunces)] text-xl font-semibold text-slate-900">
                Probar por rubro
              </h3>
              <p className="mt-1 text-sm text-slate-600">Demo con datos de ejemplo, sin instalación.</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-3">
                {demos.map((pack) => (
                  <li key={pack.id}>
                    <Link
                      href={`/demo/${pack.id}`}
                      className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-[#f8fafc] p-4 transition hover:border-emerald-300"
                    >
                      <span className="text-xl" role="img" aria-hidden>
                        {pack.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 group-hover:text-emerald-800">{pack.label}</p>
                        <p className="text-xs text-slate-500">{pack.hint}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600" />
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-4 text-center">
                <Button variant="link" asChild>
                  <Link href="/demo">Todos los rubros</Link>
                </Button>
              </div>
            </div>

            <PacksRubroSection className="!px-0 !py-0" />
            <PlataformasSection className="!px-0 !py-0" />
            <CatalogoCompletoBanner className="!px-0 !py-0" />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </section>
  )
}

// Alias para la home (fiado como puerta de entrada)
export function FiadoHeroSection(
  props: Omit<Parameters<typeof ProductHeroSection>[0], "entry">,
) {
  return ProductHeroSection({ entry: FIADO_ENTRY, ...props })
}

export function FiadoAppPreviewSection(props: { className?: string }) {
  return ProductAppPreviewSection({ entry: FIADO_ENTRY, ...props })
}

export function FiadoStepsSection(props: { className?: string }) {
  return ProductStepsSection({ entry: FIADO_ENTRY, ...props })
}

export function FiadoSocialProofSection(props: { className?: string }) {
  return ProductSocialProofSection({ entry: FIADO_ENTRY, ...props })
}

export const FiadoPainOutcomeSection = ProductPainOutcomeSection
export const FiadoPricingStrip = ProductPricingStrip

export function FiadoFinalCtaSection(
  props: Omit<Parameters<typeof ProductFinalCtaSection>[0], "entry">,
) {
  return ProductFinalCtaSection({ entry: FIADO_ENTRY, ...props })
}
