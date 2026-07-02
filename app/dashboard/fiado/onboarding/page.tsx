"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, BookOpen, MessageCircle, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"

export default function FiadoOnboardingPage() {
  const router = useRouter()

  const handleFinishOnboarding = async () => {
    // Acá podríamos llamar a un API route (ej: /api/fiado/onboarding/complete)
    // que inyecte datos semilla (un cliente "Juan Fiado" de prueba).
    // Por ahora, simplemente avanzamos a la página principal.
    router.push("/dashboard/fiado")
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="max-w-2xl border-primary/20 shadow-xl bg-gradient-to-br from-background to-primary/5">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-gradient">
            Tu libreta digital ya está lista
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Sabé en todo momento quién te debe y cuánto. Sin cuaderno, sin perder plata con el fiado del barrio.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border p-4 bg-card/50">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">Cobro Inmediato</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Activá el fiado en tus clientes de confianza y enviales links de pago automáticos.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4 bg-card/50">
              <MessageCircle className="mt-0.5 h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">Notificaciones WhatsApp</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Enviá un comprobante al WhatsApp del cliente automáticamente tras cada compra.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4 bg-card/50">
              <Wallet className="mt-0.5 h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">Límites de Crédito</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Protegé tus finanzas bloqueando ventas cuando el cliente exceda su cupo asignado.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4 bg-card/50">
              <BookOpen className="mt-0.5 h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">Integrado al POS</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  El botón "Vender a Fiado" ya está desbloqueado en tu Punto de Venta.
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center pt-6">
          <Button size="lg" onClick={handleFinishOnboarding} className="w-full sm:w-auto px-8 gap-2">
            Ir a mi Libreta <CheckCircle2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
