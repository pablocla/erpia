"use client"

import { cn } from "@/lib/utils"

interface MarketingBrowserChromeProps {
  url: string
  children: React.ReactNode
  glow?: "emerald" | "blue" | "violet" | "amber"
  className?: string
}

const GLOW = {
  emerald:
    "bg-[radial-gradient(ellipse_at_30%_20%,rgba(16,185,129,0.3),transparent_60%),radial-gradient(ellipse_at_75%_85%,rgba(37,99,235,0.2),transparent_55%)]",
  blue: "bg-[radial-gradient(ellipse_at_30%_20%,rgba(37,99,235,0.3),transparent_60%),radial-gradient(ellipse_at_75%_85%,rgba(16,185,129,0.2),transparent_55%)]",
  violet:
    "bg-[radial-gradient(ellipse_at_30%_20%,rgba(139,92,246,0.28),transparent_60%),radial-gradient(ellipse_at_75%_85%,rgba(37,99,235,0.2),transparent_55%)]",
  amber:
    "bg-[radial-gradient(ellipse_at_30%_20%,rgba(245,158,11,0.28),transparent_60%),radial-gradient(ellipse_at_75%_85%,rgba(234,88,12,0.18),transparent_55%)]",
} as const

export function MarketingBrowserChrome({
  url,
  children,
  glow = "emerald",
  className,
}: MarketingBrowserChromeProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <div
        className={cn("pointer-events-none absolute -inset-6 rounded-[2rem] blur-2xl", GLOW[glow])}
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200/80">
        <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/90 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" aria-hidden />
          <div className="mx-3 flex flex-1 items-center justify-center rounded-full bg-white px-3 py-1 text-[10px] text-slate-500 ring-1 ring-slate-200/80">
            {url}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}