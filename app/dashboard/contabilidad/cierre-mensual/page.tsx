"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, Calculator, TrendingUp, BookOpen, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/stores"

export default function CierreMensualPage() {
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const { toast } = useToast()

  const handleRunStep = async (currentStep: number, actionEndpoint: string) => {
    setIsProcessing(true)
    try {
      const res = await authFetch(`/api/contabilidad/cierre-mensual/${actionEndpoint}`, { method: "POST" })
      if (!res.ok) throw new Error("Fallo en la ejecución")
      
      setCompletedSteps(prev => [...prev, currentStep])
      if (currentStep < 3) setStep(currentStep + 1)
      
      toast({ title: "Completado", description: "Proceso ejecutado exitosamente." })
    } catch (error) {
      toast({ title: "Error", description: "Hubo un problema al ejecutar el proceso.", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const steps = [
    {
      id: 1,
      title: "Amortización de Activos Fijos",
      description: "Calcula la depreciación del mes de todos los activos fijos y genera el asiento contable correspondiente.",
      icon: <Calculator className="w-6 h-6 text-blue-500" />,
      endpoint: "amortizaciones"
    },
    {
      id: 2,
      title: "Diferencia de Cambio",
      description: "Revalúa saldos en moneda extranjera y ajusta las cuentas patrimoniales.",
      icon: <TrendingUp className="w-6 h-6 text-amber-500" />,
      endpoint: "diferencia-cambio"
    },
    {
      id: 3,
      title: "Refundición de Resultados",
      description: "Lleva las cuentas de resultados (ingresos y egresos) a cero y transfiere el neto a Resultado del Ejercicio.",
      icon: <BookOpen className="w-6 h-6 text-emerald-500" />,
      endpoint: "refundicion"
    }
  ]

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cierre de Ejercicio</h1>
          <p className="text-muted-foreground">Asistente para la ejecución de procesos contables de fin de período.</p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Atención</AlertTitle>
        <AlertDescription>
          Asegúrese de haber ingresado todas las compras y ventas del mes antes de ejecutar estos procesos. 
          Una vez ejecutada la refundición, el período quedará cerrado.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {steps.map((s) => {
          const isActive = step === s.id
          const isCompleted = completedSteps.includes(s.id)
          const isLocked = s.id > step && !completedSteps.includes(s.id - 1)

          return (
            <Card key={s.id} className={`${isActive ? "border-primary shadow-sm" : ""} ${isLocked ? "opacity-60" : ""}`}>
              <CardContent className="flex items-center p-6 gap-6">
                <div className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  ) : isActive ? (
                    <div className="relative">
                      <Circle className="w-8 h-8 text-primary animate-pulse" />
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">{s.id}</div>
                    </div>
                  ) : (
                    <Circle className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {s.icon}
                    <h3 className="font-semibold text-lg">{s.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">{s.description}</p>
                </div>

                <div className="shrink-0">
                  {isCompleted ? (
                    <Button variant="outline" disabled>Completado</Button>
                  ) : (
                    <Button 
                      onClick={() => handleRunStep(s.id, s.endpoint)} 
                      disabled={isLocked || isProcessing || isCompleted}
                    >
                      {isProcessing && isActive ? "Procesando..." : "Ejecutar Proceso"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {completedSteps.length === 3 && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="flex flex-col items-center p-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            <div>
              <h2 className="text-xl font-bold text-emerald-900">¡Cierre Contable Finalizado!</h2>
              <p className="text-emerald-700">Todos los asientos automáticos fueron generados correctamente. Ya puede emitir el Balance de Sumas y Saldos final.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
