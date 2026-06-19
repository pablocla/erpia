"use client"

import { useMemo } from "react"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { SensorDashboard } from "@/components/agro/iot/SensorDashboard"

type Lote = { id: number; nombre: string }

export default function AgroIoTSensoresPage() {
  const { data } = useAuthFetch<Lote[]>("/api/agro/lotes")
  const lote = useMemo(() => data?.[0] ?? null, [data])

  if (!lote) return <div className="p-4 text-sm text-muted-foreground">Sin lotes activos.</div>

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Sensores IoT</h1>
      <SensorDashboard loteId={lote.id} />
    </div>
  )
}
