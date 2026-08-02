"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { authFetch } from "@/lib/stores/auth-store"
import { PageShell, PageHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bug, CheckCircle2, Navigation, MessageCircle, RefreshCw } from "lucide-react"

// Clean phone for whatsapp
function cleanPhoneForWa(phone?: string) {
  if (!phone) return ""
  return phone.replace(/\D/g, "")
}

// Basic map links
function buildGoogleMapsUrl(parada: any) {
  if (!parada.direccion) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(parada.direccion)}`
}

export default function CampoPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [ruta, setRuta] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const fecha = new Date().toISOString().split("T")[0] // hoy
  const tecnicoFiltro = user?.nombre || ""

  const cargarRuta = useCallback(async () => {
    if (!tecnicoFiltro) return
    setLoading(true)
    setError(null)
    try {
      const tecnicoQuery = `&tecnico=${encodeURIComponent(tecnicoFiltro)}`
      const res = await authFetch(`/api/fumigacion/ruta?fecha=${encodeURIComponent(fecha)}${tecnicoQuery}`)
      if (!res.ok) throw new Error("No se pudo cargar la hoja de ruta")
      const data = await res.json()
      setRuta(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red")
    } finally {
      setLoading(false)
    }
  }, [fecha, tecnicoFiltro])

  useEffect(() => {
    // Si es admin o dueno, puede que no quiera esta vista por defecto, pero la dejamos usar.
    if (user?.nombre) {
      void cargarRuta()
    }
  }, [user, cargarRuta])

  const cambiarEstadoRapido = async (otId: number, nuevoEstado: string) => {
    setUpdatingId(otId)
    try {
      const res = await authFetch(`/api/ot/${otId}`, {
        method: "PUT",
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      if (res.ok) {
        await cargarRuta()
      }
    } finally {
      setUpdatingId(null)
    }
  }

  if (!user) return null

  const paradas = ruta?.paradas || []
  const visitasCompletadas = paradas.filter((p: any) => p.estado === "LISTO" || p.estado === "ENTREGADO")
  const visitasPendientes = paradas.filter((p: any) => p.estado !== "LISTO" && p.estado !== "ENTREGADO" && p.estado !== "CANCELADO")

  return (
    <PageShell>
      <PageHeader
        title="Mis Visitas de Hoy"
        description={`Hola, ${user.nombre.split(" ")[0]}. Aquí está tu ruta del día.`}
        actions={
          <Button variant="outline" size="sm" onClick={() => void cargarRuta()} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refrescar
          </Button>
        }
      />

      {error && (
        <div className="p-4 mb-4 text-sm text-red-800 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {loading && !ruta ? (
        <div className="py-8 text-center text-muted-foreground">Cargando tus visitas...</div>
      ) : paradas.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <Bug className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-medium">No tenés visitas programadas para hoy</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1">
            Si creés que es un error, contactá con administración.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 max-w-2xl mx-auto">
          {/* Resumen */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
            <div>
              <p className="text-sm text-muted-foreground">Progreso del día</p>
              <p className="text-2xl font-bold">{visitasCompletadas.length} / {paradas.length - paradas.filter((p:any) => p.estado === "CANCELADO").length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <p className="text-2xl font-bold text-blue-600">{visitasPendientes.length}</p>
            </div>
          </div>

          <h3 className="font-semibold text-lg mt-4 mb-2">Próximas Visitas</h3>
          
          {visitasPendientes.map((p: any) => (
            <Card key={p.ordenServicioId} className="overflow-hidden border-blue-100 shadow-sm">
              <div className="bg-blue-50/50 p-4 border-b">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-lg leading-tight">{p.clienteNombre}</h4>
                  <Badge variant={p.estado === "EN_PROCESO" ? "default" : "secondary"}>
                    {p.estado === "EN_PROCESO" ? "En Sitio" : "Pendiente"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-2">
                  <Navigation className="h-3.5 w-3.5 shrink-0" />
                  {p.direccion || "Sin dirección"}
                </p>
                {p.sitio && (
                  <p className="text-sm mt-1">
                    <span className="font-medium">Sitio:</span> {p.sitio}
                  </p>
                )}
                <p className="text-sm mt-1">
                  <span className="font-medium">Tratamiento:</span> {p.plagaLabel}
                </p>
              </div>
              <CardContent className="p-4 bg-white space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full text-blue-600 border-blue-200" asChild>
                    <a href={buildGoogleMapsUrl(p) || "#"} target="_blank" rel="noreferrer">
                      <Navigation className="mr-2 h-4 w-4" />
                      Ruta
                    </a>
                  </Button>
                  {p.telefono ? (
                    <Button variant="outline" className="w-full text-emerald-600 border-emerald-200" asChild>
                      <a href={`https://wa.me/${cleanPhoneForWa(p.telefono)}`} target="_blank" rel="noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Avisar
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>Sin Tel</Button>
                  )}
                </div>

                {p.estado === "PENDIENTE" ? (
                  <Button 
                    className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                    disabled={updatingId === p.ordenServicioId}
                    onClick={() => cambiarEstadoRapido(p.ordenServicioId, "EN_PROCESO")}
                  >
                    Llegué al Sitio
                  </Button>
                ) : (
                  <Button 
                    className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700"
                    disabled={updatingId === p.ordenServicioId}
                    onClick={() => cambiarEstadoRapido(p.ordenServicioId, "LISTO")}
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Finalizar Trabajo
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          {visitasPendientes.length === 0 && paradas.length > 0 && (
            <div className="p-8 text-center bg-emerald-50 rounded-xl border border-emerald-100">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-emerald-800">¡Ruta Completada!</h3>
              <p className="text-emerald-600 mt-2">Excelente trabajo hoy.</p>
            </div>
          )}

          {visitasCompletadas.length > 0 && (
            <>
              <h3 className="font-semibold text-lg mt-8 mb-2 text-muted-foreground">Visitas Completadas</h3>
              <div className="opacity-75 space-y-3">
                {visitasCompletadas.map((p: any) => (
                  <Card key={p.ordenServicioId} className="border-muted bg-muted/20">
                    <CardHeader className="p-4 py-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{p.clienteNombre}</span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </PageShell>
  )
}
