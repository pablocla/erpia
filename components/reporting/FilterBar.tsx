"use client"

import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ReportFilter } from "@/lib/reporting/semantic/types"

export type FilterDraft = ReportFilter

export function FilterBar({
  filtros,
  camposFecha,
  onChange,
}: {
  filtros: FilterDraft[]
  camposFecha: { campo: string; etiqueta: string }[]
  onChange: (f: FilterDraft[]) => void
}) {
  function addFilter() {
    const campo = camposFecha[0]?.campo ?? "desde"
    onChange([...filtros, { campo, op: "gte", valor: "" }])
  }

  function update(i: number, patch: Partial<FilterDraft>) {
    onChange(filtros.map((f, idx) => (idx === i ? { ...f, ...patch } : f)))
  }

  function remove(i: number) {
    onChange(filtros.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Filtros</p>
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addFilter}>
          <Plus className="h-3 w-3 mr-1" />
          Agregar
        </Button>
      </div>
      {filtros.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin filtros activos.</p>
      ) : (
        <div className="space-y-2">
          {filtros.map((f, i) => (
            <div key={i} className="flex flex-wrap gap-2 items-center">
              <Select value={f.campo} onValueChange={(v) => update(i, { campo: v })}>
                <SelectTrigger className="h-8 w-[120px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {camposFecha.map((c) => (
                    <SelectItem key={c.campo} value={c.campo}>{c.etiqueta}</SelectItem>
                  ))}
                  <SelectItem value="estado">Estado</SelectItem>
                  <SelectItem value="cliente">Cliente contiene</SelectItem>
                </SelectContent>
              </Select>
              <Select value={f.op} onValueChange={(v) => update(i, { op: v as FilterDraft["op"] })}>
                <SelectTrigger className="h-8 w-[90px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gte">≥</SelectItem>
                  <SelectItem value="lte">≤</SelectItem>
                  <SelectItem value="eq">=</SelectItem>
                  <SelectItem value="contains">contiene</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className="h-8 w-[140px] text-xs"
                type={f.campo === "desde" || f.campo === "hasta" || f.campo === "fecha" ? "date" : "text"}
                value={String(f.valor ?? "")}
                onChange={(e) => update(i, { valor: e.target.value })}
                placeholder="Valor"
              />
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(i)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}