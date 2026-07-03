"use client"

import Link from "next/link"
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileCheck,
  Shield,
  Sparkles,
  Timer,
} from "lucide-react"
import { ClaverShell } from "@/components/marketing/claver-shell"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { ClaverLandingFaq } from "@/components/marketing/claver-landing-faq"
import { CLAVER_SERVICE_LINES } from "@/lib/marketing/claver-services-catalog"
import { CLAVER_GROUP } from "@/lib/marketing/brand-system"
import { LANDING_FEATURED_DEMOS } from "@/lib/marketing/landing-seo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MotionFadeDown, ScrollReveal, MotionList, MotionListItem } from "@/components/ui/motion"
import { LogoShowcase } from "@/components/marketing/logo-showcase"

const STATUS_LABEL = {
  disponible: { text: "Disponible", className: "bg-emerald-600 text-white" },
  beta: { text: "Beta", className: "bg-blue-600 text-white" },
  proximamente: { text: "Próximamente", className: "bg-slate-500 text-white" },
}

const TRUST_ITEMS = [
  { icon: FileCheck, label: "Facturación AFIP" },
  { icon: Timer, label: "Trial 14 días gratis" },
  { icon: Shield, label: "Datos aislados por empresa" },
  { icon: Sparkles, label: "40+ módulos por rubro" },
] as const

const STEPS = [
  {
    step: "1",
    title: "Elegí tu rubro",
    desc: "Demo en 10 segundos: almacén, consorcios, gimnasio y más.",
  },
  {
    step: "2",
    title: "Probá con datos reales",
    desc: "Fiado, stock, agenda o mesas — sin tarjeta en el trial.",
  },
  {
    step: "3",
    title: "Activá lo que uses",
    desc: "Empezá con un enganche chico y escalá al ERP cuando crezcas.",
  },
] as const

export function ClaverMatrixHub() {
  return (
    <ClaverShell context="matrix">
      {/* Hero */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden bg-[#0B1220] pt-28 pb-20 text-white sm:pt-32 sm:pb-28"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(37,99,235,0.22),transparent)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 top-32 h-80 w-80 rounded-full bg-emerald-500/10 blur-[100px]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <MotionFadeDown>
            <Badge className="mb-6 border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
              <Building2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Grupo {CLAVER_GROUP.name} · Argentina
            </Badge>
            <div className="mb-8">
              <BrandLogo size="lg" theme="dark" variant="group-full" showByClaver={false} />
            </div>
            <h1
              id="hero-heading"
              className="max-w-4xl font-[var(--font-fraunces)] text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]"
            >
              {CLAVER_GROUP.tagline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-300 leading-relaxed">
              {CLAVER_GROUP.descriptor}. ERP, POS con AFIP y micro-apps para almacenes, consorcios,
              distribuidoras y agro — en un solo ecosistema.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                size="lg"
                className="h-12 bg-emerald-500 px-8 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
                asChild
              >
                <Link href="/login/register?trial=14">
                  Probar gratis 14 días
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-white/20 bg-white/5 px-8 text-base text-white hover:bg-white/10"
                asChild
              >
                <Link href="/demo">
                  Ver demos por rubro
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              ¿Ya tenés cuenta?{" "}
              <Link href="/login" className="text-emerald-400 underline-offset-4 hover:underline">
                Iniciar sesión
              </Link>
              {" · "}
              <Link
                href="/claver/claverp"
                className="text-slate-400 underline-offset-4 hover:text-white hover:underline"
              >
                Conocer Claver ERP
              </Link>
              {" · "}
              <Link
                href="/claver/clavergrow"
                className="text-slate-400 underline-offset-4 hover:text-white hover:underline"
              >
                Clavergrow Agro
              </Link>
            </p>

            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-8">
              {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-sm text-slate-400">
                  <Icon className="h-4 w-4 text-emerald-400" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
          </MotionFadeDown>
          <LogoShowcase variant="matrix" />
        </div>
      </section>

      {/* Demos destacados — conversión */}
      <section
        aria-labelledby="demos-heading"
        className="border-b border-slate-200/80 bg-white px-4 py-20 sm:px-6"
      >
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="text-center">
            <h2
              id="demos-heading"
              className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900 sm:text-4xl"
            >
              Probá tu rubro en minutos
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Sin llamadas ni instalación. Elegí el paquete y entrá al dashboard con datos de ejemplo.
            </p>
          </ScrollReveal>

          <MotionList className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LANDING_FEATURED_DEMOS.map((pack) => (
              <MotionListItem key={pack.id}>
                <Link
                  href={`/demo/${pack.id}`}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 transition hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-md"
                >
                  <span className="text-3xl" role="img" aria-hidden>
                    {pack.emoji}
                  </span>
                  <h3 className="mt-3 font-semibold text-slate-900 group-hover:text-emerald-800">
                    {pack.label}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{pack.hint}</p>
                  <span className="mt-4 inline-flex items-center text-sm font-medium text-emerald-700">
                    Abrir demo
                    <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </MotionListItem>
            ))}
          </MotionList>

          <div className="mt-10 text-center">
            <Button variant="outline" className="border-slate-300" asChild>
              <Link href="/demo">Ver todos los rubros</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Cómo empezar */}
      <section aria-labelledby="steps-heading" className="bg-[#f8fafc] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="text-center">
            <h2
              id="steps-heading"
              className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900"
            >
              Cómo empezar
            </h2>
          </ScrollReveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <ScrollReveal key={s.step}>
                <Card className="h-full border-slate-200/80 bg-white shadow-sm">
                  <CardHeader>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                      {s.step}
                    </span>
                    <CardTitle className="mt-4 font-[var(--font-fraunces)] text-xl">{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Líneas de negocio */}
      <section aria-labelledby="lines-heading" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="text-center">
            <h2
              id="lines-heading"
              className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900 sm:text-4xl"
            >
              Líneas de negocio {CLAVER_GROUP.name}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-600">
              Un conglomerado de sistemas. Cada línea resuelve un problema; juntas cubren la operación
              entera.
            </p>
          </ScrollReveal>

          <MotionList className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CLAVER_SERVICE_LINES.map((line) => {
              const Icon = line.icon
              const status = STATUS_LABEL[line.status]
              const ringClass =
                line.id === "claverp"
                  ? "ring-2 ring-blue-500/30 border-blue-100"
                  : line.id === "clavergrow"
                    ? "ring-2 ring-emerald-500/30 border-emerald-100"
                    : line.id === "clavercloud"
                      ? "ring-2 ring-violet-500/30 border-violet-100"
                      : "border-slate-200/80"

              const inner = (
                <Card
                  className={`group h-full bg-white transition hover:-translate-y-0.5 hover:shadow-lg ${ringClass}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${line.gradient} text-white shadow-md`}
                      >
                        <Icon className="h-6 w-6" aria-hidden />
                      </div>
                      <Badge className={status.className}>{status.text}</Badge>
                    </div>
                    <CardTitle className="mt-4 font-[var(--font-fraunces)] text-xl text-slate-900">
                      {line.name}
                    </CardTitle>
                    <p className="text-sm font-medium text-blue-700">{line.tagline}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 leading-relaxed">{line.description}</p>
                    <ul className="mt-4 space-y-1.5">
                      {line.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-slate-500">
                          <CheckCircle2
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                            aria-hidden
                          />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {line.href && (
                      <span className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 group-hover:underline">
                        Explorar
                        <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
                      </span>
                    )}
                  </CardContent>
                </Card>
              )

              return (
                <MotionListItem key={line.id}>
                  {line.href ? (
                    <Link href={line.href} className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </MotionListItem>
              )
            })}
          </MotionList>
        </div>
      </section>

      {/* FAQ — SEO + confianza */}
      <section aria-labelledby="faq-heading" className="bg-[#f8fafc] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal className="text-center">
            <h2
              id="faq-heading"
              className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900"
            >
              Preguntas frecuentes
            </h2>
            <p className="mt-3 text-slate-600">
              Respuestas claras antes de registrarte o pedir una demo.
            </p>
          </ScrollReveal>
          <div className="mt-10 rounded-2xl border border-slate-200/80 bg-white px-4 py-2 shadow-sm sm:px-6">
            <ClaverLandingFaq />
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section
        aria-labelledby="cta-heading"
        className="bg-gradient-to-br from-slate-950 via-[#0B1220] to-blue-950 px-4 py-20 text-white sm:px-6"
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="cta-heading" className="font-[var(--font-fraunces)] text-3xl font-semibold sm:text-4xl">
            Ordená tu negocio esta semana
          </h2>
          <p className="mt-4 text-slate-400">
            Registrate gratis, probá 14 días y activá solo los módulos que necesitás.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 bg-emerald-500 px-8 font-semibold text-slate-950 hover:bg-emerald-400"
              asChild
            >
              <Link href="/login/register?trial=14">Crear cuenta gratis</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-white/20 bg-transparent px-8 text-white hover:bg-white/10"
              asChild
            >
              <Link href="/claver/claverp/precios">Ver precios</Link>
            </Button>
          </div>
        </div>
      </section>
    </ClaverShell>
  )
}