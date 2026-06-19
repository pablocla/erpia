"use client"

import { useMemo, useState } from "react"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { SensorDashboard } from "@/components/agro/iot/SensorDashboard"
import { RiegoPanel } from "@/components/agro/iot/RiegoPanel"
import { NdviWidget } from "@/components/agro/iot/NdviWidget"
import { ClimaLote } from "@/components/agro/iot/ClimaLote"
import { FieldMapIoT } from "@/components/agro/iot/FieldMapIoT"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Lote = { id: number; nombre: string; superficieHa: number; cultivoActual?: string | null }

export default function AgroIoTPage() {
  const { data } = useAuthFetch<Lote[]>("/api/agro/lotes")
  const lotes = useMemo(() => data ?? [], [data])
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const lote = useMemo(
    () => (selectedId ? lotes.find((l) => l.id === selectedId) : lotes[0]) ?? null,
    [selectedId, lotes]
  )

  if (!lote) return <div className="p-4 text-sm text-muted-foreground">No hay lotes activos para visualizar IoT.</div>

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agro IoT Center</h1>
          <p className="text-sm text-muted-foreground">
            {lote.cultivoActual ?? "Sin cultivo"} · {lote.superficieHa} ha
          </p>
        </div>
        {lotes.length > 1 && (
          <Select value={String(lote.id)} onValueChange={(v) => setSelectedId(Number(v))}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Seleccionar lote" />
            </SelectTrigger>
            <SelectContent>
              {lotes.map((l) => (
                <SelectItem key={l.id} value={String(l.id)}>
                  {l.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Mapa principal — ocupa todo el ancho */}
      <FieldMapIoT loteId={lote.id} />

      {/* Widgets informativos */}
      <div className="grid gap-4 md:grid-cols-2">
        <SensorDashboard loteId={lote.id} />
        <RiegoPanel loteId={lote.id} />
        <NdviWidget loteId={lote.id} />
        <ClimaLote loteId={lote.id} />
      </div>
    </div>
  )
}
