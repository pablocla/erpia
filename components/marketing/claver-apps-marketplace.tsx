"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ClaverShell } from "@/components/marketing/claver-shell"
import {
  AUTOPOOL_BRAND,
  AUTOPOOL_ENTRIES,
  AUTOPOOL_NICHOS,
  AUTOPOOL_TIPOS,
  type AutopoolNichoId,
  type AutopoolTipoId,
  type AutopoolCertLevel,
} from "@/lib/marketplace/autopool-manifest"
import { MARKETPLACE_BUNDLES } from "@/lib/marketplace/bundles"
import { INTANGIBLE_PREMIUM_7, PREMIUM_7_BUNDLE_ID } from "@/lib/marketplace/intangible-premium-7"
import { CLAVER_SERVICE_LINES } from "@/lib/marketing/claver-services-catalog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { MotionFadeDown, MotionList, MotionListItem } from "@/components/ui/motion"
import { Check, Sparkles, Zap, Clock, Home, Plug, Shield, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { AlmacenRosarioVitrine } from "@/components/marketing/almacen-rosario-vitrine"

const fmtArs = (n: number) =>
  n === 0
    ? "Incluido"
    : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

const CERT_LABEL: Record<AutopoolCertLevel, string> = {
  GLOBAL_AUTO: "🟢 Auto global",
  REGION_AUTO: "🔵 Auto regional",
  SEMI_AUTO: "🟡 Guiado remoto",
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
    tipoParam && tipoParam in AUTOPOOL_TIPOS ? tipoParam : "todos"
  )
  const [nichoActivo, setNichoActivo] = useState<AutopoolNichoId | "todos">(
    nichoParam && nichoParam in AUTOPOOL_NICHOS ? nichoParam : "todos"
  )

  const entradas = useMemo(() => {
    let list = AUTOPOOL_ENTRIES
    if (tipoActivo !== "todos") list = list.filter((e) => e.tipo === tipoActivo)
    if (nichoActivo !== "todos") list = list.filter((e) => e.nicho === nichoActivo)
    return list
  }, [tipoActivo, nichoActivo])

  const tipoLema =
    tipoActivo !== "todos" ? AUTOPOOL_TIPOS[tipoActivo].lema : AUTOPOOL_BRAND.lema

  const premiumBundle = MARKETPLACE_BUNDLES.find((b) => b.id === PREMIUM_7_BUNDLE_ID)

  return (
    <ClaverShell context="matrix">
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/80 via-slate-50 to-white pt-24 pb-16 sm:pt-32">
        <div className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <MotionFadeDown className="text-center">
            <Badge className="mb-6 border-amber-300/50 bg-amber-100 text-amber-900">
              <Zap className="mr-1.5 h-3.5 w-3.5" />
              {AUTOPOOL_BRAND.badge} — {AUTOPOOL_ENTRIES.length} servicios · expansión diaria
            </Badge>
            <h1 className="mx-auto max-w-4xl font-[var(--font-fraunces)] text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
              {AUTOPOOL_BRAND.fullName}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-xl font-medium text-amber-800/90 italic">
              «{tipoLema}»
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500">
              Automatizaciones, integraciones (Shopify, Tienda Nube, Odoo), implementación remota,
              relevamientos y marketing — todo activable desde tu casa.
            </p>
          </MotionFadeDown>

          {/* Filtro por tipo de servicio */}
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setTipoActivo("todos")}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition",
                tipoActivo === "todos"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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
                title={t.lema}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition",
                  tipoActivo === t.id
                    ? "border-amber-600 bg-amber-500 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-amber-200"
                )}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>

          {/* Filtro secundario por nicho */}
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            <button
              type="button"
              onClick={() => setNichoActivo("todos")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                nichoActivo === "todos" ? "bg-slate-200 text-slate-800" : "text-slate-500 hover:bg-slate-100"
              )}
            >
              Todos los nichos
            </button>
            {NICHOS.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setNichoActivo(n.id)}
                title={n.lema}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  nichoActivo === n.id ? "bg-amber-100 text-amber-900" : "text-slate-500 hover:bg-slate-100"
                )}
              >
                {n.emoji} {n.label}
              </button>
            ))}
          </div>

          {/* Premium ERP 7 — vitrina comercial */}
          <div className="mt-14 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Badge className="mb-3 bg-violet-600 hover:bg-violet-600">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Premium ERP 7
                </Badge>
                <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900">
                  Lo que SAP cobra en dólares, en pesos argentinos
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Servicios intangibles automáticos inspirados en NetSuite, Odoo y Salesforce —
                  conciliación de pagos, fraude POS, retenciones AFIP, reposición JIT y más.
                </p>
              </div>
              {premiumBundle && (
                <div className="shrink-0 rounded-xl border border-violet-200 bg-white p-4 text-center">
                  <p className="text-xs font-medium text-violet-700">Pack completo</p>
                  <p className="text-2xl font-bold text-slate-900">{fmtArs(premiumBundle.precioPackArs)}</p>
                  <p className="text-xs text-slate-500">/ mes · −{premiumBundle.ahorroPct}%</p>
                  <Button className="mt-3 w-full bg-violet-600 hover:bg-violet-500" asChild>
                    <Link href={`/login?activar=${PREMIUM_7_BUNDLE_ID}`}>Activar pack</Link>
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {INTANGIBLE_PREMIUM_7.map((svc) => (
                <Card key={svc.sku} className="border-slate-200/80 bg-white/90">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        #{svc.rank}
                      </Badge>
                      <Badge
                        className={
                          svc.status === "disponible"
                            ? "bg-emerald-100 text-emerald-800 text-[10px]"
                            : svc.status === "beta"
                              ? "bg-amber-100 text-amber-800 text-[10px]"
                              : "bg-slate-100 text-slate-600 text-[10px]"
                        }
                      >
                        {svc.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-base leading-snug">{svc.nombre}</CardTitle>
                    <p className="text-xs italic text-violet-800/80">«{svc.lema}»</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-slate-600 line-clamp-3">{svc.solucion}</p>
                    <p className="text-[10px] text-slate-400">Inspirado en {svc.inspiradoEn}</p>
                    <div className="flex items-baseline gap-1 pt-1">
                      <span className="text-lg font-bold">{fmtArs(svc.precioArs)}</span>
                      <span className="text-xs text-slate-500">/ mes</span>
                    </div>
                    <p className="text-[10px] text-slate-500">{svc.monetizacionDetalle}</p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                      <Link href={`/login?activar=${svc.sku}`}>
                        <Shield className="mr-1 h-3 w-3" />
                        Activar
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>

          {/* Pack Almacén Rosario — vitrina retail barrio */}
          <div className="mt-14">
            <AlmacenRosarioVitrine variant="compact" ctaMode="public" />
            <p className="mt-3 text-center text-xs text-slate-400">
              <Link href="/claver/almacen-rosario" className="underline hover:text-slate-600">
                Ver página completa del pack →
              </Link>
            </p>
          </div>

          <MotionList className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {entradas.map((entry) => {
              const nicho = AUTOPOOL_NICHOS[entry.nicho]
              const tipo = AUTOPOOL_TIPOS[entry.tipo]
              return (
                <MotionListItem key={entry.sku}>
                  <Card
                    className={cn(
                      "relative flex h-full flex-col transition-all hover:-translate-y-0.5 hover:shadow-lg",
                      entry.destacado ? "border-amber-400/60 ring-1 ring-amber-400/30" : "border-slate-200"
                    )}
                  >
                    {entry.destacado && (
                      <div className="absolute top-0 right-0 rounded-bl-xl bg-amber-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                        Destacado
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {tipo.emoji} {tipo.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-800">
                          {nicho.emoji} {nicho.label}
                        </Badge>
                        {entry.remotoDesdeCasa && (
                          <Badge className="text-[10px] bg-lime-100 text-lime-800">
                            <Home className="mr-0.5 h-3 w-3" />
                            Desde casa
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="font-[var(--font-fraunces)] text-xl">{entry.nombre}</CardTitle>
                      <p className="text-sm font-medium italic text-amber-800/80">«{entry.lema}»</p>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-slate-600">{entry.descripcionCorta}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {CERT_LABEL[entry.autoCertLevel]}
                        </Badge>
                        {entry.maturity === "seed" && (
                          <Badge className="text-[10px] bg-violet-100 text-violet-700">Nuevo en el pool</Badge>
                        )}
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        ~{entry.activacionMinutos} min
                        <span className="text-slate-300">·</span>
                        v{entry.poolVersion}
                      </div>
                      <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
                        <span className="text-2xl font-bold text-slate-900">{fmtArs(entry.precioDesdeArs)}</span>
                        {entry.precioDesdeArs > 0 && (
                          <span className="text-sm text-slate-500">
                            {entry.tipoCobro === "one_shot" ? " pago único" : " / mes"}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {entry.vibeTags.slice(0, 5).map((t) => (
                          <span key={t} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-slate-100 bg-slate-50/50 pt-4">
                      <Button className="w-full bg-amber-600 hover:bg-amber-500 text-white" asChild>
                        <Link href={activarHref(entry)}>
                          {entry.tipo === "integracion" ? (
                            <>
                              <Plug className="mr-2 h-4 w-4" />
                              Conectar ahora
                            </>
                          ) : (
                            <>
                              <Zap className="mr-2 h-4 w-4" />
                              Activar ahora
                            </>
                          )}
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </MotionListItem>
              )
            })}
          </MotionList>

          {entradas.length === 0 && (
            <p className="mt-12 text-center text-slate-500">No hay servicios en esta combinación. Probá otro filtro.</p>
          )}

          <p className="mt-10 text-center text-xs text-slate-400">
            Pool vivo — vibe coding diario. Shopify, Tienda Nube y Odoo con sync en el repo.
          </p>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <Badge variant="outline" className="mb-4 border-blue-200 bg-blue-50 text-blue-700">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Líneas Claver
            </Badge>
            <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900">
              Plataformas completas
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CLAVER_SERVICE_LINES.map((line) => {
              const Icon = line.icon
              const ok = line.status === "disponible" || line.status === "beta"
              return (
                <Card key={line.id} className="border-slate-200">
                  <CardHeader>
                    <div
                      className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white ${line.gradient}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{line.name}</CardTitle>
                    <p className="text-sm text-slate-500">{line.tagline}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {line.features.slice(0, 3).map((f) => (
                        <li key={f} className="flex gap-2 text-sm text-slate-600">
                          <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" disabled={!ok} asChild={!!line.href && ok}>
                      {line.href && ok ? <Link href={line.href}>Explorar</Link> : "Próximamente"}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      </section>
    </ClaverShell>
  )
}