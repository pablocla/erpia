"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import type { MapaLoteData } from "./AgroMapLibre"

// Dynamic import sin SSR — MapLibre necesita window
const AgroMapLibre = dynamic(
  () => import("./AgroMapLibre").then((m) => ({ default: m.AgroMapLibre })),
  { ssr: false, loading: () => <Skeleton className="w-full h-[420px] rounded-md" /> }
)

export function FieldMapIoT({ loteId }: { loteId: number }) {
  const { data, isLoading, error } = useAuthFetch<MapaLoteData>(`/api/agro/mapa/${loteId}`, {
    refreshInterval: 60_000,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Mapa IoT</CardTitle></CardHeader>
        <CardContent><Skeleton className="w-full h-[420px] rounded-md" /></CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader><CardTitle>Mapa IoT</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">No se pudo cargar el mapa del lote.</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa IoT · {data.lote.nombre}</CardTitle>
      </CardHeader>
      <CardContent>
        <AgroMapLibre data={data} />
      </CardContent>
    </Card>
  )
}
