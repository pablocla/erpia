"use client"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { PageShell, PageHeader } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Key, Battery, Wifi, WifiOff } from "lucide-react"

type Cerradura = {
  id: number
  proveedor: string
  macAddress: string
  bateriaPct: number
  online: boolean
  habitacion: {
    numero: string
    tipo: string
  }
}

export default function CerradurasPage() {
  const { data: cerraduras, isLoading } = useAuthFetch<Cerradura[]>("/api/hoteleria/cerraduras")

  return (
    <PageShell
      title="Cerraduras Inteligentes"
      subtitle="Supervisión de cerraduras IoT y vinculación de habitaciones"
      icon={Key}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-muted-foreground p-4">Cargando cerraduras...</p>
        ) : cerraduras?.length === 0 ? (
          <p className="text-muted-foreground p-4">No hay cerraduras registradas en este hotel.</p>
        ) : (
          cerraduras?.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Habitación {c.habitacion.numero}</CardTitle>
                    <CardDescription>{c.habitacion.tipo}</CardDescription>
                  </div>
                  <Badge variant={c.online ? "default" : "destructive"}>
                    {c.online ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                    {c.online ? "Online" : "Offline"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Proveedor: {c.proveedor}</span>
                  <span className="flex items-center text-muted-foreground">
                    <Battery className="w-4 h-4 mr-1" />
                    {c.bateriaPct}%
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  MAC: {c.macAddress}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PageShell>
  )
}
