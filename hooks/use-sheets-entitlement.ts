"use client"

import { useCallback, useEffect, useState } from "react"
import type { SheetsPlan } from "@/components/reporting/SheetsUpsellDialog"

export type SheetsEntitlementState = {
  entitled: boolean
  tier: "lite" | "pro" | null
  reason?: string
  usage?: {
    mes: string
    execute: { usado: number; limite: number | null }
    export: { usado: number; limite: number | null }
  }
  plans: SheetsPlan[]
  loading: boolean
}

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const DEFAULT_PLANS: SheetsPlan[] = [
  {
    sku: "sheets.lite",
    nombre: "Clav Sheets Lite",
    descripcion: "Pivot, gráficos y export Excel",
    precioArs: 6900,
    tier: "lite",
  },
  {
    sku: "sheets.pro",
    nombre: "Clav Sheets Pro",
    descripcion: "Ilimitado + plantillas verticales",
    precioArs: 14900,
    tier: "pro",
  },
]

export function useSheetsEntitlement() {
  const [state, setState] = useState<SheetsEntitlementState>({
    entitled: false,
    tier: null,
    plans: DEFAULT_PLANS,
    loading: true,
  })

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }))
    try {
      const res = await fetch("/api/reporting/entitlement", { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setState({
          entitled: !!data.entitled,
          tier: data.tier ?? null,
          reason: data.reason,
          usage: data.usage,
          plans: data.plans ?? DEFAULT_PLANS,
          loading: false,
        })
      } else {
        setState((s) => ({ ...s, entitled: false, loading: false }))
      }
    } catch {
      setState((s) => ({ ...s, entitled: false, loading: false }))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { ...state, refresh }
}