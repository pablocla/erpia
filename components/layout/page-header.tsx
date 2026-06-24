"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  badge?: ReactNode
  statusSlot?: ReactNode
  actions?: ReactNode
  variant?: "default" | "surface"
  className?: string
}

export function PageHeader({
  title,
  description,
  badge,
  statusSlot,
  actions,
  variant = "default",
  className,
}: PageHeaderProps) {
  const inner = (
    <>
      {badge && <div className="mb-2">{badge}</div>}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
      {description && (
        <p className="text-muted-foreground text-sm mt-1 max-w-2xl leading-relaxed">{description}</p>
      )}
    </>
  )

  if (variant === "surface") {
    return (
      <div
        className={cn(
          "dashboard-surface rounded-xl p-4 sm:p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between",
          className,
        )}
      >
        <div className="min-w-0">{inner}</div>
        {(statusSlot || actions) && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {statusSlot}
            {actions}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">{inner}</div>
      {(statusSlot || actions) && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {statusSlot}
          {actions}
        </div>
      )}
    </div>
  )
}