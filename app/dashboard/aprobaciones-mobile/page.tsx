"use client"

/**
 * Mobile Approvals — Approve/reject pending items from the phone.
 * Supports: OrdenCompra, OrdenPago, NotaCredito, AjusteStock, Gastos.
 * Designed for touch-first interaction with swipe gestures.
 */

import { useState, useCallback } from "react"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { useToast } from "@/hooks/use-toast"
import { Check, X, ChevronRight, Clock, AlertTriangle, ShoppingCart, CreditCard, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface Aprobacion {
  id: number
  entidad: string
  entidadId: number
  monto?: number
  descripcion?: string
  solicitante?: string
  fechaSolicitud: string
  nivelActual: number
  estado: string
}

const ENTITY_CONFIG: Record<string, { icon: typeof ShoppingCart; label: string; color: string }> = {
  OrdenCompra: { icon: ShoppingCart, label: "Orden de Compra", color: "text-purple-500" },
  OrdenPago: { icon: CreditCard, label: "Orden de Pago", color: "text-green-500" },
  NotaCredito: { icon: FileText, label: "Nota de Crédito", color: "text-red-500" },
  default: { icon: AlertTriangle, label: "Solicitud", color: "text-yellow-500" },
}

export default function AprobacionesMobilePage() {
  const { data, isLoading, mutate } = useAuthFetch<{ data: Aprobacion[] }>("/api/aprobaciones?estado=pendiente")
  const { toast } = useToast()
  const [procesando, setProcesando] = useState<number | null>(null)

  const pendientes = data?.data ?? []

  const handleAction = useCallback(async (id: number, accion: "aprobar" | "rechazar", comentario?: string) => {
    setProcesando(id)
    try {
      const res = await authFetch(`/api/aprobaciones/${id}/${accion}`, {
        method: "POST",
        body: JSON.stringify({ comentario }),
      })
      if (res.ok) {
        toast({ title: accion === "aprobar" ? "Aprobado" : "Rechazado", description: `Solicitud #${id} ${accion === "aprobar" ? "aprobada" : "rechazada"}` })
        mutate()
      } else {
        const err = await res.json().catch(() => ({}))
        toast({ title: "Error", description: err.error ?? "No se pudo procesar", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error de red", description: "Reintentá en unos segundos", variant: "destructive" })
    } finally {
      setProcesando(null)
    }
  }, [mutate, toast])

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b px-4 py-3">
        <h1 className="text-lg font-bold">Aprobaciones pendientes</h1>
        <p className="text-sm text-muted-foreground">{pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""}</p>
      </div>

      {/* List */}
      <div className="divide-y">
        {isLoading && (
          <div className="p-8 text-center text-muted-foreground">Cargando...</div>
        )}

        {!isLoading && pendientes.length === 0 && (
          <div className="p-12 text-center">
            <Check className="mx-auto h-12 w-12 text-green-500 mb-3" />
            <p className="text-lg font-medium">Todo al día</p>
            <p className="text-sm text-muted-foreground">No hay aprobaciones pendientes</p>
          </div>
        )}

        {pendientes.map((item) => {
          const config = ENTITY_CONFIG[item.entidad] ?? ENTITY_CONFIG.default
          const Icon = config.icon
          const isProcessing = procesando === item.id

          return (
            <div key={item.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className={cn("mt-0.5 p-2 rounded-lg bg-muted", config.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{config.label}</span>
                    <span className="text-xs text-muted-foreground">#{item.entidadId}</span>
                  </div>
                  {item.descripcion && (
                    <p className="text-sm text-muted-foreground truncate">{item.descripcion}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(item.fechaSolicitud).toLocaleDateString("es-AR")}
                    </span>
                    {item.monto != null && (
                      <span className="font-medium text-foreground">
                        ${Number(item.monto).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </span>
                    )}
                    {item.solicitante && <span>{item.solicitante}</span>}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground mt-2 shrink-0" />
              </div>

              {/* Action buttons — touch-optimized 48px height */}
              <div className="flex gap-2 mt-3 ml-12">
                <button
                  disabled={isProcessing}
                  onClick={() => handleAction(item.id, "aprobar")}
                  className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-lg bg-green-600 text-white font-medium text-sm active:scale-95 transition-transform disabled:opacity-50 touch-manipulation"
                >
                  <Check className="h-4 w-4" />
                  Aprobar
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => handleAction(item.id, "rechazar")}
                  className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-lg bg-red-600 text-white font-medium text-sm active:scale-95 transition-transform disabled:opacity-50 touch-manipulation"
                >
                  <X className="h-4 w-4" />
                  Rechazar
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
