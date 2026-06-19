"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { PauseCircle, RotateCcw, Clock, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  type VentaSuspendida,
  listarVentasSuspendidas,
  eliminarVentaSuspendida,
} from "@/lib/pos/ventas-suspendidas"

interface PosPendientesPanelProps {
  cajaOk: boolean | null
  onRecuperar: (venta: VentaSuspendida) => void
  onSuspender?: () => void
  puedeSuspender?: boolean
}

export function PosPendientesPanel({
  cajaOk,
  onRecuperar,
  onSuspender,
  puedeSuspender = false,
}: PosPendientesPanelProps) {
  const [suspendidas, setSuspendidas] = useState<VentaSuspendida[]>([])

  const refresh = useCallback(() => {
    setSuspendidas(listarVentasSuspendidas())
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 15_000)
    return () => clearInterval(interval)
  }, [refresh])

  const fmt = (n: number) =>
    n.toLocaleString("es-AR", { minimumFractionDigits: 2 })

  const fmtHora = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="border-b shrink-0 bg-muted/20">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold">Pendientes del turno</span>
          {suspendidas.length > 0 && (
            <Badge variant="secondary" className="h-5 text-[10px]">
              {suspendidas.length}
            </Badge>
          )}
        </div>
        {puedeSuspender && onSuspender && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] gap-1"
            onClick={() => {
              onSuspender()
              refresh()
            }}
          >
            <PauseCircle className="h-3 w-3" />
            Suspender
          </Button>
        )}
      </div>

      {cajaOk === false && (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-[10px] text-destructive">
          <Lock className="h-3 w-3 shrink-0" />
          <span>Caja cerrada —</span>
          <Link href="/dashboard/caja" className="underline font-medium">
            Abrir caja
          </Link>
        </div>
      )}

      {suspendidas.length > 0 ? (
        <ScrollArea className="max-h-28">
          <div className="px-3 pb-2 space-y-1">
            {suspendidas.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  onRecuperar(v)
                  eliminarVentaSuspendida(v.id)
                  refresh()
                }}
                className="w-full flex items-center justify-between gap-2 rounded-md border bg-background px-2 py-1.5 text-left hover:bg-muted/60 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-medium truncate">
                    {v.items.length} ítem(s) · ${fmt(v.total)}
                  </p>
                  <p className="text-[9px] text-muted-foreground">{fmtHora(v.createdAt)}</p>
                </div>
                <RotateCcw className="h-3 w-3 shrink-0 text-primary" />
              </button>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <p className="px-3 pb-2 text-[10px] text-muted-foreground">
          Sin ventas suspendidas
        </p>
      )}
    </div>
  )
}