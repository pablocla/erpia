"use client"

import {
  HOME_DOLOR_CHIPS,
  type HomeDolorSlug,
} from "@/lib/comercial/go-to-market-vitrine"
import { cn } from "@/lib/utils"

export function HeroDolorChips({
  active,
  onChange,
  className,
}: {
  active: HomeDolorSlug
  onChange: (slug: HomeDolorSlug) => void
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label="Elegí un producto"
      className={cn("mt-6 flex flex-wrap gap-2", className)}
    >
      <span className="sr-only">Elegí Fiado, Cobranza o Turnos</span>
      {HOME_DOLOR_CHIPS.map((chip) => {
        const pressed = active === chip.slug
        return (
          <button
            key={chip.slug}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(chip.slug)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
              pressed
                ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-100 shadow-sm shadow-emerald-900/30"
                : "border-white/15 bg-white/5 text-slate-300 hover:border-white/30 hover:bg-white/10 hover:text-white",
            )}
          >
            <span className="block leading-tight">{chip.label}</span>
            <span
              className={cn(
                "mt-0.5 block text-[11px] font-normal leading-tight",
                pressed ? "text-emerald-200/80" : "text-slate-500",
              )}
            >
              {chip.hint}
            </span>
          </button>
        )
      })}
    </div>
  )
}
