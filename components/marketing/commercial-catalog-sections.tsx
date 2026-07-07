"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2, Layers, Package } from "lucide-react"
import {
  CATALOGO_RESUMEN,
  fmtPrecioArs,
  hrefPublicoLinea,
  lineasPorTier,
  PACKS_DESTACADOS,
  PLATAFORMAS_PRINCIPALES,
  PRODUCTOS_ENTRADA,
  totalSolucionesPublicadas,
} from "@/lib/comercial/commercial-packaging"
import {
  SUB_SAAS_APPS,
  subSaasDestacadas,
  subSaasLandingHref,
} from "@/lib/comercial/sub-saas-catalog"
import { COMBATE_APPS } from "@/lib/comercial/go-to-market-vitrine"
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

export function SubSaasAppsSection({
  className,
  destacadasOnly = false,
  combateOnly = false,
}: {
  className?: string
  destacadasOnly?: boolean
  combateOnly?: boolean
}) {
  let apps = SUB_SAAS_APPS
  if (combateOnly) apps = COMBATE_APPS
  else if (destacadasOnly) apps = subSaasDestacadas()

  return (
    <section aria-labelledby="subsaas-heading" className={cn("px-4 sm:px-6", className)}>
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="subsaas-heading"
              className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900 sm:text-3xl"
            >
              {combateOnly ? "Productos de Combate" : "Apps para vender hoy"}
            </h2>
            <p className="mt-2 max-w-xl text-slate-600">
              {combateOnly 
                ? "Soluciones simples, rápidas y efectivas para tu día a día."
                : "Diez productos chicos, celular y PC, sobre procesos que ya existen en Claver."}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/claver/apps#subsaas">
              Ver las {SUB_SAAS_APPS.length} apps
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </ScrollReveal>

        <MotionList className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => {
            const status = SUB_SAAS_STATUS[app.estado]
            return (
              <MotionListItem key={app.slug}>
                <Card className="flex h-full flex-col border-slate-200/80 transition hover:border-emerald-200 hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="font-[var(--font-fraunces)] text-lg">{app.nombre}</CardTitle>
                      <Badge className={cn("shrink-0 text-[10px]", status.className)}>
                        {status.text}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-blue-700">{app.marca}</p>
                    <p className="text-sm text-slate-600">{app.lema}</p>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-2xl font-bold text-slate-900">
                      {app.precioArs === 0 ? "Incluido" : fmtPrecioArs(app.precioArs)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {app.precioArs === 0 ? "con trial" : "/ mes"} · {app.listoPct}% listo
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={subSaasLandingHref(app.slug)}>
                        Ver landing
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
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
            <Card key={p.sku} className="flex h-full flex-col border-slate-200/80 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="font-[var(--font-fraunces)] text-xl">{p.nombre}</CardTitle>
                <p className="text-sm text-slate-600">{p.lema}</p>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-3xl font-bold text-slate-900">{fmtPrecioArs(p.precioArs)}</p>
                <p className="text-sm text-slate-500">/ mes · trial {p.trialDias} días</p>
              </CardContent>
              <CardFooter>
                {p.disponible ? (
                  <Button className="w-full" asChild>
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
              <Card className="h-full border-slate-200/80 transition hover:border-emerald-200 hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{pack.nombre}</CardTitle>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {pack.cantidadSkus} módulos
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{pack.lema}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{fmtPrecioArs(pack.precioArs)}</p>
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
    <Card className={cn("h-full bg-white", compact ? "border-slate-200/80" : "border-slate-200/80 shadow-sm")}>
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
        <CardTitle className={cn("font-[var(--font-fraunces)]", compact ? "text-lg" : "text-xl")}>
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