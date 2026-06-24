"use client"
import { Topbar } from "@/components/topbar"
import { MotionPage } from "@/components/ui/motion"
import { Button } from "@/components/ui/button"
import { Plus, Car } from "lucide-react"

export default function ConcesionariaPage() {
  return (
    <MotionPage className="flex h-full flex-col">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Flota y Vehículos</h2>
            <p className="text-muted-foreground">Inventario, tasaciones y estado general</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Ingresar Vehículo
          </Button>
        </div>
        
        <div className="border rounded-md p-8 text-center text-muted-foreground">
          <Car className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p>Módulo en construcción. Aquí verás la grilla de vehículos con fotos, precio y estado.</p>
        </div>
      </div>
    </MotionPage>
  )
}
