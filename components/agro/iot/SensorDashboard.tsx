"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthFetch } from "@/hooks/use-auth-fetch"

type Sensor = {
  id: number
  nombre: string
  tipo: string
  activo: boolean
  ultimaLectura: { valor: number; unidad: string; timestamp: string } | null
}

export function SensorDashboard({ loteId }: { loteId: number }) {
  const { data } = useAuthFetch<{ sensores: Sensor[] }>(`/api/agro/sensores?loteId=${loteId}`, { refreshInterval: 30000 })
  const sensores = data?.sensores ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sensores del lote</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sensores.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin sensores para este lote.</p>
        ) : (
          sensores.map((s) => {
            const valor = s.ultimaLectura?.valor ?? null
            const critico = s.tipo === "HUMEDAD_SUELO" && valor != null && valor < 15
            const alerta = s.tipo === "HUMEDAD_SUELO" && valor != null && valor >= 15 && valor < 20
            return (
              <div key={s.id} className="rounded-md border p-2 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{s.nombre}</p>
                  <Badge variant={critico ? "destructive" : alerta ? "secondary" : "default"}>
                    {critico ? "Crítico" : alerta ? "Alerta" : "Normal"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{s.tipo}</p>
                <p className="mt-1">
                  {s.ultimaLectura
                    ? `${s.ultimaLectura.valor.toFixed(1)} ${s.ultimaLectura.unidad}`
                    : "Sin lectura"}
                </p>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
