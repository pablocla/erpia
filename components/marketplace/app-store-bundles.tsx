"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, Package, Sparkles, Store } from "lucide-react"
import { authFetch } from "@/lib/stores"
import { MARKETPLACE_BUNDLES, type MarketplaceBundle } from "@/lib/marketplace"
import { ALMACEN_ROSARIO_BUNDLE_ID } from "@/lib/almacen-rosario/comercial"
import { PREMIUM_7_BUNDLE_ID } from "@/lib/marketplace/intangible-premium-7"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type CatalogItem = { sku: string; nombre: string; precioArs: number; instalada?: boolean }

const DESTACADOS = [ALMACEN_ROSARIO_BUNDLE_ID, PREMIUM_7_BUNDLE_ID]

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

async function pollJob(jobId: string, maxAttempts = 20): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await authFetch(`/api/marketplace/jobs/${jobId}`)
    if (res.ok) {
      const job = await res.json()
      if (job.estado === "ready" || job.estado === "pending" || job.estado === "failed") {
        return job.estado
      }
    }
    await new Promise((r) => setTimeout(r, 800))
  }
  return "running"
}

interface AppStoreBundlesProps {
  catalog?: CatalogItem[]
  highlightBundleId?: string | null
  onInstalled?: () => void
}

function bundleIcon(id: string) {
  if (id === ALMACEN_ROSARIO_BUNDLE_ID) return <Store className="h-5 w-5 text-orange-500" />
  if (id === PREMIUM_7_BUNDLE_ID) return <Sparkles className="h-5 w-5 text-violet-500" />
  return <Package className="h-5 w-5 text-slate-500" />
}

function bundleAccent(id: string) {
  if (id === ALMACEN_ROSARIO_BUNDLE_ID) return "border-orange-300/60 bg-orange-500/5"
  if (id === PREMIUM_7_BUNDLE_ID) return "border-violet-300/60 bg-violet-500/5"
  return "border-border/40 bg-card"
}

export function AppStoreBundles({ catalog, highlightBundleId, onInstalled }: AppStoreBundlesProps) {
  const [installing, setInstalling] = useState<string | null>(null)

  const bundles = MARKETPLACE_BUNDLES.filter((b) => DESTACADOS.includes(b.id))

  async function installBundle(bundle: MarketplaceBundle) {
    if (!catalog?.length) return
    setInstalling(bundle.id)
    try {
      const items = bundle.skus
        .map((sku) => catalog.find((c) => c.sku === sku))
        .filter((c): c is CatalogItem => Boolean(c) && !c.instalada)
        .map((c) => ({ sku: c.sku, cantidad: 1, precio: c.precioArs }))

      if (items.length === 0) {
        setInstalling(null)
        return
      }

      const res = await authFetch("/api/marketplace/checkout", {
        method: "POST",
        body: JSON.stringify({ items, origen: "dashboard", bundleId: bundle.id }),
      })
      if (!res.ok) throw new Error("Checkout failed")

      const checkout = await res.json()
      const jobs = (checkout.provisionResults ?? []) as Array<{ jobId?: string }>
      for (const j of jobs) {
        if (j.jobId) await pollJob(j.jobId)
      }

      onInstalled?.()
      window.dispatchEvent(new Event("productos-updated"))
    } catch (e) {
      console.error(e)
    } finally {
      setInstalling(null)
    }
  }

  function instaladosCount(bundle: MarketplaceBundle) {
    if (!catalog) return 0
    return bundle.skus.filter((sku) => catalog.find((c) => c.sku === sku)?.instalada).length
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Packs recomendados</h2>
        <p className="text-sm text-muted-foreground">
          Activá varios módulos en una sola orden y ahorrá vs. comprar sueltos.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {bundles.map((bundle) => {
          const instalados = instaladosCount(bundle)
          const total = bundle.skus.length
          const completo = instalados >= total
          const panelHref =
            bundle.id === ALMACEN_ROSARIO_BUNDLE_ID
              ? "/dashboard/almacen"
              : "/dashboard/apps/premium"

          return (
            <div
              key={bundle.id}
              className={cn(
                "rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-shadow",
                bundleAccent(bundle.id),
                highlightBundleId === bundle.id && "ring-2 ring-primary shadow-lg",
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {bundleIcon(bundle.id)}
                    <div>
                      <p className="font-semibold">{bundle.nombre}</p>
                      <p className="text-xs text-muted-foreground italic">«{bundle.lema}»</p>
                    </div>
                  </div>
                  {completo ? (
                    <Badge className="bg-emerald-600">Completo</Badge>
                  ) : instalados > 0 ? (
                    <Badge variant="secondary">
                      {instalados}/{total}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground mt-3">{bundle.descripcion}</p>
                <p className="mt-3 text-xl font-bold">{fmt(bundle.precioPackArs)}<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                <p className="text-xs text-muted-foreground">−{bundle.ahorroPct}% vs. SKUs sueltos · {total} módulos</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={panelHref}>Ver panel</Link>
                </Button>
                <Button
                  size="sm"
                  disabled={completo || installing === bundle.id || !catalog}
                  onClick={() => void installBundle(bundle)}
                >
                  {installing === bundle.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : completo ? (
                    "Instalado"
                  ) : (
                    "Obtener pack"
                  )}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}