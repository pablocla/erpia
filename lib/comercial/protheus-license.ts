/**
 * Licencia anual TOTVS/Protheus — independiente del trial y Mercado Pago de Claver ERP.
 * Baja del producto = suscripcionModulo.activo false → se bloquea solo este módulo.
 */

import { prisma } from "@/lib/prisma"

export const PROTHEUS_LICENSE_SKU = "edge.investments"
export const PROTHEUS_BRIDGE_SKU = "bridge.opo_studio"
export const PROTHEUS_LICENSE_SKUS = [PROTHEUS_LICENSE_SKU, PROTHEUS_BRIDGE_SKU] as const
export const PROTHEUS_LICENSE_YEARS = 1

export type ProtheusLicenseStatus = "none" | "active" | "expired" | "cancelled"

export function isProtheusLicenseSku(sku: string): boolean {
  return (PROTHEUS_LICENSE_SKUS as readonly string[]).includes(sku)
}

export function isProtheusDashboardPath(pathname: string): boolean {
  return pathname === "/dashboard/protheus" || pathname.startsWith("/dashboard/protheus/")
}

export function isProtheusApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/protheus-invest")
}

export function vigenciaHastaLicenciaProtheus(from = new Date()): Date {
  const d = new Date(from)
  d.setFullYear(d.getFullYear() + PROTHEUS_LICENSE_YEARS)
  return d
}

export function isModoLiteProtheus(modoLite: string | null | undefined): boolean {
  return modoLite === "protheus"
}

export async function getProtheusLicenseState(empresaId: number): Promise<{
  status: ProtheusLicenseStatus
  sku: string
  vigenciaHasta: string | null
  activo: boolean
}> {
  const row = await prisma.suscripcionModulo.findFirst({
    where: { empresaId, sku: PROTHEUS_LICENSE_SKU },
    select: { activo: true, vigenciaHasta: true },
    orderBy: { id: "desc" },
  })

  if (!row) {
    return { status: "none", sku: PROTHEUS_LICENSE_SKU, vigenciaHasta: null, activo: false }
  }
  if (!row.activo) {
    return {
      status: "cancelled",
      sku: PROTHEUS_LICENSE_SKU,
      vigenciaHasta: row.vigenciaHasta?.toISOString() ?? null,
      activo: false,
    }
  }
  if (row.vigenciaHasta && row.vigenciaHasta.getTime() < Date.now()) {
    return {
      status: "expired",
      sku: PROTHEUS_LICENSE_SKU,
      vigenciaHasta: row.vigenciaHasta.toISOString(),
      activo: true,
    }
  }
  return {
    status: "active",
    sku: PROTHEUS_LICENSE_SKU,
    vigenciaHasta: row.vigenciaHasta?.toISOString() ?? null,
    activo: true,
  }
}

/** Bloquea solo si dieron de baja o venció el año. Sin fila = tenant ERP existente / onboarding. */
export function protheusAccessBlocked(status: ProtheusLicenseStatus | string | undefined): boolean {
  return status === "expired" || status === "cancelled"
}
