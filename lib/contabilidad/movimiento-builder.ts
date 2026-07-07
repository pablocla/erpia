/**
 * Builder de movimientos contables con FK al plan de cuentas (Sprint B1).
 */

import { prisma } from "@/lib/prisma"

export interface MovimientoInput {
  cuentaLabel: string
  debe: number
  haber: number
  centroCostoId?: number | null
}

export interface MovimientoCreateData {
  cuenta: string
  debe: number
  haber: number
  cuentaContableId: number | null
  centroCostoId: number | null
}

/** Extrae código de cuenta del label "4.1 Ventas" → "4.1" */
export function extraerCodigoCuenta(cuentaLabel: string): string {
  const trimmed = cuentaLabel.trim()
  const match = trimmed.match(/^([\d]+(?:\.[\d]+)*)/)
  return match?.[1] ?? trimmed.split(/\s+/)[0] ?? trimmed
}

export async function resolverCuentaContableId(
  empresaId: number,
  cuentaLabel: string,
): Promise<number | null> {
  const codigo = extraerCodigoCuenta(cuentaLabel)
  const cuenta = await prisma.cuentaContable.findUnique({
    where: { empresaId_codigo: { empresaId, codigo } },
    select: { id: true, imputable: true, activo: true },
  })
  if (!cuenta || !cuenta.activo) return null
  if (!cuenta.imputable) {
    throw new Error(`La cuenta ${codigo} no es imputable`)
  }
  return cuenta.id
}

export async function buildMovimiento(
  empresaId: number,
  input: MovimientoInput,
): Promise<MovimientoCreateData> {
  const cuentaContableId = await resolverCuentaContableId(empresaId, input.cuentaLabel)
  return {
    cuenta: input.cuentaLabel,
    debe: input.debe,
    haber: input.haber,
    cuentaContableId,
    centroCostoId: input.centroCostoId ?? null,
  }
}

export async function buildMovimientos(
  empresaId: number,
  items: MovimientoInput[],
): Promise<MovimientoCreateData[]> {
  return Promise.all(items.map((item) => buildMovimiento(empresaId, item)))
}

/** Asigna centro de costo por defecto de la empresa si no viene en el ítem (B5). */
export async function buildMovimientosConCentro(
  empresaId: number,
  items: MovimientoInput[],
): Promise<MovimientoCreateData[]> {
  const { resolverCentroCostoDefault } = await import("@/lib/contabilidad/centro-costo-default")
  const ccDefault = await resolverCentroCostoDefault(empresaId)
  return buildMovimientos(
    empresaId,
    items.map((item) => ({
      ...item,
      centroCostoId: item.centroCostoId ?? ccDefault,
    })),
  )
}