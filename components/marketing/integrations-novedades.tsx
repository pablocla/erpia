"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollReveal, MotionFadeDown } from "@/components/ui/motion"
import { ArrowRight, Plug, Sparkles } from "lucide-react"
import {
  INTEGRATIONS_HERO,
  INTEGRATIONS_STATS,
  getNovedadesComerciales,
  getIntegracionesComerciales,
} from "@/lib/marketing/integrations-catalog"

interface Props {
  /** "novedades" = solo badges nuevos; "full" = catálogo completo compacto */
  variant?: "novedades" | "full" | "hero"
  showStats?: boolean
  ctaLogin?: boolean
}

export function IntegrationsNovedades({
  variant = "novedades",
  showStats = true,
  ctaLogin = false,
}: Props) {
  const items = variant === "novedades"
    ? getNovedadesComerciales()
    : getIntegracionesComerciales(variant === "full" ? 12 : 8)

  return (
    <section className="py-16 md:py-24 relative overflow-hidden" id="conexiones-nativas">
      <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 via-transparent to-violet-500/5 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <MotionFadeDown className="text-center mb-10">
          <Badge className="mb-4 bg-teal-500/15 text-teal-800 border-teal-200">
            <Sparkles className="h-3 w-3 mr-1" />
            {INTEGRATIONS_HERO.badge}
          </Badge>
          <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900 sm:text-4xl">
            {INTEGRATIONS_HERO.titulo}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            {INTEGRATIONS_HERO.subtitulo}
          </p>
        </MotionFadeDown>

        {showStats && (
          <ScrollReveal className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-3xl mx-auto">
            {INTEGRATIONS_STATS.map((s) => (
              <div key={s.label} className="text-center rounded-xl border border-slate-200/80 bg-white/80 py-4 px-2">
                <p className="text-2xl font-bold text-teal-700">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </ScrollReveal>
        )}

        <ScrollReveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:border-teal-300/60"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-3xl">{item.emoji}</span>
                  {'novedad' in item && item.novedad && (
                    <Badge className="text-[10px] bg-violet-100 text-violet-700 shrink-0">Nuevo</Badge>
                  )}
                  {!('novedad' in item && item.novedad) && item.badge && (
                    <Badge variant="outline" className="text-[10px] shrink-0">{item.badge}</Badge>
                  )}
                </div>
                <p className="font-semibold text-slate-900 text-sm">{item.nombre}</p>
                {"categoria" in item && (
                  <p className="text-[10px] uppercase tracking-wide text-teal-600 mt-0.5">{item.categoria}</p>
                )}
                <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-3">{item.descripcion}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link href={INTEGRATIONS_HERO.ctaHref}>
              <Plug className="h-4 w-4" />
              {INTEGRATIONS_HERO.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          {ctaLogin && (
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Conectar mi empresa</Link>
            </Button>
          )}
        </ScrollReveal>
      </div>
    </section>
  )
}