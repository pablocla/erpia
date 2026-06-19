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
  empresaId: number
}

export class CentroCostoService {
  async crear(input: CentroCostoInput) {
    if (input.parentId) {
      const parent = await prisma.centroCosto.findFirst({
        where: { id: input.parentId, empresaId: input.empresaId, activo: true },
      })
      if (!parent) {
        throw new Error("Centro padre no encontrado en su empresa")
      }
    }

    return prisma.centroCosto.create({
      data: {
        empresaId: input.empresaId,
        codigo: input.codigo,
        nombre: input.nombre,
        descripcion: input.descripcion ?? null,
        parentId: input.parentId ?? null,
      },
    })
  }

  async actualizar(empresaId: number, id: number, data: Partial<CentroCostoInput>) {
    const existing = await prisma.centroCosto.findFirst({
      where: { id, empresaId },
    })
    if (!existing) throw new Error("Centro de costo no encontrado")

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

  async listarJerarquia(empresaId: number) {
    const all = await prisma.centroCosto.findMany({
      where: { activo: true, empresaId },
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

  async listarPlano(empresaId: number) {
    return prisma.centroCosto.findMany({
      where: { activo: true, empresaId },
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
  async reportePorPeriodo(empresaId: number, mes: number, anio: number) {
    const desde = new Date(anio, mes - 1, 1)
    const hasta = new Date(anio, mes, 0, 23, 59, 59)

    const centros = await prisma.centroCosto.findMany({
      where: { activo: true, empresaId },
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

      const totalDebe = movs.reduce((s, m) => s + Number(m.debe), 0)
      const totalHaber = movs.reduce((s, m) => s + Number(m.haber), 0)

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

  async desactivar(empresaId: number, id: number) {
    const existing = await prisma.centroCosto.findFirst({
      where: { id, empresaId },
    })
    if (!existing) throw new Error("Centro de costo no encontrado")

    return prisma.centroCosto.update({
      where: { id },
      data: { activo: false },
    })
  }
}

export const centroCostoService = new CentroCostoService()
