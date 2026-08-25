"use client"

import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { PageShell, PageHeader } from "@/components/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Key, DoorOpen, CalendarCheck } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface Habitacion {
  id: number
  numero: string
  tipo: string
  estado: string
  tarifaBase: number
}

export default function HoteleriaPMS() {
  const { data: habitaciones, isLoading, mutate } = useAuthFetch<Habitacion[]>("/api/hoteleria")
  const [loadingKey, setLoadingKey] = useState<number | null>(null)

  const handleEmitirLlave = async (habId: number) => {
    setLoadingKey(habId)
    try {
      const res = await authFetch("/api/hoteleria/llaves", {
        method: "POST",
        body: JSON.stringify({ action: "emitir", habitacionId: habId })
      })

      if (res.ok) {
        const { pinCode } = await res.json()
        toast.success(`Llave digital emitida: PIN ${pinCode}`)
      } else {
        const err = await res.json()
        toast.error(`Error: ${err.error}`)
      }
    } catch (e: any) {
      toast.error("Ocurrió un error de red")
    } finally {
      setLoadingKey(null)
    }
  }

  return (
    <PageShell
      title="Front-Desk & Reservas"
      description="Property Management System (PMS) integrado con Cerraduras IoT."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
        {isLoading && <p>Cargando habitaciones...</p>}
        {habitaciones?.map((hab) => (
          <div key={hab.id} className="border border-border/50 bg-card rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold tracking-tight font-display">{hab.numero}</h3>
                <p className="text-sm text-muted-foreground">{hab.tipo}</p>
              </div>
              <Badge variant={hab.estado === "Ocupada" ? "default" : hab.estado === "Disponible" ? "outline" : "secondary"}>
                {hab.estado}
              </Badge>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-border/30">
              <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                <CalendarCheck className="w-4 h-4 mr-2" />
                Ver Reservas
              </Button>

              <Button 
                variant="secondary" 
                className="w-full justify-start text-sm" 
                size="sm"
                onClick={() => handleEmitirLlave(hab.id)}
                disabled={loadingKey === hab.id}
              >
                <Key className="w-4 h-4 mr-2" />
                {loadingKey === hab.id ? "Emitiendo PIN..." : "Generar Llave PIN (IoT)"}
              </Button>

              <Button variant="ghost" className="w-full justify-start text-sm" size="sm">
                <DoorOpen className="w-4 h-4 mr-2" />
                Check-Out
              </Button>
            </div>
          </div>
        ))}
        {habitaciones?.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
            No hay habitaciones configuradas en este momento.
          </div>
        )}
      </div>
    </PageShell>
  )
}
