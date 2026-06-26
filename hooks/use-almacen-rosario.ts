"use client"

import { useCallback, useEffect, useState } from "react"
import { getAuthHeaders } from "@/lib/stores/auth-store"

export type PromoHoy = {
  id: string
  titulo: string
  reintegroPct: number
  medios: string[]
  mensajeCajero: string
}

export function useAlmacenRosario() {
  const [activo, setActivo] = useState(false)
  const [promos, setPromos] = useState<PromoHoy[]>([])

  const refreshPromos = useCallback(async () => {
    try {
      const res = await fetch("/api/pos/almacen/promos-hoy", { headers: getAuthHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setActivo(data.activo === true)
      setPromos(data.promociones ?? [])
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    void refreshPromos()
  }, [refreshPromos])

  return { activo, promos, refreshPromos }
}