"use client"

import { useEffect, useMemo, useState } from "react"
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

export interface ClienteOption {
  id: number
  nombre: string
  telefono?: string | null
  saldo?: number
}

interface NuevoPrestamoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientes: ClienteOption[]
  submitting?: boolean
  defaultInteresPct?: number
  onConfirm: (payload: {
    cliente: string
    clienteId?: number
    capital: number
    interesPct: number
    fechaVencimiento: string
    telefono?: string
  }) => void | Promise<void>
}

function defaultVencePlus30(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

export function NuevoPrestamoDialog({
  open,
  onOpenChange,
  clientes,
  submitting,
  defaultInteresPct = 30,
  onConfirm,
}: NuevoPrestamoDialogProps) {
  const [cliente, setCliente] = useState("")
  const [clienteId, setClienteId] = useState<number | undefined>()
  const [capital, setCapital] = useState("50000")
  const [interesPct, setInteresPct] = useState(String(defaultInteresPct))
  const [fechaVencimiento, setFechaVencimiento] = useState(defaultVencePlus30())
  const [telefono, setTelefono] = useState("")
  const [showSuggest, setShowSuggest] = useState(false)

  useEffect(() => {
    if (open) {
      setCliente("")
      setClienteId(undefined)
      setCapital("50000")
      setInteresPct(String(defaultInteresPct))
      setFechaVencimiento(defaultVencePlus30())
      setTelefono("")
      setShowSuggest(false)
    }
  }, [open, defaultInteresPct])

  const capitalNum = Math.round(Number(capital) || 0)
  const pctNum = Number(interesPct) || 0
  const interes = Math.round((capitalNum * pctNum) / 100)
  const total = capitalNum + interes

  const suggestions = useMemo(() => {
    const q = cliente.trim().toLowerCase()
    if (q.length < 1) return clientes.slice(0, 8)
    return clientes.filter((c) => c.nombre.toLowerCase().includes(q)).slice(0, 8)
  }, [cliente, clientes])

  const pickCliente = (c: ClienteOption) => {
    setCliente(c.nombre)
    setClienteId(c.id)
    if (c.telefono) setTelefono(c.telefono)
    setShowSuggest(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Nuevo préstamo</DialogTitle>
          <DialogDescription>
            Anotá a quién le prestás, cuánto, el % y cuándo cobrás. Si ya existe el nombre, se suma a su deuda.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2 relative">
            <Label htmlFor="np-cliente">Deudor (apodo o nombre)</Label>
            <Input
              id="np-cliente"
              value={cliente}
              onChange={(e) => {
                setCliente(e.target.value)
                setClienteId(undefined)
                setShowSuggest(true)
              }}
              onFocus={() => setShowSuggest(true)}
              placeholder="Ej: Aldo, Máquina #3"
              autoComplete="off"
              required
            />
            {showSuggest && suggestions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-lg border bg-popover shadow-md max-h-40 overflow-y-auto">
                {suggestions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex justify-between gap-2"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickCliente(c)}
                  >
                    <span className="font-medium">{c.nombre}</span>
                    {(c.saldo ?? 0) > 0 && (
                      <span className="text-xs text-muted-foreground">debe {fmtArs(c.saldo ?? 0)}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-tel">WhatsApp (opcional)</Label>
            <Input
              id="np-tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="11 2345-6789"
              inputMode="tel"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="np-cap">Capital prestado</Label>
              <Input
                id="np-cap"
                type="number"
                inputMode="numeric"
                className="h-12 text-lg font-bold"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="np-pct">Interés %</Label>
              <Input
                id="np-pct"
                type="number"
                inputMode="decimal"
                className="h-12 text-lg font-bold"
                value={interesPct}
                onChange={(e) => setInteresPct(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-vence">¿Cuándo cobrás? (vencimiento)</Label>
            <Input
              id="np-vence"
              type="date"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 p-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Interés</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{fmtArs(interes)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tiene que devolver</p>
              <p className="text-lg font-bold text-foreground">{fmtArs(total)}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={submitting || !cliente.trim() || capitalNum <= 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() =>
              void onConfirm({
                cliente: cliente.trim(),
                clienteId,
                capital: capitalNum,
                interesPct: pctNum,
                fechaVencimiento,
                telefono: telefono.trim() || undefined,
              })
            }
          >
            {submitting ? "Guardando…" : "Confirmar préstamo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
