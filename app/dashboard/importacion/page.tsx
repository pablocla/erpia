"use client"
import { Topbar } from "@/components/topbar"
import { MotionPage } from "@/components/ui/motion"
import { Button } from "@/components/ui/button"
import { Calculator, Ship } from "lucide-react"

export default function ImportacionPage() {
  return (
    <MotionPage className="flex h-full flex-col">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Costos de Importación</h2>
            <p className="text-muted-foreground">Landed cost y prorrateo de embarques</p>
          </div>
          <Button>
            <Calculator className="mr-2 h-4 w-4" /> Nueva Simulación
          </Button>
        </div>
        
        <div className="border rounded-md p-8 text-center text-muted-foreground">
          <Ship className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p>Módulo en construcción. Aquí verás la calculadora para pasar de FOB a CIF, prorrateando flete y gastos de despachante.</p>
        </div>
      </div>
    </MotionPage>
  )
}
