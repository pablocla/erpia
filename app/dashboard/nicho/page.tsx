"use client"

import { useState } from "react"
import Link from "next/link"
import { Sparkles, Store } from "lucide-react"
import { CABALLOS_CALLE_APP_IDS, NICHE_APPS, isCaballoCalle } from "@/lib/niche/niche-apps-catalog"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { LegacyBridgeBenchmarkCard } from "@/components/niche/legacy-bridge-benchmark-card"
import { LegacyBridgeContractsCard } from "@/components/niche/legacy-bridge-contracts-card"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

type ProductosResumen = {
  mapa: Record<string, boolean>
}

type FiltroHub = "calle" | "todas"

export default function NichoHubPage() {
  const [filtro, setFiltro] = useState<FiltroHub>("calle")
  const { data } = useAuthFetch<ProductosResumen>("/api/platform/productos")
  const activos = data?.mapa ?? {}

  const appsVisibles =
    filtro === "calle"
      ? NICHE_APPS.filter((a) => isCaballoCalle(a.appId))
      : NICHE_APPS

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="rounded-2xl border border-border/50 bg-card/80 p-5 md:p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Grupo Claver — Apps de nicho</h1>
        <p className="text-muted-foreground mt-1.5 text-[15px]">
          Mini-SaaS para LATAM: un dolor, una app, WhatsApp incluido.
        </p>
      </div>

      <div className="inline-flex p-1 rounded-full bg-muted/60 border border-border/40">
        <Button
          size="sm"
          variant={filtro === "calle" ? "default" : "ghost"}
          onClick={() => setFiltro("calle")}
          className="gap-1.5 rounded-full h-8"
        >
          <Store className="h-3.5 w-3.5" />
          Recomendadas calle ({CABALLOS_CALLE_APP_IDS.length})
        </Button>
        <Button
          size="sm"
          variant={filtro === "todas" ? "default" : "ghost"}
          onClick={() => setFiltro("todas")}
          className="rounded-full h-8"
        >
          Catálogo completo ({NICHE_APPS.length})
        </Button>
      </div>

      {filtro === "calle" && (
        <p className="text-sm text-muted-foreground">
          Estas {CABALLOS_CALLE_APP_IDS.length} apps son las que más cierran en visita puerta a puerta.
          El catálogo completo cubre {NICHE_APPS.length} rubros para decir «sí, tenemos algo para vos».
        </p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {appsVisibles.map((app) => {
          const activa = activos[app.sku] === true
          return (
            <Card
              key={app.appId}
              className={`flex flex-col rounded-2xl border-border/50 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${activa ? "border-primary/30 ring-1 ring-primary/10" : ""}`}
            >
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-xl">{app.emoji}</span>
                  <span className="flex-1 min-w-0">{app.nombre}</span>
                  <span className="flex gap-1 shrink-0">
                    {isCaballoCalle(app.appId) && (
                      <Badge variant="outline" className="text-[10px] border-primary/50">
                        Calle
                      </Badge>
                    )}
                    {activa && (
                      <Badge variant="default" className="text-[10px]">
                        Activa
                      </Badge>
                    )}
                  </span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{app.lema}</p>
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                <Badge variant="secondary" className="text-xs">
                  {app.engine}
                </Badge>
                <p className="text-xs text-muted-foreground">{app.dolorResuelve}</p>
                <p className="text-xs text-primary/80 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {app.wowMoment}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <span className="text-sm font-medium">{fmt(app.precioArs)}/mes</span>
                {activa ? (
                  <Button asChild size="sm">
                    <Link href={app.goldenPath}>Abrir</Link>
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/apps?sku=${app.sku}`}>Activar</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <LegacyBridgeBenchmarkCard />
      <LegacyBridgeContractsCard />

      <Card className="border-dashed">
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p>
            También disponible:{" "}
            <Link href="/dashboard/fiado" className="text-primary underline">
              Libreta Fiado
            </Link>{" "}
            para almacenes de barrio.
          </p>
          <p>
            Catálogo público:{" "}
            <Link href="/claver/apps?nicho=nicho_latam" className="text-primary underline">
              Claver Apps — Nicho LATAM
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}