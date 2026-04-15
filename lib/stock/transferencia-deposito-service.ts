/**
 * Transferencia entre Depósitos — Service
 *
 * Mueve stock de un depósito a otro con trazabilidad completa.
 * Usa StockDeposito para tracked per-warehouse quantities.
 */

import { prisma } from "@/lib/prisma"

interface LineaTransferencia {
  productoId: number
  cantidad: number
}

export class TransferenciaDepositoService {
  /**
   * Execute a warehouse-to-warehouse stock transfer.
   * Creates TransferenciaDeposito + lines, adjusts StockDeposito, creates MovimientoStock pairs.
   */
  async ejecutar(
    depositoOrigenId: number,
    depositoDestinoId: number,
    lineas: LineaTransferencia[],
    empresaId: number,
    observaciones?: string,
  ): Promise<{ id: number; numero: string }> {
    if (depositoOrigenId === depositoDestinoId) {
      throw new Error("Origen y destino no pueden ser el mismo depósito")
    }

    // Validate stock availability
    for (const linea of lineas) {
      const stock = await prisma.stockDeposito.findUnique({
        where: { productoId_depositoId: { productoId: linea.productoId, depositoId: depositoOrigenId } },
      })
      const disponible = (stock?.cantidad ?? 0) - (stock?.reservado ?? 0)
      if (disponible < linea.cantidad) {
        throw new Error(`Stock insuficiente para producto ${linea.productoId}. Disponible: ${disponible}, solicitado: ${linea.cantidad}`)
      }
    }

    // Generate numero
    const ultimo = await prisma.transferenciaDeposito.findFirst({ orderBy: { id: "desc" } })
    const numero = `TD-${String((ultimo?.id ?? 0) + 1).padStart(6, "0")}`

    const result = await prisma.$transaction(async (tx) => {
      const transferencia = await tx.transferenciaDeposito.create({
        data: {
          numero,
          depositoOrigenId,
          depositoDestinoId,
          estado: "completada",
          observaciones,
          lineas: {
            create: lineas.map((l) => ({
              productoId: l.productoId,
              cantidad: l.cantidad,
            })),
          },
        },
      })

      // Adjust stock per product
      for (const linea of lineas) {
        // Decrease origin
        await tx.stockDeposito.update({
          where: { productoId_depositoId: { productoId: linea.productoId, depositoId: depositoOrigenId } },
          data: { cantidad: { decrement: linea.cantidad } },
        })

        // Increase destination (upsert)
        await tx.stockDeposito.upsert({
          where: { productoId_depositoId: { productoId: linea.productoId, depositoId: depositoDestinoId } },
          update: { cantidad: { increment: linea.cantidad } },
          create: { productoId: linea.productoId, depositoId: depositoDestinoId, cantidad: linea.cantidad },
        })

        // Audit trail
        await tx.movimientoStock.create({
          data: {
            tipo: "transferencia_salida",
            cantidad: -linea.cantidad,
            motivo: `Transferencia ${numero} → Dep. destino #${depositoDestinoId}`,
            productoId: linea.productoId,
            depositoId: depositoOrigenId,
          },
        })
        await tx.movimientoStock.create({
          data: {
            tipo: "transferencia_entrada",
            cantidad: linea.cantidad,
            motivo: `Transferencia ${numero} ← Dep. origen #${depositoOrigenId}`,
            productoId: linea.productoId,
            depositoId: depositoDestinoId,
          },
        })
      }

      return transferencia
    })

    return { id: result.id, numero: result.numero }
  }

  /**
   * List all transfers for an empresa's warehouses.
   */
  async listar(empresaId: number) {
    // Get deposits for empresa
    const depositos = await prisma.deposito.findMany({
      where: { empresaId },
      select: { id: true },
    })
    const depositoIds = depositos.map((d) => d.id)

    return prisma.transferenciaDeposito.findMany({
      where: {
        OR: [
          { depositoOrigenId: { in: depositoIds } },
          { depositoDestinoId: { in: depositoIds } },
        ],
      },
      include: {
        lineas: true,
        _count: { select: { lineas: true } },
      },
      orderBy: { fecha: "desc" },
    })
  }
}

export const transferenciaDepositoService = new TransferenciaDepositoService()
