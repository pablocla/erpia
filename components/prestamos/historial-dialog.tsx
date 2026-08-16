"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { fmtArs, type CobroPrestamo } from "@/lib/prestamos/prestamos-meta"

interface HistorialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente: string
  saldo: number
  cobros: CobroPrestamo[]
  notas?: string
}

function formatFecha(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

export function HistorialDialog({
  open,
  onOpenChange,
  cliente,
  saldo,
  cobros,
  notas,
}: HistorialDialogProps) {
  const ordenados = [...cobros].reverse()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial — {cliente}</DialogTitle>
          <DialogDescription>
            Saldo actual: <strong>{fmtArs(saldo)}</strong>
            {notas ? ` · ${notas}` : ""}
          </DialogDescription>
        </DialogHeader>

        {ordenados.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Todavía no hay cobros registrados. Cuando cobres, aparecen acá.
          </p>
        ) : (
          <ul className="space-y-2">
            {ordenados.map((c, i) => (
              <li
                key={`${c.at}-${i}`}
                className="rounded-lg border px-3 py-2 flex justify-between gap-3 text-sm"
              >
                <div>
                  <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                    − {fmtArs(c.monto)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatFecha(c.at)}
                    {c.medio ? ` · ${c.medio}` : ""}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  quedó {fmtArs(c.saldoDespues)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
