"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, PackageMinus } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"

interface LineaDevolucion {
  lineaFacturaId: number
  descripcion: string
  cantidadDisponible: number
  precioUnitario: number
}

interface PosDevolucionDialogProps {
  facturaId: number | null
  numeroCompleto?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  authHeaders: () => HeadersInit
  onDevuelto?: () => void
}

export function PosDevolucionDialog({
  facturaId,
  numeroCompleto,
  open,
  onOpenChange,
  authHeaders,
  onDevuelto,
}: PosDevolucionDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [lineas, setLineas] = useState<LineaDevolucion[]>([])
  const [cantidades, setCantidades] = useState<Record<number, number>>({})

  const cargar = useCallback(async () => {
    if (!facturaId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/pos/devolucion?facturaId=${facturaId}`, {
        headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ variant: "destructive", title: "Error", description: data.error })
        return
      }
      setLineas(data.lineas ?? [])
      setCantidades({})
    } finally {
      setLoading(false)
    }
  }, [facturaId, authHeaders, toast])

  useEffect(() => {
    if (open && facturaId) void cargar()
  }, [open, facturaId, cargar])

  const fmt = (n: number) => n.toLocaleString("es-AR", { minimumFractionDigits: 2 })

  const ejecutar = async () => {
    if (!facturaId) return
    const lineasDevolver = Object.entries(cantidades)
      .filter(([, qty]) => qty > 0)
      .map(([id, cantidad]) => ({
        lineaFacturaId: Number(id),
        cantidad,
      }))
    if (!lineasDevolver.length) {
      toast({ variant: "destructive", title: "Elegí cantidades a devolver" })
      return
    }

    setProcesando(true)
    try {
      const res = await fetch("/api/pos/devolucion", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ facturaId, lineas: lineasDevolver }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ variant: "destructive", title: "No se pudo devolver", description: data.error })
        return
      }
      toast({
        title: "Devolución registrada",
        description: `NC ${data.numeroNC} — $${fmt(data.total)}`,
      })
      onOpenChange(false)
      onDevuelto?.()
    } finally {
      setProcesando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageMinus className="h-4 w-4" />
            Devolución parcial
          </DialogTitle>
          <DialogDescription>
            {numeroCompleto ?? "Seleccioná ítems y cantidades a devolver"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {lineas.map((l) => (
              <div key={l.lineaFacturaId} className="flex items-center gap-2 border rounded-lg p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{l.descripcion}</p>
                  <p className="text-xs text-muted-foreground">
                    Máx {l.cantidadDisponible} · ${fmt(l.precioUnitario)}
                  </p>
                </div>
                <div className="w-20">
                  <Label className="sr-only">Cantidad</Label>
                  <Input
                    type="number"
                    min={0}
                    max={l.cantidadDisponible}
                    step={1}
                    className="h-8 text-right"
                    value={cantidades[l.lineaFacturaId] ?? ""}
                    onChange={(e) => {
                      const v = Math.min(
                        l.cantidadDisponible,
                        Math.max(0, parseFloat(e.target.value) || 0),
                      )
                      setCantidades((prev) => ({ ...prev, [l.lineaFacturaId]: v }))
                    }}
                  />
                </div>
              </div>
            ))}
            {!lineas.length && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay ítems devolvibles
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={procesando || loading} onClick={() => void ejecutar()}>
            {procesando && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Confirmar devolución
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}