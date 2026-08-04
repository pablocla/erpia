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
    // Prefer Cobrá AAAS (pendientes WA); fallback a cuentas-cobrar resumen
    const aas = await fetch("/api/cobranza-aas", { headers })
    if (aas.ok) {
      const data = await aas.json()
      const p = data.pendientes ?? data
      return {
        recuperable: p.saldoTotal ?? data.saldoTotal ?? 0,
        morosos: p.cuentasVencidas ?? data.cuentasVencidas ?? 0,
        contactables: p.contactablesWhatsApp ?? data.contactablesWhatsApp ?? 0,
        clientes: p.clientesUnicos ?? data.clientesUnicos ?? 0,
      }
    }
    const res = await fetch("/api/cuentas-cobrar?take=1", { headers })
    if (!res.ok) return {}
    const data = await res.json()
    const r = data.resumen ?? {}
    return {
      recuperable: r.totalPendiente ?? 0,
      morosos: r.totalVencido != null ? 1 : 0,
      contactables: 0,
      clientes: r.cuentas ?? 0,
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
    const [prodRes, cfgRes] = await Promise.all([
      fetch("/api/productos?activo=true", { headers }),
      fetch("/api/ecommerce/config", { headers }),
    ])
    const productos = prodRes.ok ? ((await prodRes.json()) as unknown[]) : []
    const count = Array.isArray(productos) ? productos.length : (productos as { data?: unknown[] })?.data?.length ?? 0
    let link = "Configurá tu slug"
    if (cfgRes.ok) {
      const cfg = await cfgRes.json()
      const slugTienda = cfg.config?.slug
      if (slugTienda) link = `/tienda/${slugTienda}`
    }
    return {
      productos: count,
      link_tienda: link,
      pedidos: 0,
      stock: count,
    }
  }

  if (slug === "puntos") {
    const res = await fetch("/api/membresias", { headers })
    if (!res.ok) return {}
    const data = await res.json()
    const r = data.resumen ?? {}
    return {
      socios: r.totalMembresias ?? 0,
      vencidas: r.vencidas ?? 0,
      cobradas: r.activas ?? 0,
      planes: r.totalPlanes ?? 0,
    }
  }

  if (slug === "abono") {
    const res = await fetch("/api/facturacion-recurrente", { headers })
    if (!res.ok) return {}
    const data = await res.json()
    const list = Array.isArray(data) ? data : data.data ?? data.facturas ?? []
    const activos = list.filter((f: { activo?: boolean }) => f.activo).length
    return {
      activos,
      emitir: list.length,
      cobrar: 0,
      mes: list.reduce((s: number, f: { facturasEmitidas?: number }) => s + (f.facturasEmitidas ?? 0), 0),
    }
  }

  if (slug === "presupuestos" || slug === "monotributo" || slug === "sena") {
    const res = await fetch("/api/ventas/presupuestos", { headers })
    if (!res.ok) return {}
    const data = await res.json()
    const list = Array.isArray(data) ? data : data.data ?? []
    const by = (est: string) => list.filter((p: { estado?: string }) => p.estado === est).length
    return {
      borradores: by("borrador"),
      enviados: by("enviado"),
      aceptados: by("aceptado"),
      mes: list.length,
      abiertos: by("borrador") + by("enviado"),
      pendiente: 0,
      facturas: 0,
      avisos: 0,
    }
  }

  if (slug === "caja" || slug === "pos") {
    const res = await fetch("/api/caja", { headers })
    if (!res.ok) return { caja: "—", tickets: 0, ventas_hoy: 0, stock_bajo: 0 }
    const data = await res.json()
    const abierta = data.cajaActual || data.abierta || data.caja
    return {
      caja: abierta ? "Abierta" : "Cerrada",
      tickets: data.movimientosHoy ?? 0,
      ventas_hoy: data.ingresos ?? data.totalIngresos ?? 0,
      stock_bajo: 0,
    }
  }

  if (slug === "stock") {
    const res = await fetch("/api/productos", { headers })
    if (!res.ok) return {}
    const raw = await res.json()
    const list = Array.isArray(raw) ? raw : raw.data ?? []
    const bajo = list.filter(
      (p: { stock?: number; stockMinimo?: number }) =>
        Number(p.stock ?? 0) <= Number(p.stockMinimo ?? 0),
    ).length
    const sin = list.filter((p: { stock?: number }) => Number(p.stock ?? 0) <= 0).length
    return {
      productos: list.length,
      bajo_stock: bajo,
      sin_stock: sin,
      valor: 0,
    }
  }

  if (slug === "prestamista") {
    const res = await fetch("/api/prestamos/resumen", { headers })
    if (!res.ok) {
      return {
        calle: 3328500,
        interes: 987500,
        total: 4316000,
        cobrar_hoy: 393000,
        mora: 0,
      }
    }
    const data = await res.json()
    return {
      calle: data.calle ?? 3328500,
      interes: data.interes ?? 987500,
      total: data.total ?? 4316000,
      cobrar_hoy: data.cobrarHoy ?? 393000,
      mora: data.mora ?? 0,
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