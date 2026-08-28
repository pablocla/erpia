"use client"

import Link from "next/link"
import { ArrowRight, Loader2 } from "lucide-react"
import { getIndustryTemplate } from "@/lib/comercial/industry-templates"
import { cn } from "@/lib/utils"

const FEATURED_PACKS = [
  { id: "oficios", label: "Oficios & Obras", hint: "Presupuestos 3 niveles + señas" },
  { id: "almacen", label: "Fiado de barrio", hint: "Libreta gratis" },
  { id: "prestamista", label: "Préstamos", hint: "Cuotas y deudores" },
  { id: "consorcios_admin", label: "Consorcios", hint: "Expensas + avisos" },
  { id: "salon_belleza", label: "Turnos salón", hint: "Agenda + link web" },
  { id: "gimnasio", label: "Gimnasio", hint: "Membresías y morosos" },
] as const

interface DemoFeaturedPacksProps {
  onSelect: (industryId: string) => void
  loadingId?: string | null
  className?: string
}

export function DemoFeaturedPacks({ onSelect, loadingId, className }: DemoFeaturedPacksProps) {
  const busy = !!loadingId

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-medium">Paquetes listos para probar</p>
      {busy && (
        <p className="text-xs text-[var(--landing-accent)]">
          Armando demo de <strong>{FEATURED_PACKS.find((p) => p.id === loadingId)?.label ?? "rubro"}</strong>
          … no cierres esta pantalla.
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURED_PACKS.map((pack) => {
          const template = getIndustryTemplate(pack.id)
          if (!template) return null
          const loading = loadingId === pack.id

          return (
            <button
              key={pack.id}
              type="button"
              disabled={busy}
              onClick={() => onSelect(pack.id)}
              className={cn(
                "group rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-left transition hover:border-[var(--landing-cta)]/50 hover:shadow-sm disabled:opacity-60",
                loading && "ring-1 ring-[var(--landing-accent)]",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl">{template.emoji}</span>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--landing-accent)]" />
                ) : (
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                )}
              </div>
              <p className="mt-2 text-sm font-semibold">{pack.label}</p>
              <p className="text-xs text-muted-foreground">{pack.hint}</p>
              <p className="mt-2 text-[11px] text-[var(--landing-accent)]">
                {loading ? "Armando demo…" : template.wowMoment}
              </p>
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>O entrá directo:</span>
        {FEATURED_PACKS.slice(0, 4).map((pack) =>
          busy ? (
            <span key={pack.id}>{pack.label}</span>
          ) : (
            <Link
              key={pack.id}
              href={`/demo/${pack.id}`}
              className="underline underline-offset-2 hover:text-foreground"
            >
              {pack.label}
            </Link>
          ),
        )}
      </div>
    </div>
  )
}
