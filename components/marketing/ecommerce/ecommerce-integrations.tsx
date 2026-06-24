"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollReveal } from "@/components/ui/motion"
import { ArrowRight, Sparkles } from "lucide-react"
import { getNovedadesComerciales, INTEGRATIONS_STATS } from "@/lib/marketing/integrations-catalog"

export function EcommerceIntegrations() {
  const novedades = getNovedadesComerciales().slice(0, 8)

  return (
    <section className="py-16 md:py-24 bg-slate-50/60" id="integraciones">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <ScrollReveal className="text-center mb-10">
          <Badge variant="outline" className="border-teal-300 bg-teal-50 text-teal-800">
            <Sparkles className="h-3 w-3 mr-1" />
            Novedad — Centro de Conexiones
          </Badge>
          <h2 className="mt-4 font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900 sm:text-4xl">
            30+ integraciones nativas
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600 text-sm">
            Shopify, Tienda Nube, Mercado Libre, Stripe, WhatsApp Business y logística argentina.
            Sin middlewares que se rompen.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            {INTEGRATIONS_STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-bold text-teal-700">{s.value}</p>
                <p className="text-[10px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {novedades.map((integ) => (
              <div
                key={integ.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-teal-300/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{integ.emoji}</span>
                  <Badge className="text-[10px] bg-violet-100 text-violet-700">{integ.badge}</Badge>
                </div>
                <div className="text-sm font-bold text-slate-900">{integ.nombre}</div>
                <div className="text-[10px] text-teal-600 uppercase mt-0.5">{integ.categoria}</div>
                <div className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2">{integ.descripcion}</div>
              </div>
            ))}
            <div className="rounded-2xl border border-dashed border-teal-300/60 bg-teal-50/30 p-5 flex flex-col items-center justify-center text-center gap-2">
              <span className="text-2xl">+22</span>
              <div className="text-sm font-bold text-slate-700">Más integraciones</div>
              <div className="text-xs text-slate-500">HubSpot, Booking, Andreani, Power BI…</div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal className="mt-8 text-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/claver/claverp/conexiones">
              Ver catálogo completo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </ScrollReveal>
      </div>
    </section>
  )
}