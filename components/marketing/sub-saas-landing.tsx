"use client"

import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Monitor,
  Smartphone,
  XCircle,
} from "lucide-react"
import type { SubSaasApp } from "@/lib/comercial/sub-saas-catalog"
import { fmtPrecioArs, subSaasActivarHref } from "@/lib/comercial/sub-saas-catalog"
import { ClaverShell } from "@/components/marketing/claver-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ScrollReveal, MotionFadeDown } from "@/components/ui/motion"
import { cn } from "@/lib/utils"

const ESTADO_LABEL = {
  disponible: { text: "Disponible", className: "bg-emerald-600 text-white" },
  beta: { text: "Beta", className: "bg-blue-600 text-white" },
  proximamente: { text: "Próximamente", className: "bg-slate-500 text-white" },
} as const

const PLATAFORMA_LABEL = {
  celular: { icon: Smartphone, text: "Celular" },
  pc: { icon: Monitor, text: "PC" },
  ambos: { icon: Smartphone, text: "Celular + PC" },
} as const

interface SubSaasLandingProps {
  app: SubSaasApp
}

export function SubSaasLanding({ app }: SubSaasLandingProps) {
  const estado = ESTADO_LABEL[app.estado]
  const plataforma = PLATAFORMA_LABEL[app.plataforma]
  const PlataformaIcon = plataforma.icon
  const activarHref = subSaasActivarHref(app)
  const precioLabel =
    app.precioArs === 0 ? "Incluido con trial" : `${fmtPrecioArs(app.precioArs)}/mes`

  return (
    <ClaverShell context="matrix">
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-br from-slate-900 via-[#0B1220] to-blue-950 pt-28 pb-16 text-white sm:pt-32 sm:pb-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.25),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <MotionFadeDown>
            <Link
              href="/claver/apps"
              className="mb-4 inline-flex items-center text-sm text-white/60 hover:text-white"
            >
              Catálogo de apps
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={estado.className}>{estado.text}</Badge>
              <Badge className="border-white/20 bg-white/10 text-white">
                <PlataformaIcon className="mr-1.5 h-3.5 w-3.5" />
                {plataforma.text}
              </Badge>
              <Badge variant="outline" className="border-white/20 text-white/80">
                {app.listoPct}% listo
              </Badge>
            </div>
            <p className="mt-4 text-sm font-medium text-emerald-300">{app.marca}</p>
            <h1 className="mt-2 max-w-3xl font-[var(--font-fraunces)] text-4xl font-semibold leading-tight sm:text-5xl">
              {app.nombre}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-300">{app.lema}</p>
            <p className="mt-3 max-w-2xl text-slate-400">{app.descripcion}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {app.estado !== "proximamente" ? (
                <Button
                  size="lg"
                  className="h-12 bg-emerald-500 px-8 font-semibold text-slate-950 hover:bg-emerald-400"
                  asChild
                >
                  <Link href={activarHref}>
                    Probar {app.trialDias} días gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="h-12" disabled>
                  Próximamente
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-white/25 bg-white/5 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/claver/contacto">Hablar con ventas</Link>
              </Button>
            </div>

            <p className="mt-6 text-sm text-slate-400">
              <span className="font-semibold text-white">{precioLabel}</span>
              {app.sku && (
                <span className="ml-2 text-slate-500">· SKU {app.sku}</span>
              )}
            </p>
          </MotionFadeDown>
        </div>
      </section>

      <section className="border-b border-slate-200/80 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ScrollReveal>
            <p className="text-center text-sm font-medium uppercase tracking-wide text-emerald-700">
              Hook para redes
            </p>
            <p className="mt-2 text-center font-[var(--font-fraunces)] text-2xl text-slate-900 sm:text-3xl">
              &ldquo;{app.reelHook}&rdquo;
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {app.rubros.map((rubro) => (
                <Badge key={rubro} variant="secondary" className="text-xs">
                  {rubro}
                </Badge>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="border-b border-slate-200/80 bg-[#f8fafc] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <ScrollReveal>
              <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900">
                El dolor de hoy
              </h2>
              <ul className="mt-6 space-y-3">
                {app.pains.map((pain) => (
                  <li
                    key={pain}
                    className="flex gap-3 rounded-xl border border-red-100 bg-red-50/80 p-4 text-slate-700"
                  >
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden />
                    {pain}
                  </li>
                ))}
              </ul>
            </ScrollReveal>
            <ScrollReveal>
              <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900">
                Lo que ganás
              </h2>
              <ul className="mt-6 space-y-3">
                {app.outcomes.map((outcome) => (
                  <li
                    key={outcome}
                    className="flex gap-3 rounded-xl border border-emerald-100 bg-white p-4 text-slate-700 shadow-sm"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                    {outcome}
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200/80 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ScrollReveal>
            <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900">
              Activación en minutos
            </h2>
            <p className="mt-2 text-slate-600">
              Mismo motor del ERP. Menú reducido con modo{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">{app.modoLite}</code>.
            </p>
          </ScrollReveal>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
            {app.pasosActivacion.map((paso, i) => (
              <li
                key={paso}
                className="flex gap-4 rounded-xl border border-slate-200/80 bg-slate-50 p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-slate-700">{paso}</span>
              </li>
            ))}
          </ol>
          {app.publicPath && (
            <p className="mt-6 text-sm text-slate-500">
              Vista cliente:{" "}
              <code className="rounded bg-slate-100 px-2 py-1">{app.publicPath}</code>
              {app.publicPathLabel ? ` — ${app.publicPathLabel}` : ""}
            </p>
          )}
        </div>
      </section>

      <section className="border-b border-slate-200/80 bg-[#f8fafc] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-slate-200/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-slate-600">Impacto comercial</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-[var(--font-fraunces)] text-4xl font-semibold text-slate-900">
                  {app.impactoScore}/10
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-slate-600">Potencial en redes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-[var(--font-fraunces)] text-4xl font-semibold text-slate-900">
                  {app.redesScore}/10
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-slate-600">Panel del dueño</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={app.dashboardPath}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {app.dashboardPath}
                </Link>
              </CardContent>
            </Card>
          </div>

          <Collapsible className="mt-8">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Ver procesos reciclados (para implementación)
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Procesos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-inside list-disc text-sm text-slate-600">
                    {app.procesosReciclados.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Archivos backend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 font-mono text-xs text-slate-600">
                    {app.serviciosBackend.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </section>

      {app.upsellSkus && app.upsellSkus.length > 0 && (
        <section className="bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
            <p className="text-sm text-slate-500">Después podés sumar</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {app.upsellSkus.map((sku) => (
                <Badge key={sku} variant="outline">
                  {sku}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      )}

      <section
        className={cn(
          "bg-gradient-to-br from-slate-950 via-[#0B1220] to-blue-950 px-4 py-16 text-white sm:px-6",
        )}
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold">
            Probá {app.marca} esta semana
          </h2>
          <p className="mt-3 text-slate-400">
            {app.trialDias} días gratis · {precioLabel}
          </p>
          {app.estado !== "proximamente" && (
            <Button
              size="lg"
              className="mt-6 h-12 bg-emerald-500 px-8 font-semibold text-slate-950 hover:bg-emerald-400"
              asChild
            >
              <Link href={activarHref}>
                Activar ahora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </section>
    </ClaverShell>
  )
}