"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthFetch } from "@/hooks/use-auth-fetch"

export function NdviWidget({ loteId }: { loteId: number }) {
  const { data } = useAuthFetch<{ ndviMedio: number; ndviMin: number; ndviMax: number; fuente: string; fecha: string }>(`/api/agro/ndvi/${loteId}`, { refreshInterval: 1800000 })

  const ndvi = data?.ndviMedio ?? 0
  const pct = Math.round(ndvi * 100)
  const color = ndvi < 0.3 ? "bg-red-500" : ndvi < 0.6 ? "bg-amber-500" : "bg-emerald-500"

  return (
    <Card>
      <CardHeader>
        <CardTitle>NDVI por lote</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold">{ndvi.toFixed(3)}</p>
          <Badge variant={ndvi < 0.3 ? "destructive" : "secondary"}>{ndvi < 0.3 ? "Estrés" : "OK"}</Badge>
        </div>
        <div className="h-2 bg-muted rounded overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">
          Min: {data?.ndviMin?.toFixed(3) ?? "-"} · Max: {data?.ndviMax?.toFixed(3) ?? "-"}
        </p>
      </CardContent>
    </Card>
  )
}
