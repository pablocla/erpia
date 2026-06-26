"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { VarianteGrupo } from "@/lib/pos/pos-catalogo-grupos"

interface PosVariantePickerProps {
  grupo: VarianteGrupo | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (productoId: number) => void
}

export function PosVariantePicker({
  grupo,
  open,
  onOpenChange,
  onSelect,
}: PosVariantePickerProps) {
  if (!grupo) return null

  const fmt = (n: number) =>
    n.toLocaleString("es-AR", { minimumFractionDigits: 2 })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{grupo.nombreBase}</DialogTitle>
          <DialogDescription>Elegí talle, color o variante</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
          {grupo.variantes.map((v) => (
            <button
              key={v.id}
              type="button"
              disabled={v.stock <= 0}
              onClick={() => {
                onSelect(v.id)
                onOpenChange(false)
              }}
              className="border rounded-lg p-3 text-left hover:border-primary hover:bg-muted/50 disabled:opacity-40 transition-colors"
            >
              <p className="font-medium text-sm">{v.etiqueta}</p>
              <p className="text-xs text-muted-foreground">${fmt(v.precioVenta)}</p>
              <Badge variant="outline" className="mt-1 text-[10px]">
                Stock {v.stock}
              </Badge>
            </button>
          ))}
        </div>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
      </DialogContent>
    </Dialog>
  )
}