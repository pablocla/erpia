"use client"

import Link from "next/link"
import { ArrowRight, Building2 } from "lucide-react"
import { ClaverShell } from "@/components/marketing/claver-shell"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { CLAVER_SERVICE_LINES } from "@/lib/marketing/claver-services-catalog"
import { CLAVER_GROUP, MARKETING_ROADMAP } from "@/lib/marketing/brand-system"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MotionFadeDown, ScrollReveal, MotionList, MotionListItem } from "@/components/ui/motion"
import { LogoShowcase } from "@/components/marketing/logo-showcase"

const STATUS_LABEL = {
  disponible: { text: "Disponible", className: "bg-emerald-600" },
  beta: { text: "Beta", className: "bg-blue-600" },
  proximamente: { text: "Próximamente", className: "bg-slate-600" },
}

export function ClaverMatrixHub() {
  return (
    <ClaverShell context="matrix">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 pt-28 pb-24 text-white sm:pt-32">
        <div className="pointer-events-none absolute -left-32 top-16 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <MotionFadeDown>
            <Badge className="mb-6 border-amber-500/30 bg-amber-500/10 text-amber-200">
              <Building2 className="mr-1.5 h-3.5 w-3.5" />
              Grupo {CLAVER_GROUP.name}
            </Badge>
            <div className="mb-8">
              <BrandLogo size="lg" theme="dark" variant="group-full" showByClaver={false} />
            </div>
            <h1 className="max-w-4xl font-[var(--font-fraunces)] text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              {CLAVER_GROUP.tagline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-400">{CLAVER_GROUP.descriptor}</p>
            <p className="mt-4 max-w-xl text-sm text-slate-500">
              Clavis es nuestro sistema ERP flagship. Pronto sumamos más líneas de cobros, logística,
              IA y consultoría bajo el mismo paraguas.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button size="lg" className="bg-amber-600 hover:bg-amber-500 text-slate-950" asChild>
                <Link href="/claver/claverp">
                  Conocer Clavis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                className="bg-violet-600 hover:bg-violet-500 text-white"
                asChild
              >
                <Link href="/claver-cloud">
                  Claver Cloud
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 hover:bg-white/10"
                asChild
              >
                <Link href="/claver/marca">Identidad del grupo</Link>
              </Button>
            </div>
          </MotionFadeDown>
          <LogoShowcase variant="matrix" />
        </div>
      </section>

      <section className="bg-[#f8fafc] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="text-center">
            <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900 sm:text-4xl">
              Líneas de negocio {CLAVER_GROUP.name}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-600">
              Un conglomerado de sistemas y servicios. Cada línea resuelve un problema; juntas cubren
              la operación entera.
            </p>
          </ScrollReveal>

          <MotionList className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CLAVER_SERVICE_LINES.map((line) => {
              const Icon = line.icon
              const status = STATUS_LABEL[line.status]
              const inner = (
                <Card
                  className={`group h-full transition hover:-translate-y-1 hover:shadow-lg ${
                    line.id === "claverp"
                      ? "ring-2 ring-blue-500/40 border-blue-200"
                      : line.id === "clavercloud"
                        ? "ring-2 ring-violet-500/40 border-violet-200"
                        : "border-slate-200/80"
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${line.gradient} text-white shadow-md`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge className={status.className}>{status.text}</Badge>
                    </div>
                    <CardTitle className="mt-4 font-[var(--font-fraunces)] text-xl">{line.name}</CardTitle>
                    <p className="text-sm font-medium text-blue-700">{line.tagline}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">{line.description}</p>
                    <ul className="mt-4 space-y-1">
                      {line.features.map((f) => (
                        <li key={f} className="text-xs text-slate-500">
                          → {f}
                        </li>
                      ))}
                    </ul>
                    {line.href && (
                      <span className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 group-hover:underline">
                        Explorar
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </span>
                    )}
                  </CardContent>
                </Card>
              )

              return (
                <MotionListItem key={line.id}>
                  {line.href ? (
                    <Link href={line.href} className="block h-full">
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

      <section className="bg-slate-950 px-4 py-20 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold">Roadmap del grupo</h2>
          </ScrollReveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {MARKETING_ROADMAP.map((phase) => (
              <ScrollReveal key={phase.phase}>
                <Card className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">{phase.phase}</CardTitle>
                    <Badge variant="outline" className="w-fit border-white/20 text-slate-300">
                      {phase.quarter}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm text-slate-400">
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
    </ClaverShell>
  )
}