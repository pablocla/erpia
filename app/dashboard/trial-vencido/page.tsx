"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AlertTriangle, ArrowRight, CreditCard, LifeBuoy, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { authFetch, getAuthHeaders, useAuthStore } from "@/lib/stores"
import { useToast } from "@/hooks/use-toast"
import { fmtPrecioArs } from "@/lib/comercial/sub-saas-catalog"

export default function TrialVencidoPage() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const token = useAuthStore((s) => s.token)
  const [access, setAccess] = useState<{
    ofertaNombre?: string
    tieneAnclaGratis?: boolean
    precioUpgradeArs?: number
    ofertaLema?: string
  } | null>(null)

  useEffect(() => {
    if (!token) return
    fetch("/api/config/trial", { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAccess(data?.access ?? null))
      .catch(() => setAccess(null))
  }, [token])

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const res = await authFetch("/api/billing/create-subscription", { method: "POST" })
      const data = await res.json()
      if (res.ok && data.init_point) {
        window.location.href = data.init_point
      } else {
        toast({ title: "Error", description: data.error || "No se pudo iniciar el pago.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Ocurrió un error inesperado.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const tieneAncla = access?.tieneAnclaGratis
  const precio = access?.precioUpgradeArs ?? 0

  return (
    <div className="flex h-full min-h-[80vh] flex-col items-center justify-center p-4">
      <Card className="mx-auto max-w-md text-center shadow-lg">
        <CardHeader className="space-y-2">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {tieneAncla ? "Trial de módulos de pago finalizado" : "Período de prueba finalizado"}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {tieneAncla
              ? "Tu libreta fiado sigue activa sin costo. Para seguir usando caja, stock y facturación, activá el plan de POS."
              : "Tu acceso gratuito ha expirado. Para seguir usando todas las funciones sin interrupciones, elegí el plan que mejor se adapte a tu negocio."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {access?.ofertaLema && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-left flex gap-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{access.ofertaLema}</span>
            </div>
          )}
          <div className="rounded-xl border bg-muted/50 p-4 text-sm text-left">
            <h4 className="mb-2 font-medium">¿Qué pasa ahora?</h4>
            <ul className="space-y-2 text-muted-foreground">
              {tieneAncla ? (
                <>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                    <span>Seguís anotando fiado y viendo clientes.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                    <span>Caja, stock y ventas nuevas requieren suscripción.</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                    <span>No podrás crear nuevos registros ni realizar cobros/ventas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                    <span>Tus datos están a salvo y podrás seguir viéndolos.</span>
                  </li>
                </>
              )}
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <span>Podés regularizar tu cuenta activando una suscripción.</span>
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" size="lg" onClick={handleSubscribe} disabled={loading || precio <= 0}>
            <CreditCard className="mr-2 h-4 w-4" />
            {loading
              ? "Generando link..."
              : precio > 0
                ? `Suscribirse · ${fmtPrecioArs(precio)}/mes`
                : "Suscribirse con Mercado Pago"}
          </Button>
          {tieneAncla && (
            <Button asChild variant="secondary" className="w-full">
              <Link href="/dashboard/fiado">Volver a mi libreta</Link>
            </Button>
          )}
          <Button asChild variant="outline" className="w-full">
            <Link href="/claver/contacto">
              <LifeBuoy className="mr-2 h-4 w-4" />
              Contactar ventas
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}