"use client"

import Link from "next/link"
import { Lock, Unlock, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ModuloAlmacenRosario } from "@/lib/almacen-rosario/modulos-catalog"
import { DOLOR_POR_SKU, modulosPorGrupo } from "@/lib/almacen-rosario/comercial"

export type ModuloConEstado = ModuloAlmacenRosario & {
  activo: boolean
  bloqueado: boolean
  activarEn: string
  guiaEn: string
}

interface AlmacenModulosGridProps {
  modulos: ModuloConEstado[]
  onAccion?: (modulo: ModuloConEstado) => void
  /** Agrupa por categoría comercial (caja, mostrador, etc.) */
  grouped?: boolean
}

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

function ModuloCard({
  m,
  onAccion,
}: {
  m: ModuloConEstado
  onAccion?: (modulo: ModuloConEstado) => void
}) {
  const dolor = DOLOR_POR_SKU[m.sku]

  return (
    <Card className={m.bloqueado ? "opacity-85 border-dashed" : "border-primary/20"}>
      <CardHeader className="pb-2 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium leading-tight">{m.nombre}</CardTitle>
          {m.activo ? (
            <Badge className="shrink-0 gap-0.5 text-[10px] bg-emerald-600">
              <Unlock className="h-3 w-3" />
              Activo
            </Badge>
          ) : (
            <Badge variant="outline" className="shrink-0 gap-0.5 text-[10px]">
              <Lock className="h-3 w-3" />
              Inactivo
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{m.lema}</p>
        {dolor && (
          <p className="text-[11px] text-muted-foreground line-clamp-2">{dolor}</p>
        )}
        <p className="text-[10px] text-muted-foreground">{fmt(m.precioArs)}/mes</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <ol className="text-[11px] text-muted-foreground list-decimal list-inside space-y-0.5">
          {m.pasosUso.slice(0, 2).map((p, i) => (
            <li key={i} className="line-clamp-2">
              {p}
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
            <Link href={m.guiaEn}>
              <BookOpen className="h-3 w-3 mr-1" />
              Guía
            </Link>
          </Button>
          {m.bloqueado ? (
            <Button asChild size="sm" variant="secondary" className="h-7 text-xs">
              <Link href={`${m.activarEn}?sku=${m.sku}`}>
                <Lock className="h-3 w-3 mr-1" />
                Activar
              </Link>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => onAccion?.(m)}
            >
              Usar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function AlmacenModulosGrid({ modulos, onAccion, grouped = true }: AlmacenModulosGridProps) {
  const bySku = Object.fromEntries(modulos.map((m) => [m.sku, m]))

  if (!grouped) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {modulos.map((m) => (
          <ModuloCard key={m.sku} m={m} onAccion={onAccion} />
        ))}
      </div>
    )
  }

  const grupos = modulosPorGrupo()

  return (
    <div className="space-y-6">
      {grupos.map((g) => {
        const items = g.skus.map((sku) => bySku[sku]).filter(Boolean) as ModuloConEstado[]
        if (!items.length) return null
        return (
          <div key={g.id}>
            <h3 className="text-sm font-semibold mb-1">
              {g.emoji} {g.nombre}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">{g.descripcion}</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((m) => (
                <ModuloCard key={m.sku} m={m} onAccion={onAccion} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}