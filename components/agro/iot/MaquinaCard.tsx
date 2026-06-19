"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Maquina = {
  id: number
  nombre: string
  marca: string
  modeloNombre: string | null
  logs?: Array<{ timestamp: string; operacion: string | null; velocidad: number | null }>
}

export function MaquinaCard({ maquina }: { maquina: Maquina }) {
  const last = maquina.logs?.[0]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{maquina.nombre}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <Badge variant="outline">{maquina.marca}</Badge>
        <p className="text-muted-foreground">{maquina.modeloNombre ?? "Sin modelo"}</p>
        <p>Operación: <span className="font-medium">{last?.operacion ?? "Sin datos"}</span></p>
        <p className="text-xs text-muted-foreground">Velocidad: {last?.velocidad ?? 0} km/h</p>
      </CardContent>
    </Card>
  )
}
