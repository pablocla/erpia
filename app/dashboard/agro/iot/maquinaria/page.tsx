"use client"

import { Button } from "@/components/ui/button"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { MaquinaCard } from "@/components/agro/iot/MaquinaCard"

type Maquina = {
  id: number
  nombre: string
  marca: string
  modeloNombre: string | null
  logs?: Array<{ timestamp: string; operacion: string | null; velocidad: number | null }>
}

export default function AgroIoTMaquinariaPage() {
  const { data, mutate } = useAuthFetch<{ maquinas: Maquina[] }>("/api/agro/maquinas")

  async function sync() {
    await authFetch("/api/agro/maquinas/sync", { method: "POST" })
    await mutate()
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Maquinaria conectada</h1>
        <Button onClick={sync}>Sincronizar telemetría</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {(data?.maquinas ?? []).map((m) => (
          <MaquinaCard key={m.id} maquina={m} />
        ))}
      </div>
    </div>
  )
}
