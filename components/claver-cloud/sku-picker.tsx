"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { TenantPlanId } from "@/lib/ops/tenant-plan-limits"
import { TENANT_PLAN_LIMITS } from "@/lib/ops/tenant-plan-limits"

export type SkuCatalogItem = {
  sku: string
  nombre: string
  categoria: string
  precioArs: number
  status: string
  autoCertLevel?: string
}

interface SkuPickerProps {
  catalog: SkuCatalogItem[]
  selected: string[]
  onChange: (skus: string[]) => void
  plan: TenantPlanId
  className?: string
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

export function SkuPicker({ catalog, selected, onChange, plan, className }: SkuPickerProps) {
  const [filter, setFilter] = useState("")
  const limit = TENANT_PLAN_LIMITS[plan].maxSkusActivos

  const disponibles = useMemo(
    () => catalog.filter((item) => item.status !== "planned"),
    [catalog],
  )

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return disponibles
    return disponibles.filter(
      (item) =>
        item.nombre.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.categoria.toLowerCase().includes(q),
    )
  }, [disponibles, filter])

  const porCategoria = useMemo(() => {
    const map = new Map<string, SkuCatalogItem[]>()
    for (const item of filtered) {
      const list = map.get(item.categoria) ?? []
      list.push(item)
      map.set(item.categoria, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "es"))
  }, [filtered])

  function toggle(sku: string) {
    if (selected.includes(sku)) {
      onChange(selected.filter((s) => s !== sku))
      return
    }
    if (selected.length >= limit) return
    onChange([...selected, sku])
  }

  const mrrEstimado = selected.reduce((sum, sku) => {
    const item = catalog.find((c) => c.sku === sku)
    return sum + (item?.precioArs ?? 0)
  }, 0)

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar servicio por nombre o categoría…"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline" className={selected.length >= limit ? "border-amber-500/50 text-amber-400" : ""}>
            {selected.length} / {limit === 999 ? "∞" : limit} servicios
          </Badge>
          {selected.length > 0 && (
            <span className="text-muted-foreground text-xs">
              MRR estimado: <strong className="text-foreground">{fmt(mrrEstimado)}</strong>/mes
            </span>
          )}
        </div>
      </div>

      {selected.length >= limit && (
        <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
          El plan {plan} permite hasta {limit === 999 ? "servicios ilimitados" : `${limit} servicios`}. Cambiá de plan o quitá alguno.
        </p>
      )}

      <ScrollArea className="h-[320px] rounded-lg border">
        <div className="p-3 space-y-5">
          {porCategoria.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Sin resultados para &ldquo;{filter}&rdquo;</p>
          )}
          {porCategoria.map(([categoria, items]) => (
            <div key={categoria}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{categoria}</p>
              <div className="space-y-1">
                {items.map((item) => {
                  const checked = selected.includes(item.sku)
                  const disabled = !checked && selected.length >= limit
                  return (
                    <label
                      key={item.sku}
                      className={cn(
                        "flex items-start gap-3 rounded-md border px-3 py-2.5 cursor-pointer transition-colors",
                        checked ? "border-violet-500/40 bg-violet-500/5" : "hover:bg-muted/50",
                        disabled && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={disabled}
                        onCheckedChange={() => toggle(item.sku)}
                        className="mt-0.5"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="font-medium text-sm block">{item.nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.sku} · {fmt(item.precioArs)}/mes
                        </span>
                      </span>
                      {item.status === "beta" && (
                        <Badge variant="outline" className="text-[10px] shrink-0">Beta</Badge>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}