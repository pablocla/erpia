"use client"

import Link from "next/link"
import { ArrowRight, Sprout, Cpu, ShieldCheck, MapPin, Truck, BarChart3 } from "lucide-react"
import { ClaverShell } from "@/components/marketing/claver-shell"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { CLAVERGROW_PRODUCT, CLAVER_GROUP } from "@/lib/marketing/brand-system"
import {
  CLAVERGROW_PACKS,
  CLAVERGROW_RUBROS,
  CLAVERGROW_FEATURES,
} from "@/lib/marketing/clavergrow-catalog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MotionFadeDown, ScrollReveal, MotionList, MotionListItem } from "@/components/ui/motion"
import { LogoShowcase } from "@/components/marketing/logo-showcase"

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
})

export function ClavergrowProductHub() {
  return (
    <ClaverShell context="clavergrow">
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-green-950 to-slate-950 pt-28 pb-24 text-white sm:pt-32">
        <div className="pointer-events-none absolute -right-32 top-16 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <MotionFadeDown>
            <Link
              href="/claver"
              className="mb-6 inline-flex items-center text-sm text-slate-400 hover:text-white"
            >
              ← Grupo {CLAVER_GROUP.name}
            </Link>
            <div className="mb-6">
              <BrandLogo size="lg" theme="dark" variant="clavergrow-full" />
            </div>
            <Badge className="mb-4 border-emerald-400/30 bg-emerald-500/15 text-emerald-200">
              Línea agro · Producción end-to-end
            </Badge>
            <h1 className="max-w-4xl font-[var(--font-fraunces)] text-4xl font-semibold leading-tight sm:text-5xl">
              {CLAVERGROW_PRODUCT.tagline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-400">{CLAVERGROW_PRODUCT.descriptor}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500" asChild>
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
                <Link href="#packs">Ver packs</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-amber-400/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-100"
                asChild
              >
                <Link href="/claver/claverp">¿Comercio de calle? Claver</Link>
              </Button>
            </div>
          </MotionFadeDown>
          <LogoShowcase variant="clavergrow" />
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: "Lote → Cosecha", label: "Trazabilidad completa", icon: Sprout },
              { value: "IoT", label: "Sensores y riego", icon: Cpu },
              { value: "Acopio", label: "Balanza y CPE", icon: Truck },
              { value: "B2B", label: "Pizarra y liquidaciones", icon: BarChart3 },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                    <Icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="font-[var(--font-fraunces)] text-2xl font-bold text-slate-900">{stat.value}</div>
                  <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="packs" className="bg-[#f8fafc] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="text-center">
            <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900">
              Packs {CLAVERGROW_PRODUCT.name}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-600">
              Activá solo lo que necesitás: campo, acopio, comercio o cultivo regulado.
            </p>
          </ScrollReveal>

          <MotionList className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CLAVERGROW_PACKS.map((pack) => {
              const Icon = pack.icon
              return (
                <MotionListItem key={pack.id}>
                  <Card
                    className={`h-full transition hover:-translate-y-1 hover:shadow-lg ${
                      pack.highlighted ? "ring-2 ring-emerald-500/40 border-emerald-200" : "border-slate-200/80"
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${pack.gradient} text-white shadow-md`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        {pack.badge && (
                          <Badge className="bg-emerald-600">{pack.badge}</Badge>
                        )}
                      </div>
                      <CardTitle className="mt-4 font-[var(--font-fraunces)] text-xl">{pack.name}</CardTitle>
                      <p className="text-sm font-medium text-emerald-700">{pack.tagline}</p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600">{pack.description}</p>
                      <ul className="mt-4 space-y-1">
                        {pack.features.map((f) => (
                          <li key={f} className="text-xs text-slate-500">
                            → {f}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-4 font-semibold text-slate-900">
                        {currency.format(pack.priceMonthly)}
                        <span className="text-sm font-normal text-slate-500"> /mes + IVA</span>
                      </p>
                    </CardContent>
                  </Card>
                </MotionListItem>
              )
            })}
          </MotionList>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="text-center">
            <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900">
              Rubros y combinaciones
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-600">
              Onboarding por tipo de operación agrícola.
            </p>
          </ScrollReveal>

          <MotionList className="mt-14 grid gap-6 md:grid-cols-3">
            {CLAVERGROW_RUBROS.map((rubro) => (
              <MotionListItem key={rubro.id}>
                <Card className="h-full border-slate-200/80">
                  <CardHeader>
                    <CardTitle className="font-[var(--font-fraunces)] text-lg">{rubro.name}</CardTitle>
                    <p className="text-sm text-slate-600">{rubro.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {rubro.packs.map((packId) => {
                        const pack = CLAVERGROW_PACKS.find((p) => p.id === packId)
                        return pack ? (
                          <Badge key={packId} variant="outline" className="border-emerald-200 text-emerald-800">
                            {pack.name.replace("Clavergrow ", "")}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </CardContent>
                </Card>
              </MotionListItem>
            ))}
          </MotionList>
        </div>
      </section>

      <section className="bg-emerald-950 px-4 py-20 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="text-center">
            <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold">
              Todo el circuito agro en un solo sistema
            </h2>
          </ScrollReveal>
          <MotionList className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CLAVERGROW_FEATURES.map((feature) => (
              <MotionListItem key={feature}>
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="text-sm text-slate-300">{feature}</span>
                </div>
              </MotionListItem>
            ))}
          </MotionList>
          <div className="mt-14 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500" asChild>
              <Link href="/login">
                Empezar con Clavergrow
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/5 hover:bg-white/10"
              asChild
            >
              <Link href="/claver-cloud">Hablar con implementación</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-emerald-600" />
          <h3 className="mt-4 font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900">
            Cultivo regulado
          </h3>
          <p className="mt-3 text-slate-600">
            El pack <strong>Cultivo regulado</strong> incluye trazabilidad REPROCANN, ciclos, insumos y auditoría —
            sin exponer nomenclatura sensible en materiales públicos. Disponible bajo onboarding dedicado.
          </p>
          <Button className="mt-6" variant="outline" asChild>
            <Link href="/claver-cloud">Solicitar implementación</Link>
          </Button>
        </div>
      </section>
    </ClaverShell>
  )
}