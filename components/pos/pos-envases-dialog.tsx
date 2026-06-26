"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Package, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface TipoEnvase {
  id: number
  nombre: string
  valorDeposito: number
}

interface SaldoEnvase {
  tipoEnvaseId: number
  nombre: string
  saldo: number
  depositoPendiente: number
}

interface PosEnvasesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clienteId: number | null
  clienteNombre?: string
  authHeaders: () => HeadersInit
  onMovimiento?: () => void
}

export function PosEnvasesDialog({
  open,
  onOpenChange,
  clienteId,
  clienteNombre,
  authHeaders,
  onMovimiento,
}: PosEnvasesDialogProps) {
  const { toast } = useToast()
  const [tipos, setTipos] = useState<TipoEnvase[]>([])
  const [saldo, setSaldo] = useState<SaldoEnvase[]>([])
  const [loading, setLoading] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [tipoEnvaseId, setTipoEnvaseId] = useState<string>("")
  const [tipoMov, setTipoMov] = useState<"entrega" | "retorno">("entrega")
  const [cantidad, setCantidad] = useState(1)
  const [cobrarDeposito, setCobrarDeposito] = useState(true)

  const fmt = (n: number) =>
    n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [resTipos, resSaldo] = await Promise.all([
        fetch("/api/envases", { headers: authHeaders() }),
        clienteId
          ? fetch(`/api/pos/envases/saldo?clienteId=${clienteId}`, { headers: authHeaders() })
          : Promise.resolve(null),
      ])
      if (resTipos.ok) {
        const data = await resTipos.json()
        setTipos(data)
        if (data.length > 0 && !tipoEnvaseId) setTipoEnvaseId(String(data[0].id))
      }
      if (resSaldo?.ok) setSaldo(await resSaldo.json())
      else setSaldo([])
    } finally {
      setLoading(false)
    }
  }, [authHeaders, clienteId, tipoEnvaseId])

  useEffect(() => {
    if (open) void cargar()
  }, [open, cargar])

  const tipoSel = tipos.find((t) => t.id === Number(tipoEnvaseId))
  const montoDeposito = tipoSel ? tipoSel.valorDeposito * cantidad : 0

  const ejecutar = async () => {
    if (!tipoEnvaseId) return
    if (tipoMov === "entrega" && !clienteId) {
      toast({
        variant: "destructive",
        title: "Cliente requerido",
        description: "Seleccioná un cliente para prestar envases",
      })
      return
    }

    setProcesando(true)
    try {
      const res = await fetch("/api/pos/envases/movimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          tipoEnvaseId: Number(tipoEnvaseId),
          tipo: tipoMov,
          cantidad,
          clienteId: clienteId ?? undefined,
          cobrarDeposito,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error")

      toast({
        title: tipoMov === "entrega" ? "Envases prestados" : "Envases devueltos",
        description:
          cobrarDeposito && data.montoCaja > 0
            ? `${data.nombreEnvase} x${data.cantidad} · ${fmt(data.montoCaja)} en caja`
            : `${data.nombreEnvase} x${data.cantidad}`,
      })
      onMovimiento?.()
      await cargar()
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Envases",
        description: e instanceof Error ? e.message : "Error",
      })
    } finally {
      setProcesando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Envases de gaseosas
          </DialogTitle>
          <DialogDescription>
            Préstamo y devolución de cajones/botellas retornables
            {clienteNombre ? ` — ${clienteNombre}` : ""}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={tipoMov === "entrega" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setTipoMov("entrega")}
              >
                Prestar
              </Button>
              <Button
                type="button"
                variant={tipoMov === "retorno" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setTipoMov("retorno")}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Devolver
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Tipo de envase</Label>
              <Select value={tipoEnvaseId} onValueChange={setTipoEnvaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Elegí envase" />
                </SelectTrigger>
                <SelectContent>
                  {tipos.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.nombre} — dep. {fmt(t.valorDeposito)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Cantidad</Label>
              <Input
                type="number"
                min={1}
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={cobrarDeposito}
                onChange={(e) => setCobrarDeposito(e.target.checked)}
                className="rounded"
              />
              {tipoMov === "entrega" ? "Cobrar depósito en caja" : "Reintegrar depósito en caja"}
              {cobrarDeposito && montoDeposito > 0 && (
                <span className="text-muted-foreground">({fmt(montoDeposito)})</span>
              )}
            </label>

            {saldo.length > 0 && (
              <div className="rounded-md border p-2 text-xs space-y-1">
                <p className="font-medium">Saldo del cliente</p>
                {saldo.map((s) => (
                  <div key={s.tipoEnvaseId} className="flex justify-between">
                    <span>{s.nombre}</span>
                    <span>
                      {s.saldo} u. ({fmt(s.depositoPendiente)})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={() => void ejecutar()} disabled={procesando || !tipoEnvaseId}>
            {procesando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}