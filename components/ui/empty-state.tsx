"use client"

import * as React from "react"
import { LucideIcon, PackageOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/components/ui/empty"

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  className?: string
  children?: React.ReactNode
}

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <Empty
      className={cn(
        "bg-card/50 border border-dashed border-border/80 rounded-xl py-12 px-6 shadow-sm",
        className
      )}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon" className="h-14 w-14 rounded-2xl bg-primary/10 text-primary mb-3">
          <Icon className="h-7 w-7" />
        </EmptyMedia>
        <EmptyTitle className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </EmptyTitle>
        {description && (
          <EmptyDescription className="text-sm text-muted-foreground max-w-md mt-1">
            {description}
          </EmptyDescription>
        )}
      </EmptyHeader>

      {(actionLabel || secondaryActionLabel || children) && (
        <EmptyContent className="mt-2">
          {children}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {onSecondaryAction && secondaryActionLabel && (
              <Button variant="outline" size="sm" onClick={onSecondaryAction} className="min-h-[40px]">
                {secondaryActionLabel}
              </Button>
            )}
            {onAction && actionLabel && (
              <Button size="sm" onClick={onAction} className="min-h-[40px] shadow-sm">
                {actionLabel}
              </Button>
            )}
          </div>
        </EmptyContent>
      )}
    </Empty>
  )
}
