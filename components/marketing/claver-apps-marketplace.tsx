"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ClaverShell } from "@/components/marketing/claver-shell"
import {
  PacksRubroSection,
  PlataformasSection,
  ProductosEntradaSection,
  SubSaasAppsSection,
} from "@/components/marketing/commercial-catalog-sections"
import { CATALOGO_RESUMEN } from "@/lib/comercial/commercial-packaging"
import { activarRegisterHref } from "@/lib/comercial/activar-intent"
import { subSaasMarketplaceGroups } from "@/lib/comercial/sub-saas-catalog"
import {
  AUTOPOOL_ENTRIES,
  AUTOPOOL_NICHOS,
  AUTOPOOL_TIPOS,
  type AutopoolNichoId,
  type AutopoolTipoId,
  type AutopoolCertLevel,
} from "@/lib/marketplace/autopool-manifest"
import { MARKETPLACE_BUNDLES } from "@/lib/marketplace/bundles"
import { INTANGIBLE_PREMIUM_7, PREMIUM_7_BUNDLE_ID } from "@/lib/marketplace/intangible-premium-7"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { MotionFadeDown, MotionList, MotionListItem } from "@/components/ui/motion"
import { ArrowRight, ChevronDown, Clock, Home, Plug, Zap, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { AlmacenRosarioVitrine } from "@/components/marketing/almacen-rosario-vitrine"
import { effectiveSkuStatus, isSkuProvisionable } from "@/lib/marketplace/sku-availability"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const fmtArs = (n: number) =>
  n === 0
    ? "Incluido"
    : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

const CERT_LABEL: Record<AutopoolCertLevel, string> = {
  GLOBAL_AUTO: "Auto global",
  REGION_AUTO: "Auto regional",
  SEMI_AUTO: "Guiado remoto",
}

const TIPOS = Object.values(AUTOPOOL_TIPOS)
const NICHOS = Object.values(AUTOPOOL_NICHOS)

function activarHref(entry: { sku: string; tipo: AutopoolTipoId; integracionId?: string }) {
  if (entry.tipo === "integracion" && entry.integracionId) {
    return `/dashboard/integraciones/${entry.integracionId}`
  }
  return activarRegisterHref(entry.sku)
}

export function ClaverAppsMarketplace() {
  const searchParams = useSearchParams()
  const tipoParam = searchParams.get("tipo") as AutopoolTipoId | null
  const nichoParam = searchParams.get("nicho") as AutopoolNichoId | null

  const [tipoActivo, setTipoActivo] = useState<AutopoolTipoId | "todos">(
    tipoParam && tipoParam in AUTOPOOL_TIPOS ? tipoParam : "todos",
  )
  const [nichoActivo, setNichoActivo] = useState<AutopoolNichoId | "todos">(
    nichoParam && nichoParam in AUTOPOOL_NICHOS ? nichoParam : "todos",
  )
  const [autoOpen, setAutoOpen] = useState(false)

  const groups = useMemo(() => subSaasMarketplaceGroups(), [])
  const activasCount = groups.activas.length
  const betaCount = groups.beta.length

  const entradas = useMemo(() => {
    let list = AUTOPOOL_ENTRIES
    if (tipoActivo !== "todos") list = list.filter((e) => e.tipo === tipoActivo)
    if (nichoActivo !== "todos") list = list.filter((e) => e.nicho === nichoActivo)
    return list
  }, [tipoActivo, nichoActivo])

  const premiumBundle = MARKETPLACE_BUNDLES.find((b) => b.id === PREMIUM_7_BUNDLE_ID)

  return (
    <ClaverShell context="matrix">
      {/* Hero — misma paleta que home / landings combate */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-slate-950 via-[#0B1220] to-blue-950 pt-28 pb-16 text-white sm:pt-32 sm:pb-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.18),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <MotionFadeDown>
            <Badge className="mb-5 border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
              Apps funcionales · Argentina
            </Badge>
            <h1 className="max-w-3xl font-[var(--font-fraunces)] text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
              Catálogo de apps y packs
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300 leading-relaxed sm:text-lg">
              Primero las <strong className="font-semibold text-white">{activasCount} apps listas</strong> para
              usar (Fiado, Cobrá, Turnos, POS…). Después packs, automatizaciones y betas.
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {activasCount} activas
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                {betaCount} en beta
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                {CATALOGO_RESUMEN.packs} packs
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                {CATALOGO_RESUMEN.automatizaciones} automatizaciones
              </li>
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                size="lg"
                className="h-12 bg-emerald-500 px-8 font-semibold text-slate-950 hover:bg-emerald-400"
                asChild
              >
                <Link href="#activas">
                  Ver apps activas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-white/20 bg-white/5 px-8 text-white hover:bg-white/10"
                asChild
              >
                <Link href="#packs">Ver packs</Link>
              </Button>
            </div>
          </MotionFadeDown>
        </div>
      </section>

      <div id="entrada" className="scroll-mt-24">
        <ProductosEntradaSection className="border-b border-slate-200/80 bg-[#f8fafc] py-14" />
      </div>

      {/* Apps — activas primero, coherente con producto real */}
      <div id="subsaas" className="scroll-mt-24 border-b border-slate-200/80 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Tabs defaultValue="activas" className="w-full">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900 sm:text-3xl">
                  Apps
                </h2>
                <p className="mt-2 max-w-xl text-slate-600">
                  Orden comercial: primero lo que ya resuelve un problema de punta a punta.
                </p>
              </div>
              <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-slate-100/80 p-1 sm:w-auto border border-slate-200/80">
                <TabsTrigger
                  value="activas"
                  id="activas"
                  className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                >
                  Activas ({activasCount})
                </TabsTrigger>
                <TabsTrigger
                  value="combate"
                  className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                >
                  Combate (8)
                </TabsTrigger>
                <TabsTrigger
                  value="beta"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Beta ({betaCount})
                </TabsTrigger>
                <TabsTrigger
                  value="todas"
                  className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                >
                  Todas
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="activas" className="mt-0 focus-visible:outline-none">
              <SubSaasAppsSection activasOnly hideHeader hideCatalogLink className="!px-0" />
            </TabsContent>
            <TabsContent value="combate" className="mt-0 focus-visible:outline-none">
              <SubSaasAppsSection combateOnly hideHeader hideCatalogLink className="!px-0" />
            </TabsContent>
            <TabsContent value="beta" className="mt-0 focus-visible:outline-none">
              <SubSaasAppsSection betaOnly hideHeader hideCatalogLink className="!px-0" />
            </TabsContent>
            <TabsContent value="todas" className="mt-0 focus-visible:outline-none">
              <SubSaasAppsSection hideHeader hideCatalogLink className="!px-0" />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div id="packs" className="scroll-mt-24">
        <PacksRubroSection className="border-b border-slate-200/80 bg-[#f8fafc] py-14" />
      </div>

      <section className="border-b border-slate-200/80 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AlmacenRosarioVitrine variant="compact" ctaMode="public" />
          <p className="mt-4 text-center text-xs text-slate-500">
            <Link href="/claver/almacen-rosario" className="text-emerald-700 underline hover:text-emerald-800">
              Ver detalle del pack Almacén Rosario
            </Link>
          </p>
        </div>
      </section>

      <section className="border-b border-slate-200/80 bg-[#f8fafc] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Collapsible open={autoOpen} onOpenChange={setAutoOpen}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900">
                  Automatizaciones
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Add-ons y playbooks. Algunas requieren SKU activo o están en roadmap.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm text-slate-500">{entradas.length} resultados</p>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50"
                  >
                    {autoOpen ? "Ocultar" : "Mostrar"}
                    {autoOpen ? (
                      <ChevronUp className="ml-2 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>

            <CollapsibleContent className="mt-8 space-y-8">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTipoActivo("todos")}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition",
                    tipoActivo === "todos"
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200",
                  )}
                >
                  Todos
                </button>
                {TIPOS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTipoActivo(t.id)
                      setNichoActivo("todos")
                    }}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition",
                      tipoActivo === t.id
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200",
                    )}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setNichoActivo("todos")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition",
                    nichoActivo === "todos"
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:bg-slate-100",
                  )}
                >
                  Todos los nichos
                </button>
                {NICHOS.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setNichoActivo(n.id)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition",
                      nichoActivo === n.id
                        ? "bg-emerald-100 text-emerald-900"
                        : "text-slate-500 hover:bg-slate-100",
                    )}
                  >
                    {n.emoji} {n.label}
                  </button>
                ))}
              </div>

              <Collapsible className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50/80"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">Pack Premium ERP 7</p>
                      <p className="text-sm text-slate-600">
                        Conciliación, fraude POS, fiscal y más —{" "}
                        {premiumBundle ? fmtArs(premiumBundle.precioPackArs) : ""} / mes
                      </p>
                    </div>
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="border-t border-slate-100 px-5 pb-5 pt-4">
                  {premiumBundle && (
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <Button className="bg-emerald-600 hover:bg-emerald-500" asChild>
                        <Link href={activarRegisterHref(PREMIUM_7_BUNDLE_ID)}>Activar pack completo</Link>
                      </Button>
                      <span className="text-sm text-slate-500">
                        −{premiumBundle.ahorroPct}% vs módulos sueltos
                      </span>
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {INTANGIBLE_PREMIUM_7.map((svc) => {
                      const provisionable = isSkuProvisionable(svc.sku)
                      return (
                        <Card key={svc.sku} className="border-slate-200/80 bg-[#f8fafc]/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base text-slate-900">{svc.nombre}</CardTitle>
                            <p className="text-xs text-slate-600">{svc.lema}</p>
                          </CardHeader>
                          <CardContent>
                            <p className="text-lg font-bold text-slate-900">
                              {fmtArs(svc.precioArs)}
                              <span className="text-xs font-normal text-slate-500"> / mes</span>
                            </p>
                          </CardContent>
                          <CardFooter className="pt-0">
                            {provisionable ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full border-slate-200 text-xs hover:border-emerald-200 hover:bg-emerald-50/50"
                                asChild
                              >
                                <Link href={activarRegisterHref(svc.sku)}>Activar</Link>
                              </Button>
                            ) : (
                              <Button variant="secondary" size="sm" className="w-full text-xs" disabled>
                                Próximamente
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                      )
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <MotionList className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {entradas.map((entry) => {
                  const nicho = AUTOPOOL_NICHOS[entry.nicho]
                  const tipo = AUTOPOOL_TIPOS[entry.tipo]
                  const provisionable = isSkuProvisionable(entry.sku)
                  const status = effectiveSkuStatus(entry.sku, "disponible")
                  return (
                    <MotionListItem key={entry.sku}>
                      <Card
                        className={cn(
                          "relative flex h-full flex-col border-slate-200/80 bg-white transition hover:border-emerald-200 hover:shadow-md",
                          entry.destacado && "border-emerald-300 ring-1 ring-emerald-100",
                        )}
                      >
                        {entry.destacado && (
                          <div className="absolute right-0 top-0 rounded-bl-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                            Destacado
                          </div>
                        )}
                        <CardHeader className="pb-2">
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            <Badge variant="outline" className="border-slate-200 text-[10px]">
                              {tipo.emoji} {tipo.label}
                            </Badge>
                            <Badge variant="outline" className="border-slate-200 text-[10px]">
                              {nicho.emoji} {nicho.label}
                            </Badge>
                            {entry.remotoDesdeCasa && (
                              <Badge className="bg-slate-100 text-[10px] text-slate-700">
                                <Home className="mr-0.5 h-3 w-3" />
                                Remoto
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg text-slate-900">{entry.nombre}</CardTitle>
                          <p className="text-sm text-slate-600">{entry.lema}</p>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <p className="text-sm text-slate-600">{entry.descripcionCorta}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-[10px]">
                              {CERT_LABEL[entry.autoCertLevel]}
                            </Badge>
                            {status === "planned" && (
                              <Badge className="bg-slate-100 text-[10px] text-slate-600">
                                Próximamente
                              </Badge>
                            )}
                          </div>
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                            <Clock className="h-3.5 w-3.5" />~{entry.activacionMinutos} min
                          </div>
                          <div className="mt-3 rounded-lg border border-slate-100 bg-[#f8fafc] p-3">
                            <span className="text-xl font-bold text-slate-900">
                              {fmtArs(entry.precioDesdeArs)}
                            </span>
                            {entry.precioDesdeArs > 0 && (
                              <span className="text-sm text-slate-500">
                                {entry.tipoCobro === "one_shot" ? " pago único" : " / mes"}
                              </span>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="border-t border-slate-100 bg-[#f8fafc]/50">
                          {provisionable ? (
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-500" asChild>
                              <Link href={activarHref(entry)}>
                                {entry.tipo === "integracion" ? (
                                  <>
                                    <Plug className="mr-2 h-4 w-4" />
                                    Conectar
                                  </>
                                ) : (
                                  <>
                                    <Zap className="mr-2 h-4 w-4" />
                                    Activar
                                  </>
                                )}
                              </Link>
                            </Button>
                          ) : (
                            <Button className="w-full" variant="secondary" disabled>
                              Próximamente
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    </MotionListItem>
                  )
                })}
              </MotionList>

              {entradas.length === 0 && (
                <p className="mt-10 text-center text-slate-500">No hay resultados con estos filtros.</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </section>

      <PlataformasSection className="border-t border-slate-200/80 bg-white py-14" />

      {/* CTA final — misma pieza que landings */}
      <section className="bg-gradient-to-br from-slate-950 via-[#0B1220] to-blue-950 px-4 py-16 text-white sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold sm:text-3xl">
            Empezá por un solo problema
          </h2>
          <p className="mt-3 text-slate-400">
            Fiado gratis. Cobrá, Turnos y POS con trial. Sumá packs cuando el negocio lo pida.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 bg-emerald-500 px-8 font-semibold text-slate-950 hover:bg-emerald-400"
              asChild
            >
              <Link href={activarRegisterHref("fiado")}>Probar Fiado gratis</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-white/20 bg-transparent px-8 text-white hover:bg-white/10"
              asChild
            >
              <Link href="/claver/contacto">Hablar con ventas</Link>
            </Button>
          </div>
        </div>
      </section>
    </ClaverShell>
  )
}
