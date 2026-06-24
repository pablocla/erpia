"use client"
import { Topbar } from "@/components/topbar"
import { MotionPage } from "@/components/ui/motion"
import { Button } from "@/components/ui/button"
import { TrendingUp, Link2 } from "lucide-react"

export default function ReventasPage() {
  return (
    <MotionPage className="flex h-full flex-col">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Productos Virales</h2>
            <p className="text-muted-foreground">Gestión de stock flash y márgenes</p>
          </div>
          <Button>
            <TrendingUp className="mr-2 h-4 w-4" /> Calcular Margen Flash
          </Button>
        </div>
        
        <div className="border rounded-md p-8 text-center text-muted-foreground">
          <Link2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p>Módulo en construcción. Aquí verás el control de stock efímero y podrás generar links de pago rápidamente.</p>
        </div>
      </div>
    </MotionPage>
  )
}
