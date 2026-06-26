import { listarConexionesEmpresa } from "@/lib/integrations/connection-service"
import type { ReadinessItem } from "@/lib/ops/readiness-service"

const MONITOREADAS = new Set(["mercado_pago", "whatsapp", "shopify", "tienda_nube"])

export async function getIntegracionesHealthItems(empresaId: number): Promise<ReadinessItem[]> {
  const conexiones = await listarConexionesEmpresa(empresaId)
  const items: ReadinessItem[] = []

  for (const c of conexiones) {
    if (!MONITOREADAS.has(c.integracionId)) continue
    const ok = c.estado === "conectado"
    const warn = c.estado === "pausado" || c.estado === "error"
    items.push({
      id: `integ_${c.integracionId}`,
      label: `Integración ${c.integracionId.replace(/_/g, " ")}`,
      estado: ok ? "ok" : warn ? "warn" : "fail",
      detalle: c.ultimoError ?? c.cuentaExterna ?? c.estado,
      href: `/dashboard/integraciones/${c.integracionId}`,
    })
  }

  if (items.length === 0) {
    items.push({
      id: "integ_none",
      label: "Integraciones MP / WA / Shopify",
      estado: "warn",
      detalle: "Sin conexiones configuradas",
      href: "/dashboard/integraciones",
    })
  }

  return items
}