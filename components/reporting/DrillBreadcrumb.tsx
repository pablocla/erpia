"use client"

import { ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type DrillFilter = {
  campo: string
  etiqueta: string
  valor: string | number
}

export function DrillBreadcrumb({
  stack,
  onNavigate,
  onClear,
  className,
}: {
  stack: DrillFilter[]
  onNavigate: (index: number) => void
  onClear: () => void
  className?: string
}) {
  if (stack.length === 0) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-1 text-xs", className)}>
      <span className="text-muted-foreground shrink-0">Drill:</span>
      {stack.map((d, i) => (
        <span key={`${d.campo}-${i}`} className="inline-flex items-center gap-0.5">
          {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          <button
            type="button"
            className="rounded-md bg-primary/10 px-2 py-0.5 hover:bg-primary/20 transition-colors"
            onClick={() => onNavigate(i)}
            title="Volver a este nivel"
          >
            <span className="text-muted-foreground">{d.etiqueta}</span>
            <span className="mx-1 text-muted-foreground">=</span>
            <span className="font-medium">{String(d.valor)}</span>
          </button>
        </span>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 px-1.5 text-[10px] text-muted-foreground"
        onClick={onClear}
      >
        <X className="h-3 w-3 mr-0.5" />
        Limpiar
      </Button>
    </div>
  )
}