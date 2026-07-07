/**
 * Sprint 4 — Análisis de Precios Unitarios (APU).
 */

import { prisma } from "@/lib/prisma"

export interface ApuComponente {
  tipo: "material" | "mano_obra"
  descripcion: string
  cantidad: number
  unidad: string
  precioUnitario: number
}

export interface ApuItemDTO {
  codigo: string
  nombre: string
  unidad: string
  componentes: ApuComponente[]
}

export const APU_SEED: ApuItemDTO[] = [
  {
    codigo: "PARED_LADRILLO_10M2",
    nombre: "Pared ladrillo 10 m²",
    unidad: "m2",
    componentes: [
      { tipo: "material", descripcion: "Ladrillo común", cantidad: 250, unidad: "u", precioUnitario: 180 },
      { tipo: "material", descripcion: "Cemento", cantidad: 3, unidad: "bolsa", precioUnitario: 4200 },
      { tipo: "mano_obra", descripcion: "Oficial albañil", cantidad: 5, unidad: "h", precioUnitario: 8500 },
    ],
  },
]

function db() {
  return prisma as any
}

export function calcularPrecioApu(componentes: ApuComponente[]): number {
  return componentes.reduce((sum, c) => sum + c.cantidad * c.precioUnitario, 0)
}

export async function listApuItems(empresaId: number) {
  try {
    const rows = await db().apuItem.findMany({
      where: { empresaId, activo: true },
      orderBy: { nombre: "asc" },
    })
    return rows.map((r: { componentes: ApuComponente[]; precioBase: unknown } & ApuItemDTO) => ({
      ...r,
      precioCalculado: calcularPrecioApu((r.componentes as ApuComponente[]) ?? []),
      precioBase: Number(r.precioBase),
    }))
  } catch {
    return APU_SEED.map((s) => ({
      ...s,
      id: 0,
      empresaId,
      precioCalculado: calcularPrecioApu(s.componentes),
      precioBase: calcularPrecioApu(s.componentes),
      activo: true,
    }))
  }
}

export async function seedApuEmpresa(empresaId: number) {
  for (const item of APU_SEED) {
    const precio = calcularPrecioApu(item.componentes)
    try {
      await db().apuItem.upsert({
        where: { empresaId_codigo: { empresaId, codigo: item.codigo } },
        create: {
          empresaId,
          codigo: item.codigo,
          nombre: item.nombre,
          unidad: item.unidad,
          precioBase: precio,
          componentes: item.componentes,
        },
        update: { precioBase: precio, componentes: item.componentes },
      })
    } catch {
      /* tabla aún no migrada */
    }
  }
}

export async function cotizarApu(
  empresaId: number,
  codigo: string,
  cantidad: number,
): Promise<{ total: number; unitario: number; nombre: string }> {
  const items = await listApuItems(empresaId)
  const item = items.find((i: { codigo: string }) => i.codigo === codigo)
  if (!item) throw new Error(`APU no encontrado: ${codigo}`)
  const unitario = item.precioCalculado ?? item.precioBase
  return {
    nombre: item.nombre,
    unitario,
    total: Math.round(unitario * cantidad),
  }
}