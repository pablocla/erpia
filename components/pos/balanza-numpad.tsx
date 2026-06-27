"use client"

import { useEffect, useState } from "react"
import { Scale, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { calcularPrecioPorPeso } from "@/lib/almacen-rosario/balanza-peso-service"
import { etiquetaUnidadVariable } from "@/lib/pos/producto-cantidad-variable"
import { cn } from "@/lib/utils"

export type BalanzaNumpadProducto = {
  id: number
  nombre: string
  precioVenta: number
  unidad?: string | null
}

type BalanzaNumpadProps = {
  producto: BalanzaNumpadProducto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (result: {
    producto: BalanzaNumpadProducto
    cantidad: number
    precioUnitario: number
    totalLinea: number
    descripcion: string
  }) => void
}

const TECLAS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", ".", "⌫"]

export function BalanzaNumpad({ producto, open, onOpenChange, onConfirm }: BalanzaNumpadProps) {
  const [valor, setValor] = useState("")

  useEffect(() => {
    if (open) setValor("")
  }, [open, producto?.id])

  if (!producto) return null

  const unidadLabel = etiquetaUnidadVariable(producto.unidad)
  const pesoKg = parseFloat(valor.replace(",", "."))
  const preview =
    Number.isFinite(pesoKg) && pesoKg > 0
      ? calcularPrecioPorPeso({ precioPorKg: producto.precioVenta, pesoKg })
      : null

  const fmt = (n: number) =>
    n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  function tecla(t: string) {
    if (t === "⌫") {
      setValor((v) => v.slice(0, -1))
      return
    }
    if (t === "." && valor.includes(".")) return
    if (valor.length >= 8) return
    setValor((v) => v + t)
  }

  function confirmar() {
    if (!preview) return
    onConfirm({
      producto,
      cantidad: preview.pesoKg,
      precioUnitario: preview.precioPorKg,
      totalLinea: preview.total,
      descripcion: `${producto.nombre} (${preview.descripcion})`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm gap-3 p-4">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Scale className="h-5 w-5 text-violet-500" />
            {producto.nombre}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Precio por {unidadLabel.slice(0, -1)}: ${fmt(producto.precioVenta)}
          </p>
        </DialogHeader>

        <div className="rounded-xl border bg-muted/30 p-4 text-center">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
            Cantidad ({unidadLabel})
          </p>
          <p className="text-3xl font-mono font-bold tabular-nums min-h-[2.5rem]">
            {valor || "0"}
          </p>
          {preview && (
            <p className="text-lg font-semibold text-primary mt-2">
              Total: ${fmt(preview.total)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {TECLAS.map((t) => (
            <Button
              key={t}
              type="button"
              variant={t === "⌫" ? "outline" : "secondary"}
              className={cn("h-14 text-xl font-semibold", t === "⌫" && "text-destructive")}
              onClick={() => tecla(t)}
            >
              {t === "⌫" ? <X className="h-5 w-5" /> : t}
            </Button>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="flex-1 h-12" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="flex-1 h-12 text-base font-bold"
            disabled={!preview}
            onClick={confirmar}
          >
            Agregar al carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}