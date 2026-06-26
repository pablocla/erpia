"use client"

import useSWR from "swr"
import { getAuthHeaders } from "@/lib/stores/auth-store"

export type ProductosResumen = {
  productos: {
    sku: string
    nombre: string
    lema: string
    tier: string
    activo: boolean
    dependeDe: string[]
    dependenciasOk: boolean
    precioArs: number
  }[]
  mapa: Record<string, boolean>
  packs: {
    id: string
    nombre: string
    todoActivo: boolean
    algunoActivo: boolean
  }[]
}

async function fetchProductos(): Promise<ProductosResumen> {
  const res = await fetch("/api/platform/productos", { headers: getAuthHeaders() })
  if (!res.ok) throw new Error("Error al cargar productos")
  return res.json()
}

export function useProductEntitlements() {
  const { data, error, isLoading, mutate } = useSWR("platform-productos", fetchProductos, {
    revalidateOnFocus: true,
    dedupingInterval: 15_000,
  })

  function tieneSku(sku: string): boolean {
    return data?.mapa?.[sku] === true
  }

  return {
    mapa: data?.mapa ?? {},
    productos: data?.productos ?? [],
    packs: data?.packs ?? [],
    tieneSku,
    isLoading,
    error,
    refresh: mutate,
  }
}