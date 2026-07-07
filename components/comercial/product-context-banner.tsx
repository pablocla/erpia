"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { getActiveProductShell } from "@/lib/comercial/product-shell"
import { subSaasLandingHref } from "@/lib/comercial/sub-saas-catalog"
import { cn } from "@/lib/utils"

interface ProductContextBannerProps {
  modoLite: string
  productosSku?: Record<string, boolean> | null
  className?: string
}

export function ProductContextBanner({ modoLite, productosSku = null, className }: ProductContextBannerProps) {
  const shell = getActiveProductShell(modoLite, productosSku ?? null)
  if (!shell) return null

  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      role="status"
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">
            Estás usando <span className="text-primary">{shell.marca}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Menú reducido para este producto. Podés sumar módulos cuando los necesites.
          </p>
        </div>
      </div>
      <Link
        href={subSaasLandingHref(shell.slug)}
        className="inline-flex shrink-0 items-center text-xs font-medium text-primary hover:underline"
      >
        Ver qué incluye
        <ArrowRight className="ml-1 h-3.5 w-3.5" />
      </Link>
    </div>
  )
}