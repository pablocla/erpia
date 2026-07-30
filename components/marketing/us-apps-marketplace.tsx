"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2, Globe2 } from "lucide-react"
import { ClaverShell } from "@/components/marketing/claver-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MotionFadeDown, MotionList, MotionListItem, ScrollReveal } from "@/components/ui/motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { activarRegisterHref } from "@/lib/comercial/activar-intent"
import {
  US_COLLECTIVES,
  US_SAAS_APPS,
  fmtPrecioUsd,
  usMarketplaceGroups,
  type UsCollectiveId,
  type UsSaasApp,
} from "@/lib/comercial/us-saas-catalog"

function UsAppCard({ app }: { app: UsSaasApp }) {
  const price = app.precioUsd === 0 ? "Free" : `${fmtPrecioUsd(app.precioUsd)}/mo`
  return (
    <Card className="flex h-full flex-col border-slate-200/80 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={
              app.estado === "disponible" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
            }
          >
            {app.estado === "disponible" ? "Live" : "Beta"}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Wave {app.wave}
          </Badge>
        </div>
        <p className="mt-2 text-sm font-medium text-emerald-700">{app.marca}</p>
        <CardTitle className="font-[var(--font-fraunces)] text-lg text-slate-900">
          {app.nombre}
        </CardTitle>
        <p className="text-sm text-slate-600">{app.lema}</p>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 text-sm">
        <p className="font-semibold text-slate-900">{price}</p>
        <p className="text-xs text-slate-500">{app.roiCopy}</p>
        <ul className="space-y-1">
          {app.outcomes.slice(0, 2).map((o) => (
            <li key={o} className="flex gap-2 text-xs text-slate-600">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              {o}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t border-slate-100 pt-4">
        {app.estado !== "proximamente" ? (
          <Button className="w-full bg-emerald-600 font-semibold hover:bg-emerald-500" asChild>
            <Link href={activarRegisterHref(app.slug)}>
              Start free trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button className="w-full" disabled>
            Coming soon
          </Button>
        )}
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/claver/apps/${app.slug}`}>Details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export function UsAppsMarketplace() {
  const groups = usMarketplaceGroups()
  const collectives = Object.keys(US_COLLECTIVES) as UsCollectiveId[]

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
              US catalog · English · Auto-activate
            </Badge>
            <h1 className="max-w-3xl font-[var(--font-fraunces)] text-3xl font-semibold leading-tight sm:text-4xl">
              Claver apps for the United States
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
              <strong className="text-white">{groups.activas.length} live apps</strong> mapped to the
              global Claver core — collections, bookings, POS, routes, and more. Same SKUs, English
              packaging, USD pricing.
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
              <li>{groups.activas.length} live</li>
              <li>{groups.beta.length} beta</li>
              <li>{US_SAAS_APPS.length} total</li>
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 bg-emerald-500 px-8 font-semibold text-slate-950 hover:bg-emerald-400"
                asChild
              >
                <Link href="#live">
                  See live apps
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-white/20 bg-white/5 px-8 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/?market=ar">Argentina catalog (ES)</Link>
              </Button>
            </div>
          </MotionFadeDown>
        </div>
      </section>

      <div className="bg-white py-14 text-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Tabs defaultValue="live" className="w-full">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div id="live" className="scroll-mt-24">
                <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold sm:text-3xl">
                  Apps
                </h2>
                <p className="mt-2 max-w-xl text-slate-600">
                  One pain → one product → 14-day trial → automation unlock.
                </p>
              </div>
              <TabsList className="h-auto w-full flex-wrap justify-start gap-1 border border-slate-200/80 bg-slate-100/80 p-1 sm:w-auto">
                <TabsTrigger
                  value="live"
                  className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                >
                  Live ({groups.activas.length})
                </TabsTrigger>
                <TabsTrigger
                  value="beta"
                  className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                >
                  Beta ({groups.beta.length})
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                >
                  All ({US_SAAS_APPS.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="live">
              <MotionList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups.activas.map((app) => (
                  <MotionListItem key={app.slug}>
                    <UsAppCard app={app} />
                  </MotionListItem>
                ))}
              </MotionList>
            </TabsContent>
            <TabsContent value="beta">
              <MotionList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups.beta.map((app) => (
                  <MotionListItem key={app.slug}>
                    <UsAppCard app={app} />
                  </MotionListItem>
                ))}
              </MotionList>
            </TabsContent>
            <TabsContent value="all">
              <MotionList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {US_SAAS_APPS.map((app) => (
                  <MotionListItem key={app.slug}>
                    <UsAppCard app={app} />
                  </MotionListItem>
                ))}
              </MotionList>
            </TabsContent>
          </Tabs>

          <div className="mt-16 space-y-12">
            {collectives.map((id) => {
              const c = US_COLLECTIVES[id]
              const apps = US_SAAS_APPS.filter((a) => a.collective === id)
              return (
                <section key={id}>
                  <ScrollReveal>
                    <h3 className="font-[var(--font-fraunces)] text-xl font-semibold">{c.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">{c.tagline}</p>
                  </ScrollReveal>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {apps.map((a) => (
                      <Button key={a.slug} variant="outline" size="sm" asChild>
                        <Link href={`/claver/apps/${a.slug}`}>{a.marca}</Link>
                      </Button>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </div>
    </ClaverShell>
  )
}
