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
import { ChevronDown, Clock, Home, Plug, Shield, Zap, ChevronUp } from "lucide-react"
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
  return `/login?activar=${entry.sku}`
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

  const entradas = useMemo(() => {
    let list = AUTOPOOL_ENTRIES
    if (tipoActivo !== "todos") list = list.filter((e) => e.tipo === tipoActivo)
    if (nichoActivo !== "todos") list = list.filter((e) => e.nicho === nichoActivo)
    return list
  }, [tipoActivo, nichoActivo])

  const premiumBundle = MARKETPLACE_BUNDLES.find((b) => b.id === PREMIUM_7_BUNDLE_ID)

  return (
    <ClaverShell context="matrix">
      <section className="border-b border-slate-200/80 bg-white pt-24 pb-8 sm:pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <MotionFadeDown>
            <h1 className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900 sm:text-4xl">
              Catálogo de soluciones
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              {CATALOGO_RESUMEN.automatizaciones} automatizaciones, {CATALOGO_RESUMEN.serviciosIa} servicios con
              IA, {CATALOGO_RESUMEN.appsNicho} apps de nicho y {CATALOGO_RESUMEN.packs} packs. Activás solo lo
              que necesitás.
            </p>
          </MotionFadeDown>
        </div>
      </section>

      <div id="entrada">
        <ProductosEntradaSection className="border-b border-slate-200/80 bg-[#f8fafc] py-12" />
      </div>

      <div id="subsaas" className="bg-white py-12 border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Tabs defaultValue="combate" className="w-full">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
              <div>
                <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900 sm:text-3xl">
                  Apps para vender hoy
                </h2>
                <p className="mt-2 max-w-xl text-slate-600">
                  Elegí la herramienta que más te urge hoy o explorá el catálogo completo.
                </p>
              </div>
              <TabsList className="bg-slate-100/50 border border-slate-200">
                <TabsTrigger value="combate">Productos de combate (8)</TabsTrigger>
                <TabsTrigger value="catalogo">Catálogo ERP (10)</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="combate" className="mt-0">
              <SubSaasAppsSection combateOnly className="py-4 !border-0 bg-transparent px-0 sm:px-0" />
            </TabsContent>
            <TabsContent value="catalogo" className="mt-0">
              <SubSaasAppsSection className="py-4 !border-0 bg-transparent px-0 sm:px-0" />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div id="packs">
        <PacksRubroSection className="border-b border-slate-200/80 bg-white py-12" />
      </div>

      <section className="border-b border-slate-200/80 bg-[#f8fafc] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AlmacenRosarioVitrine variant="compact" ctaMode="public" />
          <p className="mt-3 text-center text-xs text-slate-500">
            <Link href="/claver/almacen-rosario" className="underline hover:text-slate-700">
              Ver detalle del pack Almacén Rosario
            </Link>
          </p>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Collapsible open={autoOpen} onOpenChange={setAutoOpen}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900">
                  Automatizaciones
                </h2>
                <p className="mt-1 text-sm text-slate-600">Filtrá por tipo de servicio o nicho.</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm text-slate-500">{entradas.length} resultados</p>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">
                    {autoOpen ? "Ocultar" : "Mostrar"} {autoOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
            
            <CollapsibleContent className="mt-8 space-y-8 transition-all">

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTipoActivo("todos")}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition",
                tipoActivo === "todos"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
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
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200",
                )}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setNichoActivo("todos")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                nichoActivo === "todos" ? "bg-slate-200 text-slate-800" : "text-slate-500 hover:bg-slate-100",
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
                  nichoActivo === n.id ? "bg-blue-100 text-blue-900" : "text-slate-500 hover:bg-slate-100",
                )}
              >
                {n.emoji} {n.label}
              </button>
            ))}
          </div>

          <Collapsible className="mt-10 rounded-xl border border-violet-200 bg-violet-50/50">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div>
                  <p className="font-semibold text-slate-900">Pack Premium ERP 7</p>
                  <p className="text-sm text-slate-600">
                    Conciliación, fraude POS, fiscal y más — {premiumBundle ? fmtArs(premiumBundle.precioPackArs) : ""}
                    / mes
                  </p>
                </div>
                <ChevronDown className="h-5 w-5 text-slate-400" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t border-violet-100 px-5 pb-5 pt-4">
              {premiumBundle && (
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <Button className="bg-violet-600 hover:bg-violet-500" asChild>
                    <Link href={`/login?activar=${PREMIUM_7_BUNDLE_ID}`}>Activar pack completo</Link>
                  </Button>
                  <span className="text-sm text-slate-500">−{premiumBundle.ahorroPct}% vs módulos sueltos</span>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {INTANGIBLE_PREMIUM_7.map((svc) => {
                  const status = effectiveSkuStatus(svc.sku, svc.status)
                  const provisionable = isSkuProvisionable(svc.sku)
                  return (
                    <Card key={svc.sku} className="border-slate-200/80 bg-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{svc.nombre}</CardTitle>
                        <p className="text-xs text-slate-600">{svc.lema}</p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg font-bold">{fmtArs(svc.precioArs)}<span className="text-xs font-normal text-slate-500"> / mes</span></p>
                      </CardContent>
                      <CardFooter className="pt-0">
                        {provisionable ? (
                          <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                            <Link href={`/login?activar=${svc.sku}`}>Activar</Link>
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="w-full text-xs" disabled>
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

          <MotionList className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {entradas.map((entry) => {
              const nicho = AUTOPOOL_NICHOS[entry.nicho]
              const tipo = AUTOPOOL_TIPOS[entry.tipo]
              const provisionable = isSkuProvisionable(entry.sku)
              const status = effectiveSkuStatus(entry.sku, "disponible")
              return (
                <MotionListItem key={entry.sku}>
                  <Card
                    className={cn(
                      "relative flex h-full flex-col transition hover:shadow-md",
                      entry.destacado ? "border-blue-300 ring-1 ring-blue-200" : "border-slate-200",
                    )}
                  >
                    {entry.destacado && (
                      <div className="absolute right-0 top-0 rounded-bl-lg bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                        Destacado
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          {tipo.emoji} {tipo.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {nicho.emoji} {nicho.label}
                        </Badge>
                        {entry.remotoDesdeCasa && (
                          <Badge className="text-[10px] bg-slate-100 text-slate-700">
                            <Home className="mr-0.5 h-3 w-3" />
                            Remoto
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{entry.nombre}</CardTitle>
                      <p className="text-sm text-slate-600">{entry.lema}</p>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-slate-600">{entry.descripcionCorta}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {CERT_LABEL[entry.autoCertLevel]}
                        </Badge>
                        {status === "planned" && (
                          <Badge className="text-[10px] bg-slate-100 text-slate-600">Próximamente</Badge>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        ~{entry.activacionMinutos} min
                      </div>
                      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                        <span className="text-xl font-bold text-slate-900">{fmtArs(entry.precioDesdeArs)}</span>
                        {entry.precioDesdeArs > 0 && (
                          <span className="text-sm text-slate-500">
                            {entry.tipoCobro === "one_shot" ? " pago único" : " / mes"}
                          </span>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-slate-100 bg-slate-50/50">
                      {provisionable ? (
                        <Button className="w-full" asChild>
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

      <PlataformasSection className="border-t border-slate-200 bg-[#f8fafc] py-12" />
    </ClaverShell>
  )
}