/**
 * Comisiones Service — Liquidación de comisiones de vendedores/cobradores
 *
 * Calcula comisiones en base a:
 * - Facturas emitidas por vendedor en un período
 * - Porcentaje de comisión del vendedor (comisionPct)
 * - Base de cálculo: subtotal neto (sin IVA ni percepciones)
 *
 * Genera un resumen por vendedor con detalle de facturas incluidas.
 */

import { prisma } from "@/lib/prisma"

export interface LiquidacionComision {
  vendedorId: number
  vendedorNombre: string
  comisionPct: number
  cantFacturas: number
  baseImponible: number
  comisionCalculada: number
  facturas: Array<{
    id: number
    numero: number
    puntoVenta: number
    tipo: string
    fecha: Date
    subtotal: number
    comision: number
    clienteNombre: string
  }>
}

export interface ResumenComisiones {
  periodo: { desde: Date; hasta: Date }
  vendedores: LiquidacionComision[]
  totalComisiones: number
  totalBaseImponible: number
}

export class ComisionesService {
  /**
   * Liquidar comisiones de todos los vendedores de una empresa en un período.
   */
  async liquidarPeriodo(empresaId: number, desde: Date, hasta: Date): Promise<ResumenComisiones> {
    const vendedores = await prisma.vendedor.findMany({
      where: { activo: true },
    })

    const liquidaciones: LiquidacionComision[] = []

    for (const vendedor of vendedores) {
      const pct = Number(vendedor.comisionPct)
      if (pct <= 0) continue

      const facturas = await prisma.factura.findMany({
        where: {
          empresaId,
          vendedorId: vendedor.id,
          estado: "emitida",
          createdAt: { gte: desde, lte: hasta },
        },
        include: { cliente: { select: { nombre: true } } },
        orderBy: { createdAt: "asc" },
      })

      if (facturas.length === 0) continue

      let baseImponible = 0
      const facturasDetalle = facturas.map(f => {
        const subtotal = f.subtotal
        const comision = subtotal * (pct / 100)
        baseImponible += subtotal
        return {
          id: f.id,
          numero: f.numero,
          puntoVenta: f.puntoVenta,
          tipo: f.tipo,
          fecha: f.createdAt,
          subtotal,
          comision,
          clienteNombre: f.cliente?.nombre ?? "Sin cliente",
        }
      })

      liquidaciones.push({
        vendedorId: vendedor.id,
        vendedorNombre: `${vendedor.nombre}${vendedor.apellido ? ` ${vendedor.apellido}` : ""}`,
        comisionPct: pct,
        cantFacturas: facturas.length,
        baseImponible,
        comisionCalculada: baseImponible * (pct / 100),
        facturas: facturasDetalle,
      })
    }

    return {
      periodo: { desde, hasta },
      vendedores: liquidaciones,
      totalComisiones: liquidaciones.reduce((s, l) => s + l.comisionCalculada, 0),
      totalBaseImponible: liquidaciones.reduce((s, l) => s + l.baseImponible, 0),
    }
  }

  /**
   * Comisiones de un vendedor específico en un período.
   */
  async comisionVendedor(vendedorId: number, empresaId: number, desde: Date, hasta: Date): Promise<LiquidacionComision | null> {
    const vendedor = await prisma.vendedor.findFirst({
      where: { id: vendedorId },
    })
    if (!vendedor) return null

    const pct = Number(vendedor.comisionPct)
    const facturas = await prisma.factura.findMany({
      where: {
        empresaId,
        vendedorId,
        estado: "emitida",
        createdAt: { gte: desde, lte: hasta },
      },
      include: { cliente: { select: { nombre: true } } },
      orderBy: { createdAt: "asc" },
    })

    let baseImponible = 0
    const facturasDetalle = facturas.map(f => {
      const subtotal = f.subtotal
      const comision = subtotal * (pct / 100)
      baseImponible += subtotal
      return {
        id: f.id,
        numero: f.numero,
        puntoVenta: f.puntoVenta,
        tipo: f.tipo,
        fecha: f.createdAt,
        subtotal,
        comision,
        clienteNombre: f.cliente?.nombre ?? "Sin cliente",
      }
    })

    return {
      vendedorId: vendedor.id,
      vendedorNombre: `${vendedor.nombre}${vendedor.apellido ? ` ${vendedor.apellido}` : ""}`,
      comisionPct: pct,
      cantFacturas: facturas.length,
      baseImponible,
      comisionCalculada: baseImponible * (pct / 100),
      facturas: facturasDetalle,
    }
  }
}

export const comisionesService = new ComisionesService()
