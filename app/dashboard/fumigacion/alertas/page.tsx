"use client"

import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { PageShell, PageHeader } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock, MapPin, Search } from "lucide-react"
import Link from "next/link"

export default function AlertasFumigacionPage() {
  const { data, loading, error } = useAuthFetch<any>("/api/fumigacion/alertas")

  const alertas = data?.alertas || []

  return (
    <PageShell>
      <PageHeader
        title="Alertas de Vencimiento"
        description="Monitor de certificados de fumigación vencidos o próximos a vencer."
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/fumigacion">Volver a Hoja de Ruta</Link>
          </Button>
        }
      />

      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded-md mb-6">
          Error al cargar las alertas. Intente de nuevo más tarde.
        </div>
      )}

      {loading && (
        <div className="py-12 text-center text-muted-foreground">
          Calculando vencimientos...
        </div>
      )}

      {!loading && alertas.length === 0 && !error && (
        <div className="py-20 text-center">
          <div className="bg-emerald-100 text-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-foreground">Todo en orden</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2">
            No hay clientes con el certificado vencido o por vencer en el corto plazo.
          </p>
        </div>
      )}

      {!loading && alertas.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {alertas.map((alerta: any) => (
            <Card key={alerta.clienteId} className="border-red-100 shadow-sm">
              <CardHeader className="pb-3 bg-red-50/30">
                <CardTitle className="text-lg font-bold flex justify-between items-start">
                  <span className="truncate pr-2">{alerta.clienteNombre}</span>
                  <Badge variant={alerta.diasParaVencer < 0 ? "destructive" : "secondary"}>
                    {alerta.diasParaVencer < 0 
                      ? `Vencido hace ${Math.abs(alerta.diasParaVencer)} días`
                      : `Vence en ${alerta.diasParaVencer} días`}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-sm">
                <p className="flex items-center text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  Última visita: {new Date(alerta.ultimaVisita).toLocaleDateString("es-AR")}
                </p>
                <p className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="truncate">{alerta.direccion || "Sin dirección"}</span>
                </p>
                <div className="pt-4 border-t flex justify-end gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/fumigacion?action=new_visit&clienteId=${alerta.clienteId}`}>
                      Agendar Visita
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  )
}
