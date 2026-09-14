"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Menu, X } from "lucide-react"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { WorksLeadForm } from "@/components/works/works-lead-form"
import {
  getSegmentPack,
  type WorksSegmentKey,
} from "@/components/works/segment-packs"

export function SegmentLanding({ segmento }: { segmento: WorksSegmentKey }) {
  const pack = getSegmentPack(segmento)
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div
      data-page={`works-${segmento}`}
      lang="es-AR"
      className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-50 antialiased"
    >
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Claver Home">
            <BrandLogo size="sm" theme="dark" variant="group-full" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
            <a href="#que-hacemos" className="transition hover:text-white">
              Qué hacemos
            </a>
            <a href="#flujo" className="transition hover:text-white">
              Cómo funciona
            </a>
            <a href="#faq" className="transition hover:text-white">
              Preguntas
            </a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="min-h-12 text-slate-300 hover:bg-slate-900 hover:text-white"
            >
              <Link href="/">Holding</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-h-12 border-slate-600 text-slate-200"
            >
              <Link href={pack.ctaSecondaryHref}>{pack.ctaSecondaryLabel}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="min-h-12 bg-amber-400 font-semibold text-slate-950 hover:bg-amber-300"
            >
              <a href="#cotizar">
                {pack.ctaPrimary}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
          <button
            type="button"
            className="ml-auto inline-flex min-h-12 min-w-12 items-center justify-center rounded-lg text-white md:hidden"
            onClick={() => setNavOpen((o) => !o)}
            aria-expanded={navOpen}
            aria-label={navOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {navOpen ? (
          <nav
            className="border-t border-slate-800 bg-slate-950 px-4 py-3 md:hidden"
            aria-label="Menú móvil"
          >
            <div className="flex flex-col gap-1">
              <a
                href="#que-hacemos"
                onClick={() => setNavOpen(false)}
                className="min-h-12 rounded-lg px-3 py-3 text-sm text-slate-200"
              >
                Qué hacemos
              </a>
              <a
                href="#flujo"
                onClick={() => setNavOpen(false)}
                className="min-h-12 rounded-lg px-3 py-3 text-sm text-slate-200"
              >
                Cómo funciona
              </a>
              <a
                href="#faq"
                onClick={() => setNavOpen(false)}
                className="min-h-12 rounded-lg px-3 py-3 text-sm text-slate-200"
              >
                Preguntas
              </a>
              <Link
                href="/"
                onClick={() => setNavOpen(false)}
                className="min-h-12 rounded-lg px-3 py-3 text-sm text-slate-200"
              >
                Holding
              </Link>
              <a
                href="#cotizar"
                onClick={() => setNavOpen(false)}
                className="min-h-12 rounded-lg bg-amber-400 px-3 py-3 text-center text-sm font-semibold text-slate-950"
              >
                {pack.ctaPrimary}
              </a>
            </div>
          </nav>
        ) : null}
      </header>

      <main>
        {/* 2.1 Hero */}
        <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-10 pb-14 sm:pt-14 sm:pb-16 lg:pt-16 lg:pb-20">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(245,158,11,0.14),transparent)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-5">
                <p className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
                  {pack.eyebrow}
                </p>
                <h1 className="font-[var(--font-fraunces)] text-3xl font-semibold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {pack.h1}
                </h1>
                <p className="text-lg leading-relaxed text-slate-300 sm:text-xl">{pack.h2}</p>
                <p className="text-sm text-slate-400">{pack.promiseLine}</p>
                <ul className="space-y-2.5 text-sm text-slate-200 sm:text-base">
                  {pack.bullets.map((b) => (
                    <li key={b} className="flex gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300">
                        <Check className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-3 pt-1 lg:hidden">
                  <Button
                    asChild
                    size="lg"
                    className="min-h-12 bg-amber-400 font-semibold text-slate-950 hover:bg-amber-300"
                  >
                    <a href="#cotizar">{pack.ctaPrimary}</a>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="lg"
                    className="min-h-12 text-slate-300"
                  >
                    <Link href={pack.ctaSecondaryHref}>{pack.ctaSecondaryLabel}</Link>
                  </Button>
                </div>
                <p className="text-xs text-slate-500 lg:hidden">{pack.ctaMicro}</p>
              </div>
              <div id="cotizar" className="scroll-mt-24 lg:sticky lg:top-24">
                <WorksLeadForm segmento={segmento} />
              </div>
            </div>
          </div>
        </section>

        {/* 2.2 Qué hacemos */}
        <section
          id="que-hacemos"
          className="scroll-mt-20 border-b border-slate-800/80 py-14 sm:py-16"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold text-white sm:text-3xl">
              Qué hacemos (Claver)
            </h2>
            <p className="mt-2 max-w-2xl text-slate-400">
              Orquestamos el proyecto. El partner ejecuta.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pack.queHacemos.map((item, i) => (
                <li
                  key={i}
                  className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-sm leading-relaxed text-slate-200"
                >
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-amber-400/80">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 2.3 Partner */}
        <section
          id="partner"
          className="scroll-mt-20 border-b border-slate-800/80 bg-slate-900/30 py-14 sm:py-16"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold text-white sm:text-3xl">
              Qué hace el partner
            </h2>
            <ul className="mt-8 space-y-3">
              {pack.queHacePartner.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 px-4 py-3 text-sm text-slate-200 sm:text-base"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 2.4 Flujo Lead → Cobrado */}
        <section id="flujo" className="scroll-mt-20 border-b border-slate-800/80 py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold text-white sm:text-3xl">
              De la consulta al cobro
            </h2>
            <p className="mt-2 text-slate-400">Siete pasos claros. Sin jerga de sistemas.</p>
            <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {pack.flujo.map((step) => (
                <li
                  key={step.n}
                  className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-4"
                >
                  <span className="text-xs font-bold text-amber-400">Paso {step.n}</span>
                  <p className="mt-2 text-sm font-medium leading-snug text-slate-100">{step.label}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 2.5 Social proof / placeholder */}
        <section
          id="social"
          className="scroll-mt-20 border-b border-slate-800/80 bg-slate-900/30 py-14 sm:py-16"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Social proof · placeholder
              </p>
              <h2 className="mt-2 font-[var(--font-fraunces)] text-xl font-semibold text-white sm:text-2xl">
                {pack.social.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">{pack.social.body}</p>
            </div>
          </div>
        </section>

        {/* 2.6 FAQ */}
        <section id="faq" className="scroll-mt-20 border-b border-slate-800/80 py-14 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold text-white sm:text-3xl">
              Preguntas frecuentes
            </h2>
            <Accordion type="single" collapsible className="mt-8">
              {pack.faq.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-slate-800">
                  <AccordionTrigger className="min-h-12 text-left text-slate-100 hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-400">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* 2.7 Soft upsell — bajo fold / post-deal ONLY */}
        <section
          id="soft-upsell"
          className="scroll-mt-20 border-b border-slate-800/80 py-12 sm:py-14"
          aria-label="Upsell Soft post-deal"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-5 py-6 sm:px-8 sm:py-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Después del proyecto
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-100 sm:text-xl">
                {pack.softUpsell.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">{pack.softUpsell.body}</p>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="mt-4 min-h-12 px-0 text-amber-300 hover:bg-transparent hover:text-amber-200"
              >
                <Link href={pack.softUpsell.href}>
                  {pack.softUpsell.linkLabel}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Claver Works · Orquestación con partners</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="hover:text-slate-300">
              Holding
            </Link>
            <Link href="/software" className="hover:text-slate-300">
              Soft
            </Link>
            <a href="#cotizar" className="hover:text-slate-300">
              {pack.ctaPrimary}
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
