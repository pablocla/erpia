"use client"
import { Topbar } from "@/components/topbar"
import { MotionPage } from "@/components/ui/motion"
import { Button } from "@/components/ui/button"
import { Plus, Printer } from "lucide-react"

export default function PrestamosPage() {
  return (
    <MotionPage className="flex h-full flex-col">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Cartera Activa</h2>
            <p className="text-muted-foreground">Gestioná los préstamos y pagarés</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Préstamo
          </Button>
        </div>
        
        <div className="border rounded-md p-8 text-center text-muted-foreground">
          <p>Módulo en construcción. Aquí verás la tabla de deudores, cuotas y ruteo de cobranza.</p>
          <Button variant="outline" className="mt-4">
            <Printer className="mr-2 h-4 w-4" /> Imprimir Pagaré de Ejemplo
          </Button>
        </div>
      </div>
    </MotionPage>
  )
}
