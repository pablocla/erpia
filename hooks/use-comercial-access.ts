"use client"

import { useEffect, useState } from "react"
import { getAuthHeaders, useAuthStore } from "@/lib/stores/auth-store"
import type { TrialStatus } from "@/lib/comercial/trial-service"

export interface MonetizadoRow {
  sku: string
  nombre: string
  precioArs: number
  enTrial: boolean
  expirado: boolean
  gratisPermanente: boolean
}

export interface UpsellRow {
  sku: string
  nombre: string
  precioArs: number
}

export interface ComercialAccessPayload {
  ofertaId?: string
  ofertaNombre?: string
  ofertaLema?: string
  tieneAnclaGratis?: boolean
  anclaSkus?: string[]
  monetizados?: MonetizadoRow[]
  upsellSkus?: UpsellRow[]
  precioUpgradeArs?: number
  bloqueoTotal?: boolean
  mpAutorizado?: boolean
  modoLite?: string | null
}

export function useComercialAccess() {
  const token = useAuthStore((s) => s.token)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const [trial, setTrial] = useState<TrialStatus | null>(null)
  const [access, setAccess] = useState<ComercialAccessPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isHydrated || !token) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetch("/api/config/trial", { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        setTrial(data?.trial ?? null)
        setAccess(data?.access ?? null)
      })
      .catch(() => {
        if (!cancelled) {
          setTrial(null)
          setAccess(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, isHydrated])

  return { trial, access, loading }
}