"use client"

import { useCallback, useEffect, useState } from "react"
import type { ProductShellConfig, ProductShellKpiDef } from "@/lib/comercial/product-shell"
import type { ProductHomeKPI, ProductHomeAction } from "@/components/dashboard/product-home"

type KpiValues = Record<string, string | number>

function formatKpiValue(def: ProductShellKpiDef, value: string | number | undefined): string {
  if (value === undefined || value === null) return def.format === "text" ? "—" : "0"
  if (def.format === "currency" && typeof value === "number") {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(value)
  }
  if (def.format === "number" && typeof value === "number") {
    return value.toLocaleString("es-AR")
  }
  return String(value)
}

async function fetchKpiValues(
  shell: ProductShellConfig,
  headers: HeadersInit,
  empresaId?: number,
): Promise<KpiValues> {
  const slug = shell.slug

  if (slug === "fiado") {
    const res = await fetch("/api/fiado/resumen", { headers })
    if (!res.ok) return {}
    const data = await res.json()
    return {
      saldo_total: data.saldoFiadoTotal ?? 0,
      deudores: data.totalDeudores ?? 0,
      fiados_hoy: data.fiadosHoy ?? 0,
      avisos_hoy: data.notificacionesHoy ?? 0,
    }
  }

  if (slug === "cobra") {
    const res = await fetch("/api/marketplace/intangibles/cobranzas/resumen", { headers })
    if (!res.ok) return {}
    const data = await res.json()
    return {
      recuperable: data.saldoTotal ?? 0,
      morosos: data.cuentasVencidas ?? 0,
      contactables: data.contactablesWhatsApp ?? 0,
      clientes: data.clientesUnicos ?? 0,
    }
  }

  if (slug === "turnos" && empresaId) {
    const hoy = new Date().toISOString().split("T")[0]
    const res = await fetch(`/api/agenda?fecha=${hoy}`, { headers })
    if (!res.ok) {
      return { link_publico: `/agenda-online/${empresaId}` }
    }
    const data = (await res.json()) as {
      resumen?: { totalHoy?: number; pendientes?: number }
      profesionales?: unknown[]
    }
    return {
      turnos_hoy: data.resumen?.totalHoy ?? 0,
      pendientes: data.resumen?.pendientes ?? 0,
      link_publico: `/agenda-online/${empresaId}`,
      profesionales: data.profesionales?.length ?? 0,
    }
  }

  if (slug === "tienda") {
    const res = await fetch("/api/productos?activo=true", { headers })
    const productos = res.ok ? ((await res.json()) as unknown[]) : []
    const count = Array.isArray(productos) ? productos.length : 0
    return {
      productos: count,
      link_tienda: "Configurá tu slug",
      pedidos: 0,
      stock: count,
    }
  }

  return {}
}

export function useProductHomeData(
  shell: ProductShellConfig | null,
  authHeaders: () => HeadersInit,
  empresaId?: number,
) {
  const [kpis, setKpis] = useState<ProductHomeKPI[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!shell) {
      setKpis([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const values = await fetchKpiValues(shell, authHeaders(), empresaId)
      const mapped: ProductHomeKPI[] = shell.kpis.map((def) => {
        const raw = values[def.id]
        return {
          id: def.id,
          titulo: def.label,
          valor: formatKpiValue(def, raw),
          rawValue: typeof raw === "number" ? raw : undefined,
          format: def.format,
          icon: def.icon,
          colorClass: "text-primary",
          href: def.href,
        }
      })
      setKpis(mapped)
    } catch {
      setKpis(
        shell.kpis.map((def) => ({
          id: def.id,
          titulo: def.label,
          valor: def.format === "text" ? "—" : "0",
          icon: def.icon,
          colorClass: "text-muted-foreground",
          href: def.href,
        })),
      )
    } finally {
      setLoading(false)
    }
  }, [shell, authHeaders, empresaId])

  useEffect(() => {
    void load()
  }, [load])

  const actions: ProductHomeAction[] = shell
    ? [
        {
          label: shell.primaryAction.label,
          description: "Acción principal de hoy",
          href: shell.primaryAction.href,
        },
        ...shell.tabs
          .filter((t) => t.href !== "#more" && t.href !== shell.primaryAction.href)
          .slice(0, 2)
          .map((tab) => ({
            label: tab.label,
            description: `Ir a ${tab.label}`,
            href: tab.href,
          })),
      ]
    : []

  return { kpis, actions, loading, refresh: load }
}