/**
 * Centro de Costos Service
 *
 * Hierarchical cost centers with rollup reporting.
 * Uses CentroCosto model already linked to MovimientoContable.
 */

import { prisma } from "@/lib/prisma"

export interface CentroCostoInput {
  codigo: string
  nombre: string
  descripcion?: string
  parentId?: number
}

export class CentroCostoService {
  async crear(input: CentroCostoInput) {
    return prisma.centroCosto.create({
      data: {
        codigo: input.codigo,
        nombre: input.nombre,
        descripcion: input.descripcion ?? null,
        parentId: input.parentId ?? null,
      },
    })
  }

  async actualizar(id: number, data: Partial<CentroCostoInput>) {
    return prisma.centroCosto.update({
      where: { id },
      data: {
        ...(data.codigo !== undefined && { codigo: data.codigo }),
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
      },
    })
  }

  async listarJerarquia() {
    const all = await prisma.centroCosto.findMany({
      where: { activo: true },
      orderBy: { codigo: "asc" },
      include: {
        _count: { select: { movimientos: true } },
      },
    })

    // Build tree
    const map = new Map<number, any>()
    const roots: any[] = []

    for (const cc of all) {
      map.set(cc.id, { ...cc, hijos: [] })
    }

    for (const cc of all) {
      const node = map.get(cc.id)!
      if (cc.parentId && map.has(cc.parentId)) {
        map.get(cc.parentId)!.hijos.push(node)
      } else {
        roots.push(node)
      }
    }

    return roots
  }

  async listarPlano() {
    return prisma.centroCosto.findMany({
      where: { activo: true },
      orderBy: { codigo: "asc" },
      include: {
        parent: true,
        _count: { select: { movimientos: true } },
      },
    })
  }

  /**
   * Get accumulated debe/haber totals for each centro de costo in a period
   */
  async reportePorPeriodo(mes: number, anio: number) {
    const desde = new Date(anio, mes - 1, 1)
    const hasta = new Date(anio, mes, 0, 23, 59, 59)

    const centros = await prisma.centroCosto.findMany({
      where: { activo: true },
      orderBy: { codigo: "asc" },
    })

    const resultado = []

    for (const cc of centros) {
      const movs = await prisma.movimientoContable.findMany({
        where: {
          centroCostoId: cc.id,
          asiento: {
            fecha: { gte: desde, lte: hasta },
          },
        },
        select: { debe: true, haber: true },
      })

      const totalDebe = movs.reduce((s, m) => s + m.debe, 0)
      const totalHaber = movs.reduce((s, m) => s + m.haber, 0)

      resultado.push({
        id: cc.id,
        codigo: cc.codigo,
        nombre: cc.nombre,
        totalDebe,
        totalHaber,
        saldo: totalDebe - totalHaber,
        movimientos: movs.length,
      })
    }

    return resultado
  }

  async desactivar(id: number) {
    return prisma.centroCosto.update({
      where: { id },
      data: { activo: false },
    })
  }
}

export const centroCostoService = new CentroCostoService()
