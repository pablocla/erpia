"use client"

import Link from "next/link"
import { ArrowRight, Building2, Check } from "lucide-react"
import {
  CLAVERP_ADVISOR_BLOCK,
  CLAVERP_FEATURE_BLOCKS,
  CLAVERP_PLATFORM_MODULES,
  CLAVERP_VALUE_PROPS,
} from "@/lib/marketing/claverp-landing-features"
import { ClaverpFeatureVisual } from "@/components/marketing/claverp-dashboard-mockup"
import { Button } from "@/components/ui/button"
import { ScrollReveal } from "@/components/ui/motion"
import { cn } from "@/lib/utils"

export function ClaverpPlatformGrid() {
  return (
    <section
      id="plataforma"
      aria-labelledby="claverp-platform-heading"
      className="relative overflow-hidden bg-[#0A1628] py-20 text-white sm:py-24"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(37,99,235,0.2),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <ScrollReveal className="text-center">
          <h2
            id="claverp-platform-heading"
            className="bg-gradient-to-b from-white to-slate-400 bg-clip-text font-[var(--font-fraunces)] text-3xl font-bold tracking-tight text-transparent md:text-5xl"
          >
            Seis módulos. Una plataforma. Cero complicaciones.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Activá solo lo que tu operación necesita. Todo comparte clientes, stock y facturación AFIP.
          </p>
        </ScrollReveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CLAVERP_PLATFORM_MODULES.map((mod) => {
            const Icon = mod.icon
            return (
              <ScrollReveal key={mod.id}>
                <Link
                  href={mod.href}
                  className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-blue-400/40 hover:bg-white/10"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/20 text-blue-300 transition group-hover:bg-blue-600 group-hover:text-white">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-base font-semibold tracking-tight text-white">
                    {mod.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
                    {mod.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-400 group-hover:text-blue-300">
                    Explorar
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function ClaverpFeatureSections() {
  return (
    <div id="funcionalidades">
      {CLAVERP_FEATURE_BLOCKS.map((block, index) => {
        const isDark = block.variant === "dark"
        const visualFirst = index % 2 === 1

        return (
          <section
            key={block.id}
            aria-labelledby={`feature-${block.id}`}
            className={cn(
              "overflow-x-clip py-16 md:py-24",
              isDark ? "bg-[#0A1628] text-white" : "bg-neutral-50 text-neutral-900",
            )}
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <ScrollReveal
                  className={cn(visualFirst && "lg:order-2")}
                >
                  <p
                    className={cn(
                      "text-xs font-semibold uppercase tracking-widest",
                      isDark ? "text-blue-300" : "text-blue-600",
                    )}
                  >
                    {block.eyebrow}
                  </p>
                  <h2
                    id={`feature-${block.id}`}
                    className={cn(
                      "mt-3 text-3xl font-bold leading-snug tracking-tight md:text-4xl",
                      isDark ? "text-white" : "text-neutral-900",
                    )}
                  >
                    {block.title}
                  </h2>
                  <p
                    className={cn(
                      "mt-4 text-base leading-relaxed",
                      isDark ? "text-slate-300" : "text-neutral-600",
                    )}
                  >
                    {block.description}
                  </p>
                  <ul className="mt-8 space-y-5">
                    {block.bullets.map((b) => (
                      <li key={b.title} className="flex gap-3">
                        <span
                          className={cn(
                            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                            isDark ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700",
                          )}
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden />
                        </span>
                        <div>
                          <p
                            className={cn(
                              "text-base font-semibold",
                              isDark ? "text-white" : "text-neutral-900",
                            )}
                          >
                            {b.title}
                          </p>
                          <p className={cn("text-sm", isDark ? "text-slate-400" : "text-neutral-600")}>
                            {b.text}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn(
                      "mt-8",
                      isDark
                        ? "bg-blue-600 hover:bg-blue-500"
                        : "bg-blue-600 text-white hover:bg-blue-500",
                    )}
                    asChild
                  >
                    <Link href={block.cta.href}>
                      {block.cta.label}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </ScrollReveal>

                <ScrollReveal
                  className={cn("flex justify-center", visualFirst ? "lg:order-1 lg:justify-start" : "lg:justify-end")}
                >
                  <div className="w-full max-w-[520px]">
                    <ClaverpFeatureVisual type={block.visual} />
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}

export function ClaverpValuePropsStrip() {
  return (
    <section
      aria-labelledby="claverp-value-props"
      className="border-b border-slate-200 bg-white py-16 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2
            id="claverp-value-props"
            className="font-[var(--font-fraunces)] text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl"
          >
            Reemplazá procesos manuales con un software intuitivo
          </h2>
          <p className="mt-3 text-neutral-600">
            Pensado para PyMEs argentinas — no una adaptación europea con parches.
          </p>
        </ScrollReveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CLAVERP_VALUE_PROPS.map((prop) => (
            <ScrollReveal key={prop.title}>
              <div className="group rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 transition hover:border-blue-200 hover:shadow-md">
                <h3 className="text-lg font-bold tracking-tight text-neutral-900 transition-colors group-hover:text-blue-700">
                  {prop.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{prop.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ClaverpAdvisorSection() {
  const block = CLAVERP_ADVISOR_BLOCK
  return (
    <section
      aria-labelledby="claverp-advisor-heading"
      className="border-y border-slate-200 bg-[#f8fafc] py-16 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <ScrollReveal>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <Building2 className="h-7 w-7" aria-hidden />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-blue-600">
              {block.eyebrow}
            </p>
            <h2
              id="claverp-advisor-heading"
              className="mt-2 font-[var(--font-fraunces)] text-3xl font-bold text-neutral-900 md:text-4xl"
            >
              {block.title}
            </h2>
            <p className="mt-4 text-neutral-600 leading-relaxed">{block.description}</p>
            <ul className="mt-6 space-y-2">
              {block.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm text-neutral-700">
                  <Check className="h-4 w-4 text-emerald-600" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button className="bg-blue-600 hover:bg-blue-500" asChild>
                <a href={block.cta.href}>{block.cta.label}</a>
              </Button>
              <Button variant="outline" asChild>
                <Link href={block.secondary.href}>{block.secondary.label}</Link>
              </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 md:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Libro IVA · ventas
              </p>
              <p className="mt-2 font-[var(--font-fraunces)] text-3xl font-bold text-slate-900">
                Marzo 2026
              </p>
              <div className="mt-6 space-y-2 border-t border-slate-100 pt-4 text-sm">
                {[
                  ["Neto gravado 21%", "$ 4.821.300"],
                  ["IVA débito fiscal", "$ 1.012.473"],
                  ["Notas de crédito", "$ 84.200"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-slate-600">
                    <span>{label}</span>
                    <span className="font-semibold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                Exportable TXT RG 4597 · listo para presentar
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}