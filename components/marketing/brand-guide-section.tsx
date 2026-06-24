"use client"

import { ClaverIcon, ClavERPIcon, BrandLogo } from "@/components/marketing/brand-logo"
import {
  BRAND_COLORS,
  BRAND_TYPOGRAPHY,
  CLAVER_GROUP,
  CLAVERP_PRODUCT,
  LOGO_SPEC,
  MARKETING_ROADMAP,
} from "@/lib/marketing/brand-system"
import { CLAVER_SERVICE_LINES } from "@/lib/marketing/claver-services-catalog"
import { BRAND_ASSETS } from "@/lib/brand"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollReveal } from "@/components/ui/motion"

export function BrandGuideSection() {
  return (
    <section className="bg-white px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-20">
        {/* Arquitectura de marca */}
        <ScrollReveal>
          <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900">
            Arquitectura de marca — Grupo + producto
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card className="ring-2 ring-slate-300">
              <CardHeader>
                <CardTitle className="text-xl">Matriz — {CLAVER_GROUP.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{CLAVER_GROUP.tagline}</p>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                <p>{CLAVER_GROUP.descriptor}</p>
                <p className="mt-4">Vende sistemas y servicios. Hub en <code>/claver</code>.</p>
              </CardContent>
            </Card>
            <Card className="ring-2 ring-blue-500">
              <CardHeader>
                <CardTitle className="text-xl">Producto — {CLAVERP_PRODUCT.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{CLAVERP_PRODUCT.tagline}</p>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                <p>{CLAVERP_PRODUCT.descriptor}</p>
                <p className="mt-4">Landings en <code>/claver/claverp</code>.</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CLAVER_SERVICE_LINES.map((line) => (
              <div key={line.id} className="rounded-xl border bg-slate-50 p-4 text-sm">
                <p className="font-semibold">{line.name}</p>
                <p className="text-slate-600">{line.tagline}</p>
                <Badge className="mt-2" variant="secondary">{line.status}</Badge>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Colorimetría */}
        <ScrollReveal>
          <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900">
            Colorimetría funcional internacional
          </h2>
          <p className="mt-2 text-slate-600">
            Azul = confianza SaaS global · Ámbar = energía LATAM · Rojo solo fiscal AFIP
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Primario", hex: BRAND_COLORS.primary.DEFAULT, uso: "CTA, links, isotipo" },
              { name: "Acento", hex: BRAND_COLORS.accent.DEFAULT, uso: "Highlights, nodos logo" },
              { name: "Éxito", hex: BRAND_COLORS.success.DEFAULT, uso: "Stock, KPIs OK" },
              { name: "Fiscal", hex: BRAND_COLORS.fiscal.DEFAULT, uso: "Solo sección AFIP" },
            ].map((c) => (
              <div key={c.name} className="overflow-hidden rounded-2xl border shadow-sm">
                <div className="h-24" style={{ backgroundColor: c.hex }} />
                <div className="p-4">
                  <p className="font-semibold">{c.name}</p>
                  <p className="font-mono text-xs text-slate-500">{c.hex}</p>
                  <p className="mt-1 text-xs text-slate-600">{c.uso}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Tipografía: {BRAND_TYPOGRAPHY.display} (display) + {BRAND_TYPOGRAPHY.body} (UI)
          </p>
        </ScrollReveal>

        {/* Logo spec */}
        <ScrollReveal>
          <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900">
            Logo funcional — especificación
          </h2>
          <p className="mt-2 max-w-2xl text-slate-600">{LOGO_SPEC.group.description}</p>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">{LOGO_SPEC.product.description}</p>
          <div className="mt-10 flex flex-wrap items-end gap-12">
            <div className="text-center">
              <ClaverIcon size={32} theme="light" className="mx-auto" />
              <p className="mt-2 text-xs text-slate-500">{CLAVER_GROUP.name}</p>
            </div>
            <div className="text-center">
              <ClavERPIcon size={32} theme="light" className="mx-auto" />
              <p className="mt-2 text-xs text-slate-500">{CLAVERP_PRODUCT.name}</p>
            </div>
            <div className="text-center">
              <BrandLogo size="lg" theme="light" variant="group-full" />
            </div>
            <div className="text-center">
              <BrandLogo size="lg" theme="light" variant="claverp-full" />
            </div>
            <div className="rounded-2xl bg-slate-950 p-6">
              <BrandLogo size="md" theme="dark" variant="claverp-full" />
            </div>
          </div>
          <ul className="mt-8 list-inside list-disc text-sm text-slate-600">
            {LOGO_SPEC.donts.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { src: BRAND_ASSETS.claverIcon, label: "Claver icon" },
              { src: BRAND_ASSETS.claverpIcon, label: "Clavis icon" },
              { src: BRAND_ASSETS.claverpLockup, label: "Lockup" },
            ].map((asset) => (
              <div key={asset.src} className="rounded-xl border bg-slate-50 p-4 text-center">
                <Image src={asset.src} alt="" width={64} height={64} className="mx-auto" unoptimized />
                <p className="mt-2 font-mono text-[10px] text-slate-500">{asset.src}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Roadmap marketing */}
        <ScrollReveal>
          <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900">
            Roadmap del departamento de Marketing
          </h2>
          <div className="mt-8 space-y-4">
            {MARKETING_ROADMAP.map((phase) => (
              <Card key={phase.phase}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">{phase.phase}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">{phase.quarter}</Badge>
                    <Badge
                      variant={phase.status === "en_curso" ? "default" : "secondary"}
                    >
                      {phase.status === "en_curso" ? "En curso" : "Pendiente"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-slate-600">
                    {phase.items.map((item) => (
                      <li key={item}>→ {item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}