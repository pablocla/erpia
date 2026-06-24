"use client"

import { cn } from "@/lib/utils"
import type { StatusVariant } from "@/lib/ui/status-map"

const STYLES: Record<StatusVariant, string> = {
  success:
    "bg-[var(--status-success-muted)] text-[var(--status-success-foreground)] border-[var(--status-success-border)]",
  warning:
    "bg-[var(--status-warning-muted)] text-[var(--status-warning-foreground)] border-[var(--status-warning-border)]",
  error:
    "bg-[var(--status-error-muted)] text-[var(--status-error-foreground)] border-[var(--status-error-border)]",
  info:
    "bg-[var(--status-info-muted)] text-[var(--status-info-foreground)] border-[var(--status-info-border)]",
  neutral:
    "bg-[var(--status-neutral-muted)] text-[var(--status-neutral-foreground)] border-[var(--status-neutral-border)]",
}

const DOT: Record<StatusVariant, string> = {
  success: "bg-[var(--status-success)]",
  warning: "bg-[var(--status-warning)]",
  error: "bg-[var(--status-error)]",
  info: "bg-[var(--status-info)]",
  neutral: "bg-[var(--status-neutral)]",
}

interface StatusBadgeProps {
  variant: StatusVariant
  label: string
  dot?: boolean
  className?: string
}

export function StatusBadge({ variant, label, dot = true, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        STYLES[variant],
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT[variant])} />}
      {label}
    </span>
  )
}