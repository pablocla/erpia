"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { AppExperienceGuide } from "@/lib/comercial/app-experience"

interface AppExperienceHeaderProps {
  guide: AppExperienceGuide
  className?: string
  compact?: boolean
  onPrimaryClick?: () => void
}

export function AppExperienceHeader({
  guide,
  className,
  compact = false,
  onPrimaryClick,
}: AppExperienceHeaderProps) {
  const primary = guide.primaryAction

  return (
    <Card className={cn("border-primary/15 bg-gradient-to-br from-primary/5 to-transparent", className)}>
      <CardContent className={cn("space-y-4", compact ? "p-4" : "p-5 sm:p-6")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-xl" aria-hidden>
                {guide.emoji}
              </span>
              <span className="font-medium text-foreground">{guide.title}</span>
            </div>
            <p className="text-sm text-muted-foreground">{guide.subtitle}</p>
            {!compact && (
              <p className="flex items-start gap-1.5 text-xs text-primary/90 pt-1">
                <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {guide.wowMoment}
              </p>
            )}
          </div>
          {primary && (
            <div className="flex flex-wrap gap-2 shrink-0">
              {onPrimaryClick || primary.href.startsWith("#") ? (
                <Button size="sm" onClick={onPrimaryClick}>
                  {primary.label}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button size="sm" asChild>
                  <Link href={primary.href}>
                    {primary.label}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
              {guide.secondaryActions?.map((action) => (
                <Button key={action.href} size="sm" variant="outline" asChild>
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ))}
            </div>
          )}
        </div>

        <ol className="grid gap-2 sm:grid-cols-3">
          {guide.steps.map((step, i) => (
            <li
              key={step}
              className="flex gap-2 rounded-lg border bg-background/80 px-3 py-2 text-xs leading-snug"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}