"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { PosAfipStatus } from "@/lib/pos/pos-afip-status"
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react"

const STYLES = {
  ok: {
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    icon: ShieldCheck,
  },
  atencion: {
    className: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
    icon: ShieldAlert,
  },
  error: {
    className: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
    icon: Shield,
  },
} as const

interface AfipStatusBadgeProps {
  status: PosAfipStatus | null
  className?: string
  showLink?: boolean
  compact?: boolean
}

export function AfipStatusBadge({
  status,
  className,
  showLink = true,
  compact = false,
}: AfipStatusBadgeProps) {
  if (!status) return null

  const style = STYLES[status.semaforo]
  const Icon = style.icon

  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        style.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {!compact && <span>AFIP · {status.label}</span>}
      {compact && <span>{status.label}</span>}
    </span>
  )

  if (showLink && status.semaforo !== "ok") {
    return (
      <Link href="/dashboard/configuracion?seccion=afip" className="hover:opacity-90 transition-opacity">
        {badge}
      </Link>
    )
  }

  return badge
}