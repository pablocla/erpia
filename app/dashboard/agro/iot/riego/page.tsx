"use client"

import { useMemo } from "react"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { RiegoPanel } from "@/components/agro/iot/RiegoPanel"
import { ClimaLote } from "@/components/agro/iot/ClimaLote"

type Lote = { id: number; nombre: string }

export default function AgroIoTRiegoPage() {
  const { data } = useAuthFetch<Lote[]>("/api/agro/lotes")
  const lote = useMemo(() => data?.[0] ?? null, [data])

  if (!lote) return <div className="p-4 text-sm text-muted-foreground">Sin lotes activos.</div>

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Riego Inteligente</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <RiegoPanel loteId={lote.id} />
        <ClimaLote loteId={lote.id} />
      </div>
    </div>
  )
}
