"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  Phone,
  Send,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { authFetch } from "@/lib/stores/auth-store"
import { useToast } from "@/hooks/use-toast"

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

export default function ServicesPreventivosPage() {
  const { toast } = useToast()
  const [trabajos, setTrabajos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function cargarTrabajos() {
    setLoading(true)
    try {
      const res = await authFetch("/api/oficios/trabajos?estado=FINALIZADO")
      if (res.ok) {
        const json = await res.json()
        setTrabajos(json.data || [])
      }
    } catch (e) {
      toast({ title: "Error al cargar services", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarTrabajos()
  }, [])

  function enviarWhatsAppService(t: any) {
    if (!t.cliente?.telefono) return
    const phone = t.cliente.telefono.replace(/\D/g, "")
    const msg = encodeURIComponent(
      `Hola ${t.cliente.nombre}, te saludamos de tu instalador de confianza. Ya pasaron varios meses desde el trabajo *${t.titulo}*. Te recordamos que recomendamos realizar el mantenimiento preventivo para asegurar la vida útil y garantía. ¿Querés que coordinemos una visita esta semana?`
    )
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank")
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/oficios">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <h1 className="text-2xl font-bold tracking-tight">Radar de Mantenimientos Preventivos</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Recordatorios automáticos a clientes a 6 y 12 meses para generar trabajo recurrente.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Cargando radar de services...</div>
      ) : trabajos.length === 0 ? (
        <Card className="border-dashed p-12 text-center space-y-3">
          <Wrench className="h-8 w-8 text-muted-foreground mx-auto" />
          <h3 className="text-base font-semibold">No hay trabajos finalizados para mantenimiento</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            A medida que completes obras y trabajos, aparecerán aquí para enviarles un recordatorio de service en 6 y 12 meses.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trabajos.map((t) => (
            <Card key={t.id} className="hover:border-amber-500/40 transition-all flex flex-col justify-between">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                    Finalizado
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(t.createdAt).toLocaleDateString("es-AR")}
                  </span>
                </div>
                <CardTitle className="text-base font-bold mt-1">{t.titulo}</CardTitle>
                <CardDescription className="text-xs">
                  Cliente: <strong className="text-foreground">{t.cliente?.nombre || "Particular"}</strong>
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 pt-0 space-y-3">
                <div className="pt-2 border-t flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Teléfono:</span>
                  <span className="font-semibold">{t.cliente?.telefono || "Sin teléfono"}</span>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => enviarWhatsAppService(t)}
                    disabled={!t.cliente?.telefono}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Enviar Recordatorio de Service por WA
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
