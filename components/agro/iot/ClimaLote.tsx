"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthFetch } from "@/hooks/use-auth-fetch"

type ClimaData = {
  forecast: Array<{ date: string; precipitationMm: number; tempMax: number; tempMin: number; eto: number }>
  alertas: string[]
  etoDiario: number
}

export function ClimaLote({ loteId }: { loteId: number }) {
  const { data } = useAuthFetch<ClimaData>(`/api/agro/clima/${loteId}`, { refreshInterval: 3600000 })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clima del lote</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          {(data?.alertas ?? []).map((a) => (
            <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>
          ))}
          {(data?.alertas ?? []).length === 0 && <Badge variant="secondary">Sin alertas críticas</Badge>}
        </div>
        <div className="space-y-1 text-sm">
          {(data?.forecast ?? []).slice(0, 5).map((d) => (
            <div key={d.date} className="flex items-center justify-between border-b py-1">
              <span>{new Date(d.date).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}</span>
              <span className="text-muted-foreground">{d.tempMin.toFixed(0)}° / {d.tempMax.toFixed(0)}° · {d.precipitationMm.toFixed(1)} mm</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
