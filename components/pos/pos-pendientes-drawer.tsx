"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Wallet,
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
import { useToast } from "@/hooks/use-toast"
import {
  contarVentasSuspendidas,
  listarVentasSuspendidas,
} from "@/lib/pos/ventas-suspendidas"
import type { PrioridadPendiente } from "@/lib/pendientes/pendientes-service"

interface PendienteItem {
  id: string
  tipo: string
  titulo: string
  descripcion: string
  prioridad: PrioridadPendiente
  href?: string
  accion?: string
  origen: "sistema" | "manual"
}

interface PendientesResponse {
  total: number
  pendientes: PendienteItem[]
}

const PRIORIDAD_STYLES: Record<PrioridadPendiente, string> = {
  bloqueante: "border-destructive/50 bg-destructive/10",
  alta: "border-amber-500/50 bg-amber-500/10",
  media: "border-blue-500/40 bg-blue-500/5",
  baja: "border-border bg-muted/30",
}

const TIPO_ICON: Record<string, React.ElementType> = {
  caja: Wallet,
  fiscal: ShieldAlert,
  stock: AlertTriangle,
  picking: Clock,
  aprobacion: AlertTriangle,
  ventas: Clock,
  tarea: Bell,
}

interface PosPendientesDrawerProps {
  authHeaders: () => HeadersInit
  onRefreshStatus?: () => void
}

export function PosPendientesDrawer({
  authHeaders,
  onRefreshStatus,
}: PosPendientesDrawerProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reintentando, setReintentando] = useState(false)
  const [pendientes, setPendientes] = useState<PendienteItem[]>([])
  const [suspendidasCount, setSuspendidasCount] = useState(0)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/pendientes", { headers: authHeaders() })
      if (res.ok) {
        const data = (await res.json()) as PendientesResponse
        setPendientes(data.pendientes ?? [])
      }
      setSuspendidasCount(contarVentasSuspendidas())
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

  const reintentarCae = async () => {
    setReintentando(true)
    try {
      const res = await fetch("/api/afip/reintentar-cae", {
        method: "POST",
        headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Error AFIP",
          description: data.error ?? "No se pudo reintentar",
        })
        return
      }
      toast({
        title: "Sincronización AFIP",
        description: data.mensaje,
      })
      await cargar()
      onRefreshStatus?.()
    } catch {
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No se pudo contactar al servidor",
      })
    } finally {
      setReintentando(false)
    }
  }

  const totalBadge = pendientes.length + suspendidasCount

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5 relative"
        >
          <Bell className="h-3.5 w-3.5" />
          Pendientes
          {totalBadge > 0 && (
            <Badge
              variant="destructive"
              className="h-4 min-w-4 px-1 text-[10px] leading-none"
            >
              {totalBadge}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Pendientes del turno
          </SheetTitle>
          <SheetDescription>
            Alertas del sistema y ventas suspendidas en este equipo.
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center justify-between py-2">
          <span className="text-xs text-muted-foreground">
            {pendientes.length} del sistema
            {suspendidasCount > 0 && ` · ${suspendidasCount} suspendida(s) local`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
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
            {suspendidasCount > 0 && (
              <div className="rounded-lg border border-violet-500/40 bg-violet-500/5 p-3">
                <p className="text-sm font-medium">
                  {suspendidasCount} venta(s) suspendida(s)
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recuperalas desde el panel del carrito.
                </p>
                <ul className="mt-2 space-y-1">
                  {listarVentasSuspendidas().slice(0, 3).map((v) => (
                    <li key={v.id} className="text-[10px] text-muted-foreground">
                      {v.items.length} ítem(s) · $
                      {v.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {loading && pendientes.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : pendientes.length === 0 && suspendidasCount === 0 ? (
              <div className="flex flex-col items-center py-10 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
                <p className="text-sm font-medium">Todo al día</p>
                <p className="text-xs">No hay pendientes del turno</p>
              </div>
            ) : (
              pendientes.map((p) => {
                const Icon = TIPO_ICON[p.tipo] ?? AlertTriangle
                return (
                  <div
                    key={p.id}
                    className={`rounded-lg border p-3 ${PRIORIDAD_STYLES[p.prioridad]}`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{p.titulo}</p>
                        {p.descripcion && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.descripcion}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {p.id === "cae-pendiente" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 text-xs"
                              onClick={() => void reintentarCae()}
                              disabled={reintentando}
                            >
                              {reintentando ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <RefreshCw className="h-3 w-3 mr-1" />
                              )}
                              Reintentar CAE
                            </Button>
                          )}
                          {p.href && p.id !== "cae-pendiente" && (
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                            >
                              <Link href={p.href} onClick={() => setOpen(false)}>
                                {p.accion ?? "Ir"}
                              </Link>
                            </Button>
                          )}
                          {p.href && p.id === "cae-pendiente" && (
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                            >
                              <Link href={p.href} onClick={() => setOpen(false)}>
                                Ver facturas
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}