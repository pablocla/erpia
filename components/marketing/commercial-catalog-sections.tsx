"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2, Layers, Package } from "lucide-react"
import {
  CATALOGO_RESUMEN,
  fmtPrecioArs,
  hrefPublicoLinea,
  lineasPorTier,
  PACKS_DESTACADOS,
  PACKS_HOME_STRIP,
  PLATAFORMAS_PRINCIPALES,
  PRODUCTOS_ENTRADA,
  totalSolucionesPublicadas,
} from "@/lib/comercial/commercial-packaging"
import { activarRegisterHref } from "@/lib/comercial/activar-intent"
import {
  SUB_SAAS_APPS,
  isSubSaasFuncionalActiva,
  sortSubSaasForMarketplace,
  subSaasDestacadas,
  subSaasLandingHref,
  subSaasMarketplaceGroups,
  type SubSaasApp,
} from "@/lib/comercial/sub-saas-catalog"
import {
  COMBATE_APPS,
  COMBATE_APPS_SLUGS,
  GTM_VITRINE_COPY,
  HOME_COMBATE_SLUGS,
  homeCombateApps,
  type HomeDolorSlug,
} from "@/lib/comercial/go-to-market-vitrine"
import { isSkuProvisionable } from "@/lib/marketplace/sku-availability"
import type { ClaverServiceLine } from "@/lib/marketing/claver-services-catalog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { MotionList, MotionListItem, ScrollReveal } from "@/components/ui/motion"
import { cn } from "@/lib/utils"

const STATUS_LABEL = {
  disponible: { text: "Disponible", className: "bg-emerald-600 text-white" },
  beta: { text: "Beta", className: "bg-blue-600 text-white" },
  proximamente: { text: "Próximamente", className: "bg-slate-500 text-white" },
} as const

function tipoCobroLabel(tipo: string): string {
  if (tipo === "one_shot") return "pago único"
  if (tipo === "mixto") return "mensual + setup"
  return "/ mes"
}

const SUB_SAAS_STATUS = {
  disponible: { text: "Disponible", className: "bg-emerald-600 text-white" },
  beta: { text: "Beta", className: "bg-blue-600 text-white" },
  proximamente: { text: "Próximamente", className: "bg-slate-500 text-white" },
} as const

/**
 * Tres productos destacados en home: precio claro + CTA + landing.
 * Resalta el producto activo del hero.
 */
export function CombateHomeSection({
  className,
  highlightSlug,
}: {
  className?: string
  highlightSlug?: HomeDolorSlug
}) {
  const apps = homeCombateApps()

  return (
    <section
      id={GTM_VITRINE_COPY.combateHeadingId}
      aria-labelledby="combate-heading"
      className={cn("scroll-mt-24 border-b border-slate-200/80 bg-white px-4 py-14 sm:px-6", className)}
    >
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <h2
            id="combate-heading"
            className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900 sm:text-3xl"
          >
            {GTM_VITRINE_COPY.combateTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-slate-600">{GTM_VITRINE_COPY.combateSubtitle}</p>
        </ScrollReveal>

        <MotionList className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => {
            const highlighted = highlightSlug === app.slug
            const registerHref = activarRegisterHref(app.slug)
            const isFree = app.precioArs === 0
            return (
              <MotionListItem key={app.slug}>
                <Card
                  className={cn(
                    "flex h-full flex-col bg-white text-slate-900 transition",
                    highlighted
                      ? "border-emerald-400/80 bg-emerald-50/40 shadow-md ring-1 ring-emerald-200"
                      : "border-slate-200/80 hover:border-emerald-200 hover:shadow-md",
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-blue-700">{app.marca}</p>
                      <div className="flex shrink-0 flex-wrap justify-end gap-1">
                        {isFree && (
                          <Badge className="bg-emerald-600 text-[10px] text-white">
                            {GTM_VITRINE_COPY.badgeGratis}
                          </Badge>
                        )}
                        {!isFree && (
                          <Badge variant="secondary" className="text-[10px]">
                            {GTM_VITRINE_COPY.badgeTrial}
                          </Badge>
                        )}
                        {highlighted && (
                          <Badge className="bg-slate-900 text-[10px] text-white">
                            {GTM_VITRINE_COPY.badgeElegido}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="font-[var(--font-fraunces)] text-xl text-slate-900">
                      {app.nombre}
                    </CardTitle>
                    <p className="text-sm text-slate-600 leading-relaxed">{app.lema}</p>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-3xl font-bold text-slate-900">
                      {isFree ? "Gratis" : fmtPrecioArs(app.precioArs)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {isFree
                        ? "para siempre · sin tarjeta"
                        : `/ mes · ${app.trialDias} días de prueba`}
                    </p>
                    {app.outcomes[0] && (
                      <p className="mt-3 text-sm font-medium text-emerald-800">
                        ✓ {app.outcomes[0]}
                      </p>
                    )}
                    {app.outcomes[1] && (
                      <p className="mt-1 text-xs text-slate-500">✓ {app.outcomes[1]}</p>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2 sm:flex-row">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-500" asChild>
                      <Link href={registerHref}>
                        {isFree ? "Empezar gratis" : GTM_VITRINE_COPY.ctaProbar}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={subSaasLandingHref(app.slug)}>Ver detalle</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </MotionListItem>
            )
          })}
        </MotionList>
      </div>
    </section>
  )
}

/** 4 packs con precio en home (fuera del colapsable). */
export function PacksHomeStripSection({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="packs-home-heading"
      className={cn("border-t border-slate-200/80 bg-white px-4 py-14 sm:px-6", className)}
    >
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="packs-home-heading"
              className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900 sm:text-3xl"
            >
              {GTM_VITRINE_COPY.packsHomeTitle}
            </h2>
            <p className="mt-2 max-w-xl text-slate-600">{GTM_VITRINE_COPY.packsHomeSubtitle}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/claver/apps#packs">
              Ver todos los packs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </ScrollReveal>

        <MotionList className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PACKS_HOME_STRIP.map((pack) => (
            <MotionListItem key={pack.id}>
              <Card className="flex h-full flex-col border-slate-200/80 bg-white text-slate-900 transition hover:border-emerald-200 hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug text-slate-900">{pack.nombre}</CardTitle>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {pack.cantidadSkus} mod.
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{pack.lema}</p>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-2xl font-bold text-slate-900">{fmtPrecioArs(pack.precioArs)}</p>
                  <p className="text-xs text-slate-500">
                    {tipoCobroLabel(pack.tipoCobro)}
                    {pack.ahorroPct > 0 ? ` · ahorrás ${pack.ahorroPct}%` : ""}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">Trial 14 días · sin tarjeta</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-500" asChild>
                    <Link href={activarRegisterHref(pack.id)}>
                      {GTM_VITRINE_COPY.ctaProbar}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </MotionListItem>
          ))}
        </MotionList>
      </div>
    </section>
  )
}

function SubSaasAppCard({
  app,
  featured = false,
}: {
  app: SubSaasApp
  featured?: boolean
}) {
  const status = SUB_SAAS_STATUS[app.estado]
  const provisionable = isSkuProvisionable(app.sku)
  const isHome = (HOME_COMBATE_SLUGS as readonly string[]).includes(app.slug)
  const isCombate = (COMBATE_APPS_SLUGS as readonly string[]).includes(app.slug)
  const activa = isSubSaasFuncionalActiva(app) && provisionable

  return (
    <Card
      className={cn(
        "flex h-full flex-col border-slate-200/80 bg-white text-slate-900 transition hover:border-emerald-200 hover:shadow-md",
        featured && "border-emerald-300/80 ring-1 ring-emerald-100",
        !activa && app.estado === "beta" && "opacity-95",
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-medium text-emerald-700">{app.marca}</p>
          <div className="flex flex-wrap gap-1">
            {isHome && (
              <Badge className="shrink-0 bg-emerald-600 text-[10px] text-white">Destacada</Badge>
            )}
            {isCombate && !isHome && (
              <Badge variant="outline" className="shrink-0 border-emerald-200 text-[10px] text-emerald-800">
                Combate
              </Badge>
            )}
            <Badge className={cn("shrink-0 text-[10px]", status.className)}>{status.text}</Badge>
          </div>
        </div>
        <CardTitle className="font-[var(--font-fraunces)] text-lg font-semibold text-slate-900">{app.nombre}</CardTitle>
        <p className="text-sm text-slate-600 leading-relaxed">{app.lema}</p>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-2xl font-bold text-slate-900">
          {app.precioArs === 0 ? (app.estado === "disponible" ? "Gratis" : "Incluido") : fmtPrecioArs(app.precioArs)}
        </p>
        <p className="text-xs text-slate-500">
          {app.precioArs === 0
            ? app.sku === "pos.fiado_barrio"
              ? "ancla permanente · trial POS 14 días"
              : "con trial"
            : `/ mes · trial ${app.trialDias} días`}
          {app.listoPct < 100 ? ` · ${app.listoPct}% listo` : ""}
        </p>
        {app.outcomes[0] && <p className="mt-3 text-xs text-slate-500">→ {app.outcomes[0]}</p>}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t border-slate-100 bg-[#f8fafc]/50 pt-4">
        {provisionable && app.estado !== "proximamente" ? (
          <Button className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-500" asChild>
            <Link href={activarRegisterHref(app.slug)}>
              Probar gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button className="w-full" variant="secondary" disabled>
            Próximamente
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full border-slate-200 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50"
          asChild
        >
          <Link href={subSaasLandingHref(app.slug)}>Ver landing</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export function SubSaasAppsSection({
  className,
  destacadasOnly = false,
  combateOnly = false,
  activasOnly = false,
  betaOnly = false,
  hideCatalogLink = false,
  hideHeader = false,
}: {
  className?: string
  destacadasOnly?: boolean
  combateOnly?: boolean
  /** Solo apps funcionalmente listas (estado disponible + listoPct). */
  activasOnly?: boolean
  betaOnly?: boolean
  hideCatalogLink?: boolean
  hideHeader?: boolean
}) {
  let apps: SubSaasApp[]
  if (combateOnly) {
    apps = sortSubSaasForMarketplace(COMBATE_APPS)
  } else if (destacadasOnly) {
    apps = subSaasDestacadas()
  } else if (activasOnly) {
    apps = subSaasMarketplaceGroups().activas
  } else if (betaOnly) {
    apps = subSaasMarketplaceGroups().beta
  } else {
    apps = sortSubSaasForMarketplace(SUB_SAAS_APPS)
  }

  const title = combateOnly
    ? GTM_VITRINE_COPY.combateTitle
    : activasOnly
      ? "Apps activas y listas"
      : betaOnly
        ? "En beta"
        : "Todas las apps"

  const subtitle = combateOnly
    ? GTM_VITRINE_COPY.combateSubtitle
    : activasOnly
      ? "Mismas que podés activar y usar hoy — orden comercial (Fiado, Cobrá, Turnos primero)."
      : betaOnly
        ? "Funcionalidad parcial. Ideal para probar, no para operación crítica."
        : "Catálogo completo ordenado: activas primero, después beta."

  return (
    <section aria-labelledby="subsaas-heading" className={cn("px-4 sm:px-6", className)}>
      <div className="mx-auto max-w-7xl">
        {!hideHeader && (
          <ScrollReveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="subsaas-heading"
                className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900 sm:text-3xl"
              >
                {title}
              </h2>
              <p className="mt-2 max-w-xl text-slate-600">{subtitle}</p>
            </div>
            {!hideCatalogLink && (
              <Button
                variant="outline"
                className="border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/40"
                asChild
              >
                <Link href="/claver/apps#activas">
                  Ver las {subSaasMarketplaceGroups().activas.length} activas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </ScrollReveal>
        )}

        <MotionList className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", !hideHeader && "mt-8")}>
          {apps.map((app) => (
            <MotionListItem key={app.slug}>
              <SubSaasAppCard
                app={app}
                featured={(HOME_COMBATE_SLUGS as readonly string[]).includes(app.slug)}
              />
            </MotionListItem>
          ))}
        </MotionList>
      </div>
    </section>
  )
}

export function ProductosEntradaSection({ className }: { className?: string }) {
  return (
    <section aria-labelledby="entrada-heading" className={cn("px-4 sm:px-6", className)}>
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <h2
            id="entrada-heading"
            className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900 sm:text-3xl"
          >
            Empezá con un solo problema
          </h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Activá un producto chico, probalo 14 días y sumá módulos cuando el negocio lo pida.
          </p>
        </ScrollReveal>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PRODUCTOS_ENTRADA.map((p) => (
            <Card key={p.sku} className="flex h-full flex-col border-slate-200/80 bg-white text-slate-900 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="font-[var(--font-fraunces)] text-xl font-semibold text-slate-900">{p.nombre}</CardTitle>
                <p className="text-sm text-slate-600">{p.lema}</p>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-3xl font-bold text-slate-900">{fmtPrecioArs(p.precioArs)}</p>
                <p className="text-sm text-slate-500">/ mes · trial {p.trialDias} días</p>
              </CardContent>
              <CardFooter>
                {p.disponible ? (
                  <Button className="w-full bg-emerald-600 font-semibold hover:bg-emerald-500" asChild>
                    <Link href={p.href}>
                      Probar gratis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full" variant="secondary" disabled>
                    Próximamente
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export function PacksRubroSection({ className }: { className?: string }) {
  return (
    <section aria-labelledby="packs-heading" className={cn("px-4 sm:px-6", className)}>
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="packs-heading"
              className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900 sm:text-3xl"
            >
              Packs por rubro
            </h2>
            <p className="mt-2 max-w-xl text-slate-600">
              Combinaciones listas para almacén, consorcios, deportes, kiosco y más.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/claver/apps#packs">Ver todos los packs</Link>
          </Button>
        </ScrollReveal>

        <MotionList className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PACKS_DESTACADOS.map((pack) => (
            <MotionListItem key={pack.id}>
              <Card className="h-full border-slate-200/80 bg-white text-slate-900 transition hover:border-emerald-200 hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg font-semibold text-slate-900">{pack.nombre}</CardTitle>
                    <Badge variant="outline" className="shrink-0 text-[10px] text-slate-700">
                      {pack.cantidadSkus} módulos
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{pack.lema}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-slate-900">{fmtPrecioArs(pack.precioArs)}</p>
                  <p className="text-xs text-slate-500">
                    {tipoCobroLabel(pack.tipoCobro)}
                    {pack.ahorroPct > 0 ? ` · −${pack.ahorroPct}% vs sueltos` : ""}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={pack.href}>Activar pack</Link>
                  </Button>
                </CardFooter>
              </Card>
            </MotionListItem>
          ))}
        </MotionList>
      </div>
    </section>
  )
}

function LineaCard({ line, compact }: { line: ClaverServiceLine; compact?: boolean }) {
  const Icon = line.icon
  const status = STATUS_LABEL[line.status]
  const href = hrefPublicoLinea(line)
  const activo = line.status !== "proximamente" && !!href

  const inner = (
    <Card className={cn("h-full bg-white text-slate-900", compact ? "border-slate-200/80" : "border-slate-200/80 shadow-sm")}>
      <CardHeader className={compact ? "pb-2" : undefined}>
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              "flex items-center justify-center rounded-xl bg-gradient-to-br text-white",
              compact ? "h-10 w-10" : "h-12 w-12",
              line.gradient,
            )}
          >
            <Icon className={compact ? "h-5 w-5" : "h-6 w-6"} aria-hidden />
          </div>
          <Badge className={status.className}>{status.text}</Badge>
        </div>
        <CardTitle className={cn("font-[var(--font-fraunces)] font-semibold text-slate-900", compact ? "text-lg" : "text-xl")}>
          {line.name}
        </CardTitle>
        <p className="text-sm font-medium text-blue-700">{line.tagline}</p>
      </CardHeader>
      {!compact && (
        <CardContent>
          <p className="text-sm text-slate-600 leading-relaxed">{line.description}</p>
          <ul className="mt-3 space-y-1">
            {line.features.slice(0, 3).map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-slate-500">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
      )}
      {href && (
        <CardFooter className={compact ? "pt-0" : undefined}>
          <span className="inline-flex items-center text-sm font-medium text-blue-600">
            Ver más
            <ArrowRight className="ml-1 h-4 w-4" />
          </span>
        </CardFooter>
      )}
    </Card>
  )

  if (activo && href) {
    return (
      <Link href={href} className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        {inner}
      </Link>
    )
  }
  return inner
}

export function PlataformasSection({ className }: { className?: string }) {
  const tiers = lineasPorTier()

  return (
    <section aria-labelledby="plataformas-heading" className={cn("px-4 sm:px-6", className)}>
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <h2
            id="plataformas-heading"
            className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900 sm:text-3xl"
          >
            Plataformas
          </h2>
          <p className="mt-2 max-w-xl text-slate-600">
            ERP completo, agro y operación cloud. Todo corre sobre la misma base multi-tenant.
          </p>
        </ScrollReveal>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PLATAFORMAS_PRINCIPALES.map((line) => (
            <LineaCard key={line.id} line={line} />
          ))}
        </div>

        <Collapsible className="mt-8">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between border border-slate-200 bg-slate-50">
              <span className="flex items-center gap-2 text-slate-700">
                <Layers className="h-4 w-4" />
                Ver {tiers.servicio.length + tiers.proximamente.length} líneas y servicios adicionales
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...tiers.servicio, ...tiers.proximamente].map((line) => (
              <LineaCard key={line.id} line={line} compact />
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </section>
  )
}

export function CatalogoCompletoBanner({ className }: { className?: string }) {
  const total = totalSolucionesPublicadas()

  return (
    <section aria-labelledby="catalogo-heading" className={cn("px-4 sm:px-6", className)}>
      <div className="mx-auto max-w-7xl">
        <Card className="overflow-hidden border-slate-200 bg-gradient-to-br from-slate-900 to-blue-950 text-white">
          <CardContent className="p-8 sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Badge className="mb-4 border-white/20 bg-white/10 text-white">
                  <Package className="mr-1.5 h-3.5 w-3.5" />
                  Catálogo completo
                </Badge>
                <h2 id="catalogo-heading" className="font-[var(--font-fraunces)] text-2xl font-semibold sm:text-3xl">
                  Más de {total} soluciones activables
                </h2>
                <p className="mt-3 max-w-xl text-slate-300">
                  Automatizaciones, servicios con IA, apps de nicho, packs y módulos ERP. Activás solo lo que
                  necesitás.
                </p>
                <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                  <li>{CATALOGO_RESUMEN.automatizaciones} automatizaciones</li>
                  <li>{CATALOGO_RESUMEN.serviciosIa} servicios IA</li>
                  <li>{CATALOGO_RESUMEN.appsNicho} apps de nicho</li>
                  <li>{CATALOGO_RESUMEN.packs} packs</li>
                  <li>{CATALOGO_RESUMEN.modulosErp}+ módulos ERP</li>
                </ul>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button size="lg" className="bg-emerald-500 text-slate-950 hover:bg-emerald-400" asChild>
                  <Link href="/claver/apps">
                    Explorar catálogo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/25 bg-transparent text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/demo">Probar demo por rubro</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}