"use client"

import { useDashboardBiStore } from "@/lib/stores/dashboard-bi-store"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

export function GlobalSlicers() {
  const { globalDesde, globalHasta, setGlobalDesde, setGlobalHasta, crossFilters, removeCrossFilter } = useDashboardBiStore()

  return (
    <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-lg border mb-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="global-desde" className="text-xs font-medium text-muted-foreground">Desde</Label>
        <Input 
          id="global-desde"
          type="date" 
          value={globalDesde ?? ""} 
          onChange={(e) => setGlobalDesde(e.target.value || null)}
          className="h-8 text-xs w-32"
        />
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="global-hasta" className="text-xs font-medium text-muted-foreground">Hasta</Label>
        <Input 
          id="global-hasta"
          type="date" 
          value={globalHasta ?? ""} 
          onChange={(e) => setGlobalHasta(e.target.value || null)}
          className="h-8 text-xs w-32"
        />
      </div>
      
      {/* Slicer Sucursal (Futuro) */}
      <div className="flex-1 flex gap-2 items-center px-4 overflow-x-auto">
        {crossFilters.map((f) => (
          <Badge key={f.campo} variant="secondary" className="flex items-center gap-1 text-[10px] whitespace-nowrap">
            <span className="opacity-70">{f.etiqueta}:</span> {f.valor}
            <button onClick={() => removeCrossFilter(f.campo)} className="ml-1 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold shrink-0">
        Global Dash Filters
      </div>
    </div>
  )
}
