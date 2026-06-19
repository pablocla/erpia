"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"

type Zona = {
  id: number
  nombre: string
  activa: boolean
  tipoRiego: string
  programas: Array<{ id: number; nombre: string; horaInicio: string; duracionMin: number; activo: boolean }>
}

export function RiegoPanel({ loteId }: { loteId: number }) {
  const { data, mutate } = useAuthFetch<{ zonas: Zona[] }>(`/api/agro/riego/zonas?loteId=${loteId}`, { refreshInterval: 30000 })
  const [loadingId, setLoadingId] = useState<number | null>(null)

  async function trigger(zonaId: number, accion: "INICIAR" | "DETENER") {
    setLoadingId(zonaId)
    await authFetch(`/api/agro/riego/${zonaId}/trigger`, {
      method: "POST",
      body: JSON.stringify({ accion }),
    })
    await mutate()
    setLoadingId(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riego de precisión</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {(data?.zonas ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin zonas de riego en este lote.</p>
        ) : (
          (data?.zonas ?? []).map((z) => (
            <div key={z.id} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{z.nombre}</p>
                  <p className="text-xs text-muted-foreground">{z.tipoRiego}</p>
                </div>
                <Badge variant={z.activa ? "default" : "secondary"}>{z.activa ? "ACTIVO" : "INACTIVO"}</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => trigger(z.id, "INICIAR")} disabled={loadingId === z.id || z.activa}>Iniciar</Button>
                <Button size="sm" variant="outline" onClick={() => trigger(z.id, "DETENER")} disabled={loadingId === z.id || !z.activa}>Detener</Button>
              </div>
              {z.programas.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Programa: {z.programas[0].nombre} · {z.programas[0].horaInicio} · {z.programas[0].duracionMin} min
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
