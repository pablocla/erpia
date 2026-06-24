"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageToolbarProps {
  children?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageToolbar({ children, actions, className }: PageToolbarProps) {
  if (!children && !actions) return null

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-card/50 px-3 py-3 sm:px-4",
        className,
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-3 min-w-0 w-full">{children}</div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none [&>a]:flex-1 sm:[&>a]:flex-none">
          {actions}
        </div>
      )}
    </div>
  )
}