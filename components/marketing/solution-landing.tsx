"use client"

import Link from "next/link"
import { ArrowRight, Check, ExternalLink } from "lucide-react"
import type { SolutionPage } from "@/lib/marketing/solutions-catalog"
import { ClaverShell } from "@/components/marketing/claver-shell"
import { CLAVER_GROUP, CLAVERP_PRODUCT } from "@/lib/marketing/brand-system"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollReveal, MotionFadeDown } from "@/components/ui/motion"
import { cn } from "@/lib/utils"

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
})

const BG_LIGHT =
  "bg-[radial-gradient(circle_at_top,_rgba(239,246,255,0.9),_transparent_55%),_linear-gradient(160deg,_#f8fafc_0%,_#eff6ff_50%,_#fffbeb_100%)]"

interface SolutionLandingProps {
  solution: SolutionPage
  extra?: React.ReactNode
}

import { Store, Globe, Truck, UtensilsCrossed, Factory, Layers, Calculator, CreditCard, Palette, HelpCircle } from "lucide-react"

const IconMap = {
  Store,
  Globe,
  Truck,
  UtensilsCrossed,
  Factory,
  Layers,
  Calculator,
  CreditCard,
  Palette,
}

export function SolutionLanding({ solution, extra }: SolutionLandingProps) {
  const Icon = IconMap[solution.icon as keyof typeof IconMap] || HelpCircle
  const ctaHref = solution.demoLink ?? "/login"

  return (
    <ClaverShell context="claverp">
      {/* Hero */}
      <section
        className={cn(
          "relative overflow-hidden bg-gradient-to-br pt-28 pb-20 text-white sm:pt-32",
          solution.heroGradient,
        )}
      >
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <MotionFadeDown className="max-w-3xl">
            <Link
              href="/claver/claverp"
              className="mb-4 inline-block text-sm text-white/60 hover:text-white"
            >
              {CLAVERP_PRODUCT.name} · by {CLAVER_GROUP.name}
            </Link>
            <Badge className="mb-4 border-white/20 bg-white/10 text-white">
              {solution.emoji} Solución vertical
            </Badge>
            <h1 className="font-[var(--font-fraunces)] text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
              {solution.headline}
            </h1>
            <p className="mt-6 text-lg text-white/80">{solution.subheadline}</p>
            <p className="mt-4 text-sm text-white/60">
              <strong className="text-white/90">ICP:</strong> {solution.icp}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100" asChild>
                <Link href={ctaHref}>
                  {solution.cta}
                  {ctaHref.startsWith("http") || ctaHref.includes("tienda") ? (
                    <ExternalLink className="ml-2 h-4 w-4" />
                  ) : (
                    <ArrowRight className="ml-2 h-4 w-4" />
                  )}
                </Link>
              </Button>
              {solution.planFrom > 0 && (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                  asChild
                >
                  <Link href="/claver/claverp/precios">
                    Desde {currency.format(solution.planFrom)}/mes
                  </Link>
                </Button>
              )}
            </div>
          </MotionFadeDown>

          <div className="mt-16 grid grid-cols-3 gap-4 sm:max-w-lg">
            {solution.metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-2xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur-sm"
              >
                <div className="font-[var(--font-fraunces)] text-2xl font-semibold">{m.value}</div>
                <div className="mt-1 text-xs text-white/70">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dolores */}
      <section className={cn("px-4 py-20 sm:px-6", BG_LIGHT)}>
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="text-center">
            <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900">
              Problemas que resolvemos
            </h2>
          </ScrollReveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {solution.pains.map((pain) => (
              <ScrollReveal key={pain}>
                <Card className="border-red-100 bg-red-50/50">
                  <CardContent className="flex items-start gap-3 p-5">
                    <span className="text-red-500">✕</span>
                    <p className="text-sm text-slate-700">{pain}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Soluciones */}
      <section className="bg-white px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="flex items-center gap-3">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100", solution.accentColor)}>
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900">
              Cómo lo hacemos
            </h2>
          </ScrollReveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {solution.solutions.map((s) => (
              <ScrollReveal key={s.title}>
                <Card className="h-full border-slate-200/80 shadow-sm transition hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">{s.desc}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section className="bg-slate-950 px-4 py-16 text-white sm:px-6">
        <div className="mx-auto max-w-7xl text-center">
          <ScrollReveal>
            <p className="text-sm text-slate-400">Módulos incluidos en esta solución</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {solution.modules.map((m) => (
                <Badge key={m} variant="secondary" className="bg-white/10 text-white">
                  {m}
                </Badge>
              ))}
            </div>
            <Button className="mt-8 bg-blue-600 hover:bg-blue-500" asChild>
              <Link href="/claver/claverp/modulos">Ver catálogo completo</Link>
            </Button>
          </ScrollReveal>
        </div>
      </section>

      {extra}

      {/* FAQ */}
      <section className={cn("px-4 py-20 sm:px-6", BG_LIGHT)}>
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <h2 className="text-center font-[var(--font-fraunces)] text-2xl font-semibold">FAQ</h2>
            <Accordion type="single" collapsible className="mt-8">
              {solution.faq.map((item, i) => (
                <AccordionItem key={item.q} value={`f-${i}`}>
                  <AccordionTrigger>{item.q}</AccordionTrigger>
                  <AccordionContent>{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 px-4 py-16 text-white sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold">¿Seguimos?</h2>
          <p className="mt-4 text-white/80">14 días de prueba. Configuración por rubro con IA.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="bg-white text-slate-900" asChild>
              <Link href={ctaHref}>{solution.cta}</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white" asChild>
              <Link href="/claver/claverp">Ver todas las soluciones</Link>
            </Button>
          </div>
        </div>
      </section>
    </ClaverShell>
  )
}