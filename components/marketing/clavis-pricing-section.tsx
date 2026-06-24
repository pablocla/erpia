"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Check,
  Minus,
  Sparkles,
  Shield,
  Star,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollReveal } from "@/components/ui/motion"
import { cn } from "@/lib/utils"
import {
  CLAVIS_CORE,
  CLAVIS_CORE_INDUSTRIA,
  CLAVIS_BUNDLES,
  ALA_CARTE,
  PRODUCT_LINES,
  COMPARISON_INTEGRATIONS,
  COMPARISON_MATRIX,
  TRUST_MESSAGES,
  OBJECTION_HANDLERS,
  PRICING_META,
  formatArs,
} from "@/lib/marketing/pricing-catalog"

type BillingCycle = "monthly" | "annual"

interface ClavisPricingSectionProps {
  /** Mostrar solo la sección compacta (para embed en landing principal) */
  compact?: boolean
}

export function ClavisPricingSection({ compact = false }: ClavisPricingSectionProps) {
  const [billing, setBilling] = useState<BillingCycle>("monthly")
  const [showAlaCarte, setShowAlaCarte] = useState(!compact)
  const [showMatrix, setShowMatrix] = useState(!compact)

  const price = (monthly: number, annual: number) =>
    billing === "monthly" ? monthly : Math.round(annual / 12)

  const priceLabel = billing === "monthly" ? "/mes" : "/mes (facturado anual)"

  return (
    <section id="precios" className="scroll-mt-24 bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-20">

        {/* Hero pricing */}
        <ScrollReveal className="text-center">
          <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700">
            Planes 2026 · Empaquetado comercial
          </Badge>
          <h2 className="mt-4 font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900 sm:text-4xl">
            Un Core. Bundles que resuelven. Sin laberinto de precios.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Empezá con Clavis Core (ERP + AFIP) y sumá solo lo que tu operación necesita.
            Los bundles cuestan menos que comprar canal por canal.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                billing === "monthly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setBilling("annual")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition flex items-center gap-1.5",
                billing === "annual"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              Anual
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                {PRICING_META.annualDiscountLabel}
              </span>
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">{PRICING_META.vatNote}</p>
        </ScrollReveal>

        {/* Líneas de producto */}
        <ScrollReveal>
          <div className="flex flex-wrap justify-center gap-2">
            {PRODUCT_LINES.map((line) => (
              <span
                key={line.id}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
              >
                <span className="font-bold text-slate-800">{line.name}</span>
                <span className="text-slate-400"> · {line.description}</span>
              </span>
            ))}
          </div>
        </ScrollReveal>

        {/* Core cards */}
        <ScrollReveal>
          <p className="mb-6 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
            Plataforma base (obligatoria)
          </p>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {[CLAVIS_CORE, CLAVIS_CORE_INDUSTRIA].map((core) => (
              <Card
                key={core.id}
                className="border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm"
              >
                <CardHeader className="p-6">
                  <CardTitle className="font-[var(--font-fraunces)] text-xl text-slate-900">
                    {core.name}
                  </CardTitle>
                  <p className="text-sm text-slate-500">{core.tagline}</p>
                  <div className="mt-3 flex items-baseline">
                    <span className="font-[var(--font-fraunces)] text-3xl font-bold text-slate-900">
                      {formatArs(price(core.priceMonthly, core.priceAnnual))}
                    </span>
                    <span className="ml-1 text-sm text-slate-500">{priceLabel}</span>
                  </div>
                  {billing === "annual" && (
                    <p className="text-xs text-emerald-600 font-medium">
                      {formatArs(core.priceAnnual)} facturado al año
                    </p>
                  )}
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <p className="text-sm text-slate-600 mb-4">{core.valueProp}</p>
                  <ul className="space-y-2">
                    {core.modules.map((m) => (
                      <li key={m} className="flex items-start gap-2 text-sm text-slate-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        {m}
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-6 w-full" variant="outline" asChild>
                    <Link href="/login">{core.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollReveal>

        {/* Bundle cards */}
        <div>
          <ScrollReveal className="text-center mb-10">
            <Badge className="bg-blue-600 text-white hover:bg-blue-600">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 inline" />
              Bundles recomendados
            </Badge>
            <h3 className="mt-4 font-[var(--font-fraunces)] text-2xl font-bold text-slate-900">
              Sumá capacidades con descuento
            </h3>
            <p className="mt-2 text-sm text-slate-500 max-w-lg mx-auto">
              Precios add-on sobre Core. El total de referencia incluye la base.
            </p>
          </ScrollReveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {CLAVIS_BUNDLES.map((bundle) => (
              <ScrollReveal key={bundle.id} className="flex">
                <Card
                  className={cn(
                    "relative flex flex-col w-full overflow-hidden transition-all duration-300",
                    bundle.highlighted
                      ? "border-blue-300 shadow-[0_30px_70px_-40px_rgba(37,99,235,0.35)] ring-2 ring-blue-500/30"
                      : "border-slate-200 shadow-sm hover:shadow-md",
                  )}
                >
                  {bundle.highlighted && (
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 to-blue-600" />
                  )}
                  <CardHeader className="p-5">
                    {bundle.badge && (
                      <Badge
                        className={cn(
                          "mb-2 w-fit text-white font-medium",
                          bundle.highlighted ? "bg-blue-600 hover:bg-blue-600" : "bg-slate-700 hover:bg-slate-700",
                        )}
                      >
                        {bundle.badge}
                      </Badge>
                    )}
                    <CardTitle className="font-[var(--font-fraunces)] text-lg text-slate-900 leading-tight">
                      {bundle.name}
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-1">{bundle.tagline}</p>
                    <div className="mt-3">
                      <div className="flex items-baseline">
                        <span className="text-xs text-slate-400 mr-1">+</span>
                        <span className="font-[var(--font-fraunces)] text-2xl font-bold text-slate-900">
                          {formatArs(price(bundle.priceMonthly, bundle.priceAnnual))}
                        </span>
                        <span className="ml-1 text-xs text-slate-500">{priceLabel}</span>
                      </div>
                      {bundle.totalMonthly && (
                        <p className="mt-1 text-[11px] text-slate-400">
                          Total ref. {formatArs(
                            billing === "monthly"
                              ? bundle.totalMonthly
                              : Math.round((bundle.priceAnnual + CLAVIS_CORE.priceAnnual) / 12),
                          )}
                          /mes con Core
                        </p>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1 p-5 pt-0">
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">{bundle.valueProp}</p>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          Integraciones
                        </p>
                        <ul className="space-y-1">
                          {bundle.integrations.map((i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                              <Check className="mt-0.5 h-3 w-3 shrink-0 text-blue-600" />
                              {i}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {bundle.setupFee && (
                      <p className="mt-3 text-[10px] text-slate-400">
                        Setup opcional desde {formatArs(bundle.setupFee)}
                      </p>
                    )}
                    <Button
                      className={cn(
                        "mt-4 w-full h-10 text-sm",
                        bundle.highlighted
                          ? "bg-blue-600 hover:bg-blue-500 text-white"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                      )}
                      variant={bundle.highlighted ? "default" : "outline"}
                      asChild
                    >
                      <Link href="/login">{bundle.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Comparison matrix */}
        <ScrollReveal>
          <button
            type="button"
            onClick={() => setShowMatrix((v) => !v)}
            className="mx-auto flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            {showMatrix ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showMatrix ? "Ocultar" : "Ver"} tabla comparativa de integraciones
          </button>

          {showMatrix && (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-3 text-left font-semibold text-slate-700">Integración</th>
                    {["Core", "Tienda", "ML", "Omnicanal", "Envíos", "Comunica", "Operación"].map((h) => (
                      <th key={h} className="p-3 text-center font-semibold text-slate-700 text-xs">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_INTEGRATIONS.map((integration) => (
                    <tr key={integration} className="border-b border-slate-100">
                      <td className="p-3 text-slate-700 font-medium">{integration}</td>
                      {(["core", "tienda-conectada", "marketplace-pro", "omnicanal", "envios-pro", "comunica", "operacion-completa"] as const).map(
                        (planId) => {
                          const included = COMPARISON_MATRIX[planId]?.[integration]
                          return (
                            <td key={planId} className="p-3 text-center">
                              {included ? (
                                <Check className="mx-auto h-4 w-4 text-emerald-600" />
                              ) : (
                                <Minus className="mx-auto h-4 w-4 text-slate-300" />
                              )}
                            </td>
                          )
                        },
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ScrollReveal>

        {/* À la carte */}
        <ScrollReveal>
          <button
            type="button"
            onClick={() => setShowAlaCarte((v) => !v)}
            className="mx-auto flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
          >
            {showAlaCarte ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showAlaCarte ? "Ocultar" : "Ver"} precios à la carte
          </button>

          {showAlaCarte && (
            <div className="mt-6">
              <p className="text-center text-xs text-slate-500 mb-6">
                Para quienes prefieren armar su plan. Precios más altos que los bundles — incentivamos paquetes.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ALA_CARTE.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"
                  >
                    <div>
                      <span className="text-sm font-medium text-slate-800">{item.name}</span>
                      <span
                        className={cn(
                          "ml-2 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                          item.tier === "A" && "bg-emerald-100 text-emerald-700",
                          item.tier === "B" && "bg-amber-100 text-amber-700",
                          item.tier === "C" && "bg-slate-200 text-slate-600",
                        )}
                      >
                        Tier {item.tier}
                      </span>
                      {item.note && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.note}</p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
                      {formatArs(item.priceMonthly)}/mes
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollReveal>

        {/* Trust + objections (full page only) */}
        {!compact && (
          <>
            <ScrollReveal>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {TRUST_MESSAGES.map((t) => (
                  <div key={t.title} className="rounded-2xl border border-slate-100 bg-blue-50/30 p-5">
                    <Shield className="h-5 w-5 text-blue-600 mb-2" />
                    <h4 className="text-sm font-bold text-slate-900">{t.title}</h4>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">{t.desc}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8">
                <div className="flex items-center gap-2 mb-6">
                  <HelpCircle className="h-5 w-5 text-slate-600" />
                  <h3 className="font-[var(--font-fraunces)] text-xl font-bold text-slate-900">
                    Objeciones frecuentes
                  </h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {OBJECTION_HANDLERS.map((o) => (
                    <div key={o.objection} className="rounded-xl bg-white border border-slate-100 p-4">
                      <p className="text-sm font-semibold text-slate-800">&ldquo;{o.objection}&rdquo;</p>
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">{o.response}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 text-center">
                <Star className="mx-auto h-8 w-8 text-blue-600 mb-4" />
                <h3 className="font-[var(--font-fraunces)] text-2xl font-bold text-slate-900">
                  ¿No sabés por dónde empezar?
                </h3>
                <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                  La mayoría de comercios arrancan con Core + el canal que ya usan.
                  En el mes 2, Omnicanal suele ser el upgrade natural.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-500" asChild>
                    <Link href="/login">
                      Probar demo gratis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/claver/claverp/conexiones">Ver integraciones Tier A</Link>
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          </>
        )}

        {compact && (
          <ScrollReveal className="text-center">
            <Button variant="outline" asChild>
              <Link href="/claver/claverp/precios">
                Ver planes completos y comparativa
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </ScrollReveal>
        )}
      </div>
    </section>
  )
}