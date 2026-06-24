"use client"

import type { ElementType, ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"

export interface KpiItem {
  label: string
  value: ReactNode
  hint?: string
  icon?: ElementType
  iconClassName?: string
  trend?: number
}

interface KpiStripProps {
  items: KpiItem[]
  columns?: 2 | 3 | 4
  className?: string
}

export function KpiStrip({ items, columns = 3, className }: KpiStripProps) {
  const grid =
    columns === 2
      ? "grid-cols-2"
      : columns === 4
        ? "grid-cols-2 lg:grid-cols-4"
        : "grid-cols-2 sm:grid-cols-3"

  return (
    <div className={cn("grid gap-3 sm:gap-4", grid, className)}>
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.label}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</p>
                {Icon && (
                  <Icon className={cn("h-4 w-4 shrink-0 text-muted-foreground", item.iconClassName)} />
                )}
              </div>
              <p className="kpi-number text-2xl font-bold mt-1">{item.value}</p>
              {(item.hint || item.trend !== undefined) && (
                <div className="flex items-center gap-2 mt-1">
                  {item.hint && <p className="text-xs text-muted-foreground">{item.hint}</p>}
                  {item.trend !== undefined && (
                    <span
                      className={cn(
                        "text-xs inline-flex items-center gap-0.5",
                        item.trend >= 0 ? "text-[var(--status-success)]" : "text-[var(--status-error)]",
                      )}
                    >
                      {item.trend >= 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {Math.abs(item.trend)}%
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}