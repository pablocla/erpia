"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getIndustryTemplate } from "@/lib/comercial/industry-templates"
import { cn } from "@/lib/utils"

const FEATURED_PACKS = [
  { id: "almacen", label: "Fiado de barrio", hint: "Libreta + POS" },
  { id: "prestamista", label: "Préstamos", hint: "Cuotas y deudores" },
  { id: "consorcios_admin", label: "Consorcios", hint: "Expensas + avisos" },
  { id: "salon_belleza", label: "Turnos salón", hint: "Agenda + link web" },
  { id: "gimnasio", label: "Gimnasio", hint: "Membresías y morosos" },
  { id: "bar_restaurant", label: "Restó / bar", hint: "Mesas y comandas" },
] as const

interface DemoFeaturedPacksProps {
  onSelect: (industryId: string) => void
  loadingId?: string | null
  className?: string
}

export function DemoFeaturedPacks({ onSelect, loadingId, className }: DemoFeaturedPacksProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-medium text-white">Paquetes listos para probar</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURED_PACKS.map((pack) => {
          const template = getIndustryTemplate(pack.id)
          if (!template) return null
          const loading = loadingId === pack.id

          return (
            <button
              key={pack.id}
              type="button"
              disabled={!!loadingId}
              onClick={() => onSelect(pack.id)}
              className={cn(
                "group rounded-xl border border-white/15 bg-white/5 p-4 text-left transition hover:border-emerald-400/50 hover:bg-white/10 disabled:opacity-60",
                loading && "ring-1 ring-emerald-400",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl">{template.emoji}</span>
                <ArrowRight className="h-4 w-4 text-slate-500 opacity-0 transition group-hover:opacity-100" />
              </div>
              <p className="mt-2 font-semibold text-sm text-white">{pack.label}</p>
              <p className="text-xs text-slate-400">{pack.hint}</p>
              <p className="mt-2 text-[11px] text-emerald-300/90">
                {loading ? "Armando demo…" : template.wowMoment}
              </p>
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <span>O entrá directo:</span>
        {FEATURED_PACKS.slice(0, 4).map((pack) => (
          <Link
            key={pack.id}
            href={`/demo/${pack.id}`}
            className="text-slate-400 hover:text-white underline-offset-2 hover:underline"
          >
            {pack.label}
          </Link>
        ))}
      </div>
    </div>
  )
}