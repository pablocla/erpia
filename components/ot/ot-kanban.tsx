"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { OTCard } from "./ot-card"
import { Loader2 } from "lucide-react"
import { getAuthHeaders } from "@/lib/stores/auth-store"

type OT = any // Replace with proper type

const COLUMNS = [
  { id: "RECEPCION", label: "Recepción" },
  { id: "PRESUPUESTADO", label: "Presupuestado" },
  { id: "EN_PROCESO", label: "En Proceso" },
  { id: "FINALIZADO", label: "Finalizado" },
  { id: "ENTREGADO", label: "Entregado" },
]

export function OTKanban({ ots, onUpdate, isLoading }: { ots: OT[], onUpdate: () => void, isLoading?: boolean }) {
  const { toast } = useToast()
  const [movingId, setMovingId] = useState<number | null>(null)

  const handleMove = async (id: number, nuevoEstado: string) => {
    setMovingId(id)
    try {
      const res = await fetch(`/api/ot/${id}`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || "No se pudo cambiar el estado")
      }
      onUpdate()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive"
      })
    } finally {
      setMovingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] w-full gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const colOts = ots.filter((ot) => ot.estado === col.id)
        return (
          <div key={col.id} className="flex h-full w-80 min-w-80 flex-col rounded-xl border bg-muted/50 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="font-semibold">{col.label}</h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                {colOts.length}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
              {colOts.map((ot) => (
                <OTCard
                  key={ot.id}
                  ot={ot}
                  isMoving={movingId === ot.id}
                  onMove={(nuevoEstado) => handleMove(ot.id, nuevoEstado)}
                  onUpdate={onUpdate}
                />
              ))}
              {colOts.length === 0 && (
                <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                  Sin órdenes
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
