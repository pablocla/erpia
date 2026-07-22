"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserCheck, KeyRound, AlertCircle } from "lucide-react"

interface QuickPINDialogProps {
  currentCashierName?: string
  onSwitchCashier?: (pin: string) => Promise<boolean>
  triggerClassName?: string
}

export function QuickPINDialog({
  currentCashierName = "Cajero Actual",
  onSwitchCashier,
  triggerClassName,
}: QuickPINDialogProps) {
  const [open, setOpen] = useState(false)
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit)
      setError(null)
    }
  }

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1))
    setError(null)
  }

  const handleClear = () => {
    setPin("")
    setError(null)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (pin.length !== 4) {
      setError("El PIN debe ser de 4 dígitos")
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (onSwitchCashier) {
        const success = await onSwitchCashier(pin)
        if (success) {
          setOpen(false)
          setPin("")
        } else {
          setError("PIN incorrecto o usuario no autorizado")
        }
      } else {
        // Fallback demo behavior
        setOpen(false)
        setPin("")
      }
    } catch {
      setError("Error al validar el PIN")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={triggerClassName ?? "h-8 gap-1.5 text-xs border-dashed"}
        >
          <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span className="truncate max-w-[120px]">{currentCashierName}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[360px] p-5 text-center">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Cambio Rápido de Cajero
          </DialogTitle>
          <DialogDescription className="text-center text-xs">
            Ingresa tu PIN de 4 dígitos para atender en la caja activa
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          <div className="flex justify-center gap-3 my-2">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="h-10 w-10 rounded-lg border-2 flex items-center justify-center text-lg font-mono font-bold bg-muted/30"
              >
                {pin[index] ? "•" : ""}
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-destructive bg-destructive/10 p-2 rounded-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Touch Numpad */}
          <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto pt-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <Button
                key={num}
                type="button"
                variant="outline"
                size="lg"
                className="h-12 text-lg font-semibold"
                onClick={() => handleDigit(num)}
              >
                {num}
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="h-12 text-xs font-medium text-muted-foreground"
              onClick={handleClear}
            >
              C
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-12 text-lg font-semibold"
              onClick={() => handleDigit("0")}
            >
              0
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="h-12 text-xs font-medium text-muted-foreground"
              onClick={handleDelete}
            >
              ⌫
            </Button>
          </div>

          <Button
            type="submit"
            className="w-full mt-4"
            disabled={pin.length !== 4 || loading}
          >
            {loading ? "Validando..." : "Ingresar a Caja"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
