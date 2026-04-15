/**
 * Toma de Inventario — Service
 *
 * Conteo físico de stock con conciliación contra sistema.
 * Flujo: crear → cargar conteo → procesar diferencias (genera ajustes automáticos).
 */

import { prisma } from "@/lib/prisma"
import { StockService } from "@/lib/stock/stock-service"

const stockService = new StockService()

export class TomaInventarioService {
  /**
   * Create a new inventory count for a specific warehouse.
   * Pre-loads all products with their current system stock.
   */
  async crear(depositoId: number, empresaId: number): Promise<{ id: number; numero: string }> {
    // Generate next numero
    const ultimo = await prisma.tomaInventario.findFirst({
      where: { empresaId },
      orderBy: { id: "desc" },
    })
    const numero = `TI-${String((ultimo?.id ?? 0) + 1).padStart(6, "0")}`

    // Get current stock per product in this warehouse
    const stockDeposito = await prisma.stockDeposito.findMany({
      where: { depositoId },
      include: { producto: { select: { id: true, nombre: true } } },
    })

    const toma = await prisma.tomaInventario.create({
      data: {
        numero,
        depositoId,
        empresaId,
        estado: "borrador",
        lineas: {
          create: stockDeposito.map((sd) => ({
            productoId: sd.productoId,
            stockSistema: sd.cantidad,
          })),
        },
      },
    })

    return { id: toma.id, numero: toma.numero }
  }

  /**
   * Update counted quantities for specific lines.
   */
  async cargarConteo(
    tomaId: number,
    conteos: { lineaId: number; stockContado: number; observaciones?: string }[]
  ): Promise<void> {
    const toma = await prisma.tomaInventario.findUnique({ where: { id: tomaId } })
    if (!toma || toma.estado === "procesada" || toma.estado === "anulada") {
      throw new Error("Toma de inventario no editable")
    }

    // Update to en_conteo if still borrador
    if (toma.estado === "borrador") {
      await prisma.tomaInventario.update({
        where: { id: tomaId },
        data: { estado: "en_conteo" },
      })
    }

    for (const conteo of conteos) {
      await prisma.lineaTomaInventario.update({
        where: { id: conteo.lineaId },
        data: {
          stockContado: conteo.stockContado,
          diferencia: conteo.stockContado - (await prisma.lineaTomaInventario.findUnique({ where: { id: conteo.lineaId } }))!.stockSistema,
          observaciones: conteo.observaciones,
        },
      })
    }
  }

  /**
   * Process the inventory count — generates stock adjustments for all differences.
   */
  async procesar(tomaId: number): Promise<{ ajustesGenerados: number }> {
    const toma = await prisma.tomaInventario.findUnique({
      where: { id: tomaId },
      include: { lineas: true },
    })
    if (!toma) throw new Error("Toma no encontrada")
    if (toma.estado === "procesada") throw new Error("Toma ya procesada")

    let ajustesGenerados = 0

    for (const linea of toma.lineas) {
      if (linea.stockContado === null) continue
      const diferencia = linea.stockContado - linea.stockSistema
      if (Math.abs(diferencia) < 0.001) continue

      // Generate stock adjustment
      await stockService.ajustarStockManual(
        linea.productoId,
        diferencia,
        `Ajuste por Toma de Inventario ${toma.numero}`,
        toma.depositoId,
      )
      ajustesGenerados++
    }

    await prisma.tomaInventario.update({
      where: { id: tomaId },
      data: { estado: "procesada" },
    })

    return { ajustesGenerados }
  }

  /**
   * Get a toma with all its lines and product info.
   */
  async obtener(tomaId: number) {
    return prisma.tomaInventario.findUnique({
      where: { id: tomaId },
      include: {
        lineas: {
          include: {
            tomaInventario: false,
          },
        },
      },
    })
  }

  /**
   * List all tomas for an empresa.
   */
  async listar(empresaId: number) {
    return prisma.tomaInventario.findMany({
      where: { empresaId },
      include: { _count: { select: { lineas: true } } },
      orderBy: { fecha: "desc" },
    })
  }
}

export const tomaInventarioService = new TomaInventarioService()
