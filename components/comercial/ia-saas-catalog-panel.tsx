"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Bot, ChevronDown, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  IA_SAAS_TOP_20,
  IA_SAAS_TIER_PACKS,
  fmtPrecioArs,
  type IaSaasPack,
  type IaSaasTier,
} from "@/lib/comercial/ia-saas-top20"
import { authFetch } from "@/lib/stores"
import { useToast } from "@/hooks/use-toast"

const TIER_LABEL: Record<IaSaasTier, string> = {
  infra: "Infraestructura",
  inteligencia: "Inteligencia",
  operaciones: "Operaciones",
  cobranza: "Cobranza",
  nicho: "Nicho",
}

const ESTADO_BADGE = {
  disponible: "default",
  beta: "secondary",
  planned: "outline",
} as const

interface IaSaasCatalogPanelProps {
  className?: string
  rubro?: string
  compact?: boolean
  showTiers?: boolean
}

export function IaSaasCatalogPanel({
  className,
  rubro,
  compact = false,
  showTiers = true,
}: IaSaasCatalogPanelProps) {
  const { toast } = useToast()
  const [loadingSku, setLoadingSku] = useState<string | null>(null)
  const [tierFilter, setTierFilter] = useState<IaSaasTier | "todos">("todos")
  const [expanded, setExpanded] = useState(!compact)

  const packs = useMemo(() => {
    let list = [...IA_SAAS_TOP_20]
    if (tierFilter !== "todos") list = list.filter((p) => p.tier === tierFilter)
    if (rubro) {
      const r = rubro.toLowerCase()
      list = list.filter(
        (p) => p.rubros.includes("*") || p.rubros.some((x) => r.includes(x) || x.includes(r)),
      )
    }
    return list
  }, [rubro, tierFilter])

  async function activarSku(sku: string) {
    setLoadingSku(sku)
    try {
      const res = await authFetch("/api/billing/subscribe", {
        method: "POST",
        body: JSON.stringify({ sku }),
      })
      const data = await res.json()
      if (res.ok && data.free) {
        toast({ title: data.message ?? "Módulo activado" })
        window.location.reload()
        return
      }
      if (res.ok && data.init_point) {
        window.location.href = data.init_point
        return
      }
      toast({
        title: "No se pudo activar",
        description: data.error ?? "Intentá de nuevo.",
        variant: "destructive",
      })
    } catch {
      toast({ title: "Error de conexión", variant: "destructive" })
    } finally {
      setLoadingSku(null)
    }
  }

  function renderPack(p: IaSaasPack) {
    const precioLabel =
      p.tipoCobro === "incluido"
        ? "Incluido con motor IA"
        : p.tipoCobro === "por_uso"
          ? `${fmtPrecioArs(p.precioArs)} + uso`
          : `${fmtPrecioArs(p.precioArs)}/mes`

    return (
      <Card key={p.id} className="overflow-hidden">
        <CardHeader className="pb-2 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                #{p.rank} · {TIER_LABEL[p.tier]}
              </p>
              <CardTitle className="text-base leading-snug">{p.nombre}</CardTitle>
            </div>
            <Badge variant={ESTADO_BADGE[p.estado || "disponible"]} className="shrink-0 text-[10px]">
              {p.estado}
            </Badge>
          </div>
          <CardDescription className="text-xs">{p.lema}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <p className="text-xs text-muted-foreground leading-relaxed">{p.descripcion}</p>
          <div className="flex flex-wrap gap-1">
            {p.procesosErp.slice(0, 4).map((proc) => (
              <Badge key={proc} variant="outline" className="text-[10px] font-normal">
                {proc}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-sm font-semibold tabular-nums">{precioLabel}</span>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                <Link href={p.dashboardPath}>Ver</Link>
              </Button>
              {p.precioArs > 0 && (
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  disabled={loadingSku != null}
                  onClick={() => void activarSku(p.skuPrincipal)}
                >
                  {loadingSku === p.skuPrincipal ? "…" : "Activar"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const visiblePacks = compact && !expanded ? packs.slice(0, 6) : packs

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Top 20 IA + ERP
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Procesos del ERP empaquetados como SaaS con Gemini. Activá por módulo o por pack.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["todos", "infra", "inteligencia", "operaciones", "cobranza", "nicho"] as const).map((t) => (
            <Button
              key={t}
              variant={tierFilter === t ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setTierFilter(t)}
            >
              {t === "todos" ? "Todos" : TIER_LABEL[t]}
            </Button>
          ))}
        </div>
      </div>

      {showTiers && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {IA_SAAS_TIER_PACKS.map((tier) => (
            <Card key={tier.id} className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {tier.nombre}
                </CardTitle>
                <CardDescription className="text-xs">{tier.lema}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-2 pt-0">
                <div>
                  <p className="text-base font-bold tabular-nums">{fmtPrecioArs(tier.precioPackArs)}<span className="text-xs font-normal text-muted-foreground">/mes</span></p>
                  <p className="text-[10px] text-emerald-600">Ahorro {tier.ahorroPct}%</p>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
                  <Link href={`/login?activar=${encodeURIComponent(tier.id)}`}>Probar pack</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {visiblePacks.map(renderPack)}
      </div>

      {compact && packs.length > 6 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronDown className={cn("h-3.5 w-3.5 mr-1 transition-transform", expanded && "rotate-180")} />
          {expanded ? "Ver menos" : `Ver los ${packs.length} empaquetados`}
        </Button>
      )}
    </div>
  )
}