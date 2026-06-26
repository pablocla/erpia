"use client"

import type { LucideIcon } from "lucide-react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CloudPageHeaderProps {
  icon?: LucideIcon
  eyebrow?: string
  title: string
  description?: string
  badge?: string
  onRefresh?: () => void
  loading?: boolean
  actions?: React.ReactNode
  className?: string
}

export function CloudPageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  badge,
  onRefresh,
  loading,
  actions,
  className,
}: CloudPageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="space-y-1 min-w-0">
        {(Icon || eyebrow) && (
          <div className="flex items-center gap-2 text-violet-400 mb-1">
            {Icon && <Icon className="h-5 w-5" />}
            {eyebrow && <span className="text-sm font-medium">{eyebrow}</span>}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-[var(--font-fraunces)]">
            {title}
          </h1>
          {badge && (
            <Badge variant="outline" className="bg-violet-500/10 text-violet-300 border-violet-500/30">
              {badge}
            </Badge>
          )}
        </div>
        {description && <p className="text-muted-foreground text-sm sm:text-base">{description}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Actualizar
          </Button>
        )}
        {actions}
      </div>
    </div>
  )
}