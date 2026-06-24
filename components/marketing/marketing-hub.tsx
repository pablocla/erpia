"use client"

import Link from "next/link"
import { ArrowRight, Map, Store, Globe, Truck, UtensilsCrossed, Factory, Layers, Calculator, CreditCard, Palette, HelpCircle } from "lucide-react"

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

import { MarketingShell } from "@/components/marketing/marketing-shell"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { HUB_SOLUTIONS } from "@/lib/marketing/solutions-catalog"
import { MARKETING_ROADMAP, BRAND_RECOMMENDED } from "@/lib/marketing/brand-system"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MotionFadeDown, ScrollReveal, MotionList, MotionListItem } from "@/components/ui/motion"

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
})

export function MarketingHub() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 pt-28 pb-24 text-white sm:pt-32">
        <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-blue-600/25 blur-[120px]" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-amber-500/15 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <MotionFadeDown>
            <Badge className="mb-6 border-amber-400/30 bg-amber-500/15 text-amber-200">
              <Map className="mr-1.5 h-3.5 w-3.5" />
              Departamento de Marketing — Hub comercial
            </Badge>
            <div className="mb-8">
              <BrandLogo size="lg" theme="dark" />
            </div>
            <h1 className="max-w-4xl font-[var(--font-fraunces)] text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              {BRAND_RECOMMENDED.tagline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-400">
              {BRAND_RECOMMENDED.descriptor}. Elegí tu vertical, entrá a la landing dedicada y
              convertí con demo + trial.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500" asChild>
                <Link href="/login">
                  Probar demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 hover:bg-white/10"
                asChild
              >
                <Link href="/marketing/marca">Ver identidad de marca</Link>
              </Button>
            </div>
          </MotionFadeDown>
        </div>
      </section>

      {/* Mapa de soluciones */}
      <section className="bg-[#f8fafc] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="text-center">
            <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900 sm:text-4xl">
              Roadmap de páginas comerciales
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-600">
              Una landing por vertical = mensaje claro, SEO por rubro, CTA medible.
            </p>
          </ScrollReveal>

          <MotionList className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HUB_SOLUTIONS.map((sol) => {
              const Icon = IconMap[sol.icon as keyof typeof IconMap] || HelpCircle
              return (
                <MotionListItem key={sol.slug}>
                  <Link href={`/marketing/${sol.slug}`} className="block h-full">
                    <Card className="group h-full border-slate-200/80 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${sol.heroGradient} text-white`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="text-2xl">{sol.emoji}</span>
                        </div>
                        <CardTitle className="mt-4 font-[var(--font-fraunces)] text-xl group-hover:text-blue-700">
                          {sol.headline.split(" ").slice(0, 4).join(" ")}…
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="line-clamp-2 text-sm text-slate-600">{sol.subheadline}</p>
                        {sol.planFrom > 0 && (
                          <p className="mt-4 text-sm font-medium text-blue-700">
                            Desde {currency.format(sol.planFrom)}/mes
                          </p>
                        )}
                        <span className="mt-4 inline-flex items-center text-sm font-medium text-blue-600">
                          Ver landing
                          <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                </MotionListItem>
              )
            })}
          </MotionList>

          <ScrollReveal className="mt-10 flex flex-wrap justify-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/modulos">Catálogo 40+ módulos</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/marketing/precios">Tabla de precios</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/marketing/contadores">Programa partners</Link>
            </Button>
          </ScrollReveal>
        </div>
      </section>

      {/* Fases roadmap */}
      <section className="bg-slate-950 px-4 py-20 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold">
              Plan de marketing Q2–Q4 2026
            </h2>
          </ScrollReveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {MARKETING_ROADMAP.map((phase) => (
              <ScrollReveal key={phase.phase}>
                <Card className="border-white/10 bg-white/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">{phase.phase}</CardTitle>
                      <Badge
                        variant={phase.status === "en_curso" ? "default" : "secondary"}
                        className={phase.status === "en_curso" ? "bg-blue-600" : ""}
                      >
                        {phase.quarter}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5 text-sm text-slate-400">
                      {phase.items.map((item) => (
                        <li key={item}>→ {item}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-16 text-center text-white sm:px-6">
        <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold">
          ¿Por dónde empezamos?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-white/85">
          La mayoría arranca por POS & AFIP o Ecommerce. El hub te lleva a la landing correcta.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" className="bg-white text-slate-900" asChild>
            <Link href="/marketing/pos-afip">POS & AFIP</Link>
          </Button>
          <Button size="lg" variant="outline" className="border-white/40 text-white" asChild>
            <Link href="/marketing/ecommerce">Ecommerce</Link>
          </Button>
        </div>
      </section>
    </MarketingShell>
  )
}