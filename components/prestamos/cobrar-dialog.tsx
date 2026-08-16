"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fmtArs } from "@/lib/prestamos/prestamos-meta"
import type { MedioCobro } from "@/lib/prestamos/prestamos-meta"

export interface CobrarDialogDeudor {
  id: number
  cliente: string
  total: number
  telefono?: string
}

interface CobrarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deudor: CobrarDialogDeudor | null
  submitting?: boolean
  onConfirm: (payload: { monto: number; medio: MedioCobro }) => void | Promise<void>
}

export function CobrarDialog({
  open,
  onOpenChange,
  deudor,
  submitting,
  onConfirm,
}: CobrarDialogProps) {
  const [monto, setMonto] = useState("")
  const [medio, setMedio] = useState<MedioCobro>("efectivo")

  useEffect(() => {
    if (open && deudor) {
      setMonto(String(Math.round(deudor.total)))
      setMedio("efectivo")
    }
  }, [open, deudor])

  if (!deudor) return null

  const montoNum = Math.round(Number(monto) || 0)
  const queda = Math.max(0, deudor.total - montoNum)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Cobrar a {deudor.cliente}</DialogTitle>
          <DialogDescription>
            Debe {fmtArs(deudor.total)}. Anotá lo que te dio (puede ser parcial).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="monto-cobro">¿Cuánto te pagó?</Label>
            <Input
              id="monto-cobro"
              type="number"
              inputMode="numeric"
              className="h-14 text-2xl font-bold"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              autoFocus
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setMonto(String(Math.round(deudor.total)))}>
                Todo
              </Button>
              {deudor.total > 1000 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setMonto(String(Math.round(deudor.total / 2)))}
                >
                  Mitad
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Medio</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={medio === "efectivo" ? "default" : "outline"}
                className="h-11"
                onClick={() => setMedio("efectivo")}
              >
                Efectivo
              </Button>
              <Button
                type="button"
                variant={medio === "transferencia" ? "default" : "outline"}
                className="h-11"
                onClick={() => setMedio("transferencia")}
              >
                Transferencia
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/40 p-3 text-sm">
            {montoNum <= 0 ? (
              <span className="text-muted-foreground">Ingresá un monto mayor a 0</span>
            ) : queda <= 0 ? (
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                Queda en cero — se salda
              </span>
            ) : (
              <span>
                Después del cobro queda debiendo{" "}
                <strong className="text-lg">{fmtArs(queda)}</strong>
              </span>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[8rem]"
            disabled={submitting || montoNum <= 0}
            onClick={() => void onConfirm({ monto: montoNum, medio })}
          >
            {submitting ? "Guardando…" : "Confirmar cobro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
