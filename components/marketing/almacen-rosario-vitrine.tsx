"use client"

import Link from "next/link"
import { Check, Lock, Store, Unlock } from "lucide-react"
import { MARKETPLACE_BUNDLES } from "@/lib/marketplace"
import {
  ALMACEN_ROSARIO_BUNDLE_ID,
  ALMACEN_ROSARIO_CASOS,
  ALMACEN_ROSARIO_FAQ,
  DOLOR_POR_SKU,
  VISIBILIDAD_MENSAJE,
  modulosPorGrupo,
  precioSueltoTotalArs,
} from "@/lib/almacen-rosario/comercial"
import { CLAVIS_CORE } from "@/lib/marketing/pricing-catalog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const fmtArs = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

interface AlmacenRosarioVitrineProps {
  /** compact = solo hero + grupos (embed en /claver/apps) */
  variant?: "full" | "compact"
  /** CTA hacia login público o dashboard */
  ctaMode?: "public" | "dashboard"
}

export function AlmacenRosarioVitrine({ variant = "full", ctaMode = "public" }: AlmacenRosarioVitrineProps) {
  const bundle = MARKETPLACE_BUNDLES.find((b) => b.id === ALMACEN_ROSARIO_BUNDLE_ID)
  const grupos = modulosPorGrupo()
  const sueltoTotal = precioSueltoTotalArs()

  const activarHref =
    ctaMode === "dashboard"
      ? "/dashboard/apps?bundle=pool-almacen-rosario"
      : `/login?activar=${ALMACEN_ROSARIO_BUNDLE_ID}`

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge className="mb-3 bg-orange-600 hover:bg-orange-600">
              <Store className="mr-1 h-3 w-3" />
              Pack Almacén Rosario
            </Badge>
            <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900">
              {bundle?.lema ?? "Margen, merma y caja para el barrio."}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              18 herramientas para almacenes, kioscos y verdulerías: envases, vales, listas de
              distribuidora, 2×1, arqueo ciego y más. Pensado para el dueño que labura en el mostrador.
            </p>
            <p className="mt-3 flex items-start gap-2 text-xs text-orange-900/80">
              <Unlock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {VISIBILIDAD_MENSAJE}
            </p>
          </div>
          {bundle && (
            <div className="shrink-0 rounded-xl border border-orange-200 bg-white p-4 text-center min-w-[200px]">
              <p className="text-xs font-medium text-orange-800">Pack completo (18 módulos)</p>
              <p className="text-2xl font-bold text-slate-900">{fmtArs(bundle.precioPackArs)}</p>
              <p className="text-xs text-slate-500">/ mes · −{bundle.ahorroPct}% vs. sueltos</p>
              <p className="text-[10px] text-slate-400 line-through mt-1">{fmtArs(sueltoTotal)} sueltos</p>
              <Button className="mt-3 w-full bg-orange-600 hover:bg-orange-500" asChild>
                <Link href={activarHref}>Activar pack</Link>
              </Button>
              {variant === "full" && (
                <p className="mt-2 text-[10px] text-slate-500">
                  Con Core: ~{fmtArs(CLAVIS_CORE.priceMonthly + bundle.precioPackArs)}/mes
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {grupos.map((g) => (
            <div key={g.id} className="rounded-xl border border-orange-100 bg-white/80 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {g.emoji} {g.nombre}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{g.descripcion}</p>
              <ul className="mt-2 space-y-1.5">
                {g.modulos.map((m) => (
                  <li key={m.sku} className="text-xs text-slate-600 flex gap-1.5">
                    <Check className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                    <span>
                      <strong>{m.nombre}</strong>
                      {variant === "full" && DOLOR_POR_SKU[m.sku] && (
                        <span className="block text-slate-500 font-normal mt-0.5">
                          {DOLOR_POR_SKU[m.sku]}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {variant === "full" && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {ALMACEN_ROSARIO_CASOS.map((c) => (
              <Card key={c.titulo} className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{c.titulo}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <ul className="text-xs text-slate-600 space-y-1">
                    {c.modulos.map((m) => (
                      <li key={m} className="flex gap-1">
                        <Check className="h-3 w-3 text-orange-600 shrink-0" />
                        {m}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs font-medium text-orange-800">{c.ahorro}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Preguntas frecuentes</h3>
            {ALMACEN_ROSARIO_FAQ.map((f) => (
              <div key={f.pregunta}>
                <p className="text-sm font-medium text-slate-800">{f.pregunta}</p>
                <p className="text-sm text-slate-600 mt-1">{f.respuesta}</p>
              </div>
            ))}
          </div>

          <div
            className={cn(
              "flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-orange-200 px-4 py-3",
              "bg-orange-500/5",
            )}
          >
            <p className="text-sm text-slate-700 flex items-center gap-2">
              <Lock className="h-4 w-4 text-orange-600" />
              Probá el panel: todo visible, activás solo lo que necesitás.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={ctaMode === "dashboard" ? "/dashboard/almacen/guia" : "/login"}>
                  Ver guía
                </Link>
              </Button>
              <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-500">
                <Link href={activarHref}>Empezar con el pack</Link>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}