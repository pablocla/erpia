"use client"

import { BarChart3, Grid3X3, Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ReportVista = "plano" | "pivot" | "grafico"

const VISTAS: { id: ReportVista; label: string; icon: React.ElementType }[] = [
  { id: "plano", label: "Tabla", icon: Table2 },
  { id: "pivot", label: "Pivot", icon: Grid3X3 },
  { id: "grafico", label: "Gráfico", icon: BarChart3 },
]

export function ViewToggle({
  value,
  onChange,
}: {
  value: ReportVista
  onChange: (v: ReportVista) => void
}) {
  return (
    <div className="inline-flex rounded-lg border p-0.5 bg-muted/30">
      {VISTAS.map((v) => (
        <Button
          key={v.id}
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 gap-1.5 rounded-md",
            value === v.id && "bg-background shadow-sm",
          )}
          onClick={() => onChange(v.id)}
        >
          <v.icon className="h-3.5 w-3.5" />
          {v.label}
        </Button>
      ))}
    </div>
  )
}