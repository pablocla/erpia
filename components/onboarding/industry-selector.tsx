"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import {
  INDUSTRY_GROUPS,
  listIndustriesByGroup,
  type IndustryGroup,
  type IndustryTemplate,
} from "@/lib/comercial/industry-templates"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface IndustrySelectorProps {
  onSelect: (industryId: string) => void
  loadingId?: string | null
  variant?: "grid" | "compact"
  className?: string
}

export function IndustrySelector({
  onSelect,
  loadingId = null,
  variant = "grid",
  className,
}: IndustrySelectorProps) {
  const [activeGroup, setActiveGroup] = useState<IndustryGroup | "all">("all")

  const industries = useMemo(() => {
    if (activeGroup === "all") {
      return listIndustriesByGroup().filter((t) => t.id !== "otro")
    }
    return listIndustriesByGroup(activeGroup)
  }, [activeGroup])

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={activeGroup === "all" ? "default" : "outline"}
          onClick={() => setActiveGroup("all")}
        >
          Todos
        </Button>
        {INDUSTRY_GROUPS.map((group) => (
          <Button
            key={group}
            size="sm"
            variant={activeGroup === group ? "default" : "outline"}
            onClick={() => setActiveGroup(group)}
          >
            {group}
          </Button>
        ))}
      </div>

      <div
        className={cn(
          variant === "grid"
            ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            : "flex flex-col gap-2",
        )}
      >
        {industries.map((industry) => (
          <IndustryCard
            key={industry.id}
            industry={industry}
            onSelect={onSelect}
            loading={loadingId === industry.id}
            compact={variant === "compact"}
          />
        ))}
      </div>
    </div>
  )
}

function IndustryCard({
  industry,
  onSelect,
  loading,
  compact,
}: {
  industry: IndustryTemplate
  onSelect: (id: string) => void
  loading: boolean
  compact: boolean
}) {
  const isGrow = industry.productLine === "clavergrow"

  return (
    <button
      type="button"
      onClick={() => onSelect(industry.id)}
      disabled={loading}
      className={cn(
        "group rounded-xl border text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60",
        compact ? "p-3" : "p-4",
        isGrow
          ? "border-emerald-200/80 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
          : "border-slate-200/80 hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20",
        industry.featured && "ring-1 ring-amber-400/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl" aria-hidden>
          {industry.emoji}
        </span>
        <div className="flex gap-1">
          {industry.featured && (
            <Badge variant="secondary" className="text-[10px]">
              Popular
            </Badge>
          )}
          {isGrow && (
            <Badge className="bg-emerald-600 text-[10px]">Clavergrow</Badge>
          )}
        </div>
      </div>
      <p className="mt-2 font-semibold text-sm">{industry.label}</p>
      {!compact && (
        <>
          <p className="mt-1 text-xs text-muted-foreground">{industry.tagline}</p>
          <p className="mt-2 text-[11px] text-muted-foreground/80 italic">
            {industry.wowMoment}
          </p>
        </>
      )}
      <p className="mt-3 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
        {loading ? "Armando tu demo…" : "Ver demo en 10 seg →"}
      </p>
    </button>
  )
}