"use client"

import { useCallback, useEffect, useState } from "react"
import {
  History,
  Loader2,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { PosDevolucionDialog } from "@/components/pos/pos-devolucion-dialog"

interface VentaHoy {
  facturaId: number
  numeroCompleto: string
  total: number
  estado: string
  hora: string
  medios: string[]
  anulable: boolean
}

interface PosVentasHoyDrawerProps {
  authHeaders: () => HeadersInit
  onAnulada?: () => void
}

export function PosVentasHoyDrawer({
  authHeaders,
  onAnulada,
}: PosVentasHoyDrawerProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [anulando, setAnulando] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [facturaAnular, setFacturaAnular] = useState<VentaHoy | null>(null)
  const [devolucionOpen, setDevolucionOpen] = useState(false)
  const [facturaDevolver, setFacturaDevolver] = useState<VentaHoy | null>(null)
  const [ventas, setVentas] = useState<VentaHoy[]>([])

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/pos/ventas-hoy", { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setVentas(data.ventas ?? [])
      }
    } catch {
      /* silencioso */
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => {
    void cargar()
    const interval = setInterval(() => void cargar(), 60_000)
    return () => clearInterval(interval)
  }, [cargar])

  useEffect(() => {
    if (open) void cargar()
  }, [open, cargar])

  const fmt = (n: number) =>
    n.toLocaleString("es-AR", { minimumFractionDigits: 2 })

  const fmtHora = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    })

  const pedirAnular = (venta: VentaHoy) => {
    setFacturaAnular(venta)
    setConfirmOpen(true)
  }

  const ejecutarAnular = async (ultima = false) => {
    setAnulando(true)
    try {
      const res = await fetch("/api/pos/anular-venta", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(
          ultima
            ? { ultima: true }
            : { facturaId: facturaAnular?.facturaId }
        ),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "No se pudo anular",
          description: data.error ?? "Error desconocido",
        })
        return
      }
      toast({
        title: "Venta anulada",
        description: `NC ${data.numeroNC} — $${fmt(data.total)}`,
      })
      setConfirmOpen(false)
      setFacturaAnular(null)
      await cargar()
      onAnulada?.()
    } catch {
      toast({
        variant: "destructive",
        title: "Error de conexión",
      })
    } finally {
      setAnulando(false)
    }
  }

  const ultimaAnulable = ventas.find((v) => v.anulable)

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ventas hoy</span>
            {ventas.length > 0 && (
              <Badge variant="secondary" className="h-4 text-[10px] px-1">
                {ventas.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Ventas del día
            </SheetTitle>
            <SheetDescription>
              Historial del turno. Podés anular la última venta con nota de crédito.
            </SheetDescription>
          </SheetHeader>

          <div className="flex items-center justify-between py-2 gap-2">
            {ultimaAnulable ? (
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs"
                onClick={() => {
                  setFacturaAnular(ultimaAnulable)
                  setConfirmOpen(true)
                }}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Anular última
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">Sin ventas anulables</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={() => void cargar()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>

          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-2 pb-4">
              {loading && ventas.length === 0 ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : ventas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  Todavía no hay ventas hoy
                </p>
              ) : (
                ventas.map((v) => (
                  <div
                    key={v.facturaId}
                    className="rounded-lg border p-3 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{v.numeroCompleto}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtHora(v.hora)} · ${fmt(v.total)} · {v.medios.join(", ")}
                      </p>
                      {v.estado === "anulada" && (
                        <Badge variant="outline" className="mt-1 text-[10px] h-4">
                          Anulada
                        </Badge>
                      )}
                    </div>
                    {v.anulable && (
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px]"
                          onClick={() => {
                            setFacturaDevolver(v)
                            setDevolucionOpen(true)
                          }}
                        >
                          Devolver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px]"
                          onClick={() => pedirAnular(v)}
                        >
                          Anular
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <PosDevolucionDialog
        facturaId={facturaDevolver?.facturaId ?? null}
        numeroCompleto={facturaDevolver?.numeroCompleto}
        open={devolucionOpen}
        onOpenChange={setDevolucionOpen}
        authHeaders={authHeaders}
        onDevuelto={() => {
          void cargar()
          onAnulada?.()
        }}
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              ¿Anular venta?
            </DialogTitle>
            <DialogDescription>
              Se emitirá una nota de crédito y se revertirá el movimiento de caja.
              {facturaAnular && (
                <span className="block mt-2 font-medium text-foreground">
                  {facturaAnular.numeroCompleto} — ${fmt(facturaAnular.total)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={anulando}
              onClick={() => void ejecutarAnular(false)}
            >
              {anulando ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Confirmar anulación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}