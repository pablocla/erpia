"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2, Globe2, Zap } from "lucide-react"
import { ClaverShell } from "@/components/marketing/claver-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MotionFadeDown, MotionList, MotionListItem, ScrollReveal } from "@/components/ui/motion"
import { activarRegisterHref } from "@/lib/comercial/activar-intent"
import {
  US_COLLECTIVES,
  US_DESTACADOS,
  US_SAAS_APPS,
  fmtPrecioUsd,
  getUsSaasApp,
  type UsCollectiveId,
  type UsSaasApp,
} from "@/lib/comercial/us-saas-catalog"

function AppCard({ app }: { app: UsSaasApp }) {
  const price =
    app.precioUsd === 0 ? "Free forever" : `${fmtPrecioUsd(app.precioUsd)}/mo`
  return (
    <Card className="flex h-full flex-col border-slate-200/80 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <Badge
            className={
              app.estado === "disponible"
                ? "bg-emerald-600 text-white"
                : "bg-blue-600 text-white"
            }
          >
            {app.estado === "disponible" ? "Live" : "Beta"}
          </Badge>
          <span className="text-xs text-slate-500">Wave {app.wave}</span>
        </div>
        <p className="mt-2 text-sm font-medium text-emerald-700">{app.marca}</p>
        <CardTitle className="font-[var(--font-fraunces)] text-xl text-slate-900">
          {app.nombre}
        </CardTitle>
        <p className="text-sm text-slate-600">{app.lema}</p>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">{price}</p>
        <p className="text-xs text-slate-500">{app.roiCopy}</p>
        <ul className="mt-2 space-y-1">
          {app.outcomes.slice(0, 2).map((o) => (
            <li key={o} className="flex items-start gap-2 text-xs">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t border-slate-100 pt-4">
        <Button className="w-full bg-emerald-600 font-semibold hover:bg-emerald-500" asChild>
          <Link href={activarRegisterHref(app.slug)}>
            Start free trial
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/claver/apps/${app.slug}`}>View details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function CollectiveBlock({ id }: { id: UsCollectiveId }) {
  const c = US_COLLECTIVES[id]
  const list = US_SAAS_APPS.filter((a) => a.collective === id).slice(0, 3)
  if (list.length === 0) return null

  return (
    <section className="mb-14">
      <ScrollReveal>
        <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900">
          {c.name}
        </h2>
        <p className="mt-1 max-w-2xl text-slate-600">{c.tagline}</p>
      </ScrollReveal>
      <MotionList className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((app) => (
          <MotionListItem key={app.slug}>
            <AppCard app={app} />
          </MotionListItem>
        ))}
      </MotionList>
    </section>
  )
}

/**
 * US / English marketing home — reuses ClaverShell + same activation rails.
 */
export function UsMarketHub() {
  const destacadas = US_DESTACADOS.map((s) => getUsSaasApp(s)).filter(
    (a): a is UsSaasApp => !!a,
  )

  return (
    <ClaverShell context="matrix">
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-slate-950 via-[#0B1220] to-blue-950 pt-28 pb-16 text-white sm:pt-32 sm:pb-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.18),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <MotionFadeDown>
            <Badge className="mb-5 border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
              <Globe2 className="mr-1.5 h-3.5 w-3.5" />
              Claver · United States · Auto-activate
            </Badge>
            <h1 className="max-w-3xl font-[var(--font-fraunces)] text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
              Business apps that pay for themselves
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Collections, bookings, house tabs, memberships, and field sales.
              Instant trial, English UI, Stripe-ready pricing — built on the same
              Claver core used by operators across Latin America.
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                Activate in minutes
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Real day-one value
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                SMS + payment links
              </li>
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 bg-emerald-500 px-8 font-semibold text-slate-950 hover:bg-emerald-400"
                asChild
              >
                <Link href="/claver/apps">
                  Browse US apps
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-white/20 bg-white/5 px-8 text-white hover:bg-white/10"
                asChild
              >
                <Link href={activarRegisterHref("house-tab")}>
                  Start with House Tab — free
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Prefer Spanish / Argentina?{" "}
              <Link href="/?market=ar" className="underline hover:text-slate-300">
                Switch to AR market
              </Link>
            </p>
          </MotionFadeDown>
        </div>
      </section>

      <div className="bg-[#f8fafc] py-16 text-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ScrollReveal className="mb-10">
            <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold sm:text-3xl">
              Featured apps
            </h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              One problem, one product, one price. Same activation SKUs as the global core.
            </p>
          </ScrollReveal>

          <MotionList className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {destacadas.slice(0, 8).map((app) => (
              <MotionListItem key={app.slug}>
                <AppCard app={app} />
              </MotionListItem>
            ))}
          </MotionList>

          {(["get-paid", "book", "counter", "field"] as UsCollectiveId[]).map((id) => (
            <CollectiveBlock key={id} id={id} />
          ))}

          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h3 className="font-[var(--font-fraunces)] text-xl font-semibold">
              Full catalog
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
              Wave 1–4 products including B2B portal, fleet POD, clinic desk, and more.
            </p>
            <Button className="mt-6 bg-emerald-600 hover:bg-emerald-500" asChild>
              <Link href="/claver/apps">Open app marketplace</Link>
            </Button>
          </div>
        </div>
      </div>
    </ClaverShell>
  )
}
