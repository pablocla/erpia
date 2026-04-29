/**
 * StockService — Unit Tests
 *
 * Tests automatic stock decrement on sale, increment on purchase,
 * reentry on credit note, and stock alerts.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

// We need to reset module cache so stock-service re-registers with fresh mocks
let StockService: any

beforeEach(async () => {
  vi.clearAllMocks()

  // Re-import to get fresh event bus registrations
  const mod = await import("@/lib/stock/stock-service")
  StockService = mod.StockService
})

describe("StockService", () => {
  // ─── decrementarStockPorFactura ────────────────────────────────────────

  describe("decrementarStockPorFactura", () => {
    it("should decrement stock for each line with productoId", async () => {
      const mockFactura = {
        id: 1,
        tipo: "A",
        puntoVenta: 1,
        numero: 100,
        lineas: [
          { productoId: 10, cantidad: 5, descripcion: "Producto A" },
          { productoId: 20, cantidad: 3, descripcion: "Producto B" },
          { productoId: null, cantidad: 1, descripcion: "Servicio sin stock" },
        ],
      }

      const productoDB: Record<number, any> = {
        10: { id: 10, stock: 100, stockMinimo: 5, nombre: "A" },
        20: { id: 20, stock: 50, stockMinimo: 10, nombre: "B" },
      }

      mockPrismaClient.factura.findUnique.mockResolvedValue(mockFactura)
      mockPrismaClient.listaMateriales.findMany.mockResolvedValue([])
      mockPrismaClient.producto.findUnique.mockImplementation(({ where }: any) =>
        Promise.resolve(productoDB[where.id] ?? null)
      )
      mockPrismaClient.producto.update.mockResolvedValue({})
      mockPrismaClient.movimientoStock.create.mockResolvedValue({})
      mockPrismaClient.configuracionFuncional.findMany.mockResolvedValue([])
      mockPrismaClient.handlerLog.create.mockResolvedValue({})

      const service = new StockService()
      await service.decrementarStockPorFactura(1)

      // Should skip null productoId line
      expect(mockPrismaClient.producto.update).toHaveBeenCalledTimes(2)

      // First product: 100 - 5 = 95
      expect(mockPrismaClient.producto.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { stock: 95 },
      })

      // Second product: 50 - 3 = 47
      expect(mockPrismaClient.producto.update).toHaveBeenCalledWith({
        where: { id: 20 },
        data: { stock: 47 },
      })

      // Should create 2 MovimientoStock records (salida)
      expect(mockPrismaClient.movimientoStock.create).toHaveBeenCalledTimes(2)
    })

    it("should skip if factura not found", async () => {
      mockPrismaClient.factura.findUnique.mockResolvedValue(null)
      mockPrismaClient.listaMateriales.findMany.mockResolvedValue([])

      const service = new StockService()
      await service.decrementarStockPorFactura(999)

      expect(mockPrismaClient.producto.update).not.toHaveBeenCalled()
    })
  })

  // ─── incrementarStockPorCompra ────────────────────────────────────────

  describe("incrementarStockPorCompra", () => {
    it("should increment stock for each line with productoId", async () => {
      const mockCompra = {
        id: 1,
        tipo: "A",
        puntoVenta: "0001",
        numero: "00000050",
        lineas: [
          { productoId: 10, cantidad: 20 },
        ],
      }

      mockPrismaClient.compra.findUnique.mockResolvedValue(mockCompra)
      mockPrismaClient.producto.findUnique.mockResolvedValue({
        id: 10, stock: 80, stockMinimo: 5, nombre: "A",
      })
      mockPrismaClient.producto.update.mockResolvedValue({})
      mockPrismaClient.movimientoStock.create.mockResolvedValue({})

      const service = new StockService()
      await service.incrementarStockPorCompra(1)

      // 80 + 20 = 100
      expect(mockPrismaClient.producto.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { stock: 100 },
      })
    })
  })

  // ─── reingresarStockPorNC ─────────────────────────────────────────────

  describe("reingresarStockPorNC", () => {
    it("should reenter all products from original factura", async () => {
      const mockNC = {
        id: 1,
        tipo: "A",
        puntoVenta: 1,
        numero: 1,
        factura: {
          lineas: [
            { productoId: 10, cantidad: 2 },
            { productoId: 30, cantidad: 1 },
          ],
        },
      }

      const productoDB: Record<number, any> = {
        10: { id: 10, stock: 8, stockMinimo: 5, nombre: "A" },
        30: { id: 30, stock: 0, stockMinimo: 1, nombre: "C" },
      }

      mockPrismaClient.notaCredito.findUnique.mockResolvedValue(mockNC)
      mockPrismaClient.producto.findUnique.mockImplementation(({ where }: any) =>
        Promise.resolve(productoDB[where.id] ?? null)
      )
      mockPrismaClient.producto.update.mockResolvedValue({})
      mockPrismaClient.movimientoStock.create.mockResolvedValue({})
      mockPrismaClient.configuracionFuncional.findMany.mockResolvedValue([])
      mockPrismaClient.handlerLog.create.mockResolvedValue({})

      const service = new StockService()
      await service.reingresarStockPorNC(1)

      // Product 10: 8 + 2 = 10
      expect(mockPrismaClient.producto.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { stock: 10 },
      })

      // Product 30: 0 + 1 = 1
      expect(mockPrismaClient.producto.update).toHaveBeenCalledWith({
        where: { id: 30 },
        data: { stock: 1 },
      })
    })

    it("should reenter stock based on NC lineas for partial NC", async () => {
      const mockNC = {
        id: 2,
        tipo: "A",
        puntoVenta: 1,
        numero: 2,
        lineas: [{ productoId: 20, cantidad: 3 }],
        factura: {
          lineas: [
            { productoId: 10, cantidad: 2 },
            { productoId: 20, cantidad: 3 },
          ],
        },
      }

      const productoDB: Record<number, any> = {
        20: { id: 20, stock: 10, stockMinimo: 5, nombre: "B" },
      }

      mockPrismaClient.notaCredito.findUnique.mockResolvedValue(mockNC)
      mockPrismaClient.producto.findUnique.mockImplementation(({ where }: any) =>
        Promise.resolve(productoDB[where.id] ?? null)
      )
      mockPrismaClient.producto.update.mockResolvedValue({})
      mockPrismaClient.movimientoStock.create.mockResolvedValue({})
      mockPrismaClient.configuracionFuncional.findMany.mockResolvedValue([])
      mockPrismaClient.handlerLog.create.mockResolvedValue({})

      const service = new StockService()
      await service.reingresarStockPorNC(2)

      expect(mockPrismaClient.producto.update).toHaveBeenCalledTimes(1)
      expect(mockPrismaClient.producto.update).toHaveBeenCalledWith({
        where: { id: 20 },
        data: { stock: 13 },
      })
    })
  })

  // ─── warehouse stock (depositoId) ─────────────────────────────────────

  describe("warehouse stock (depositoId)", () => {
    it("should upsert StockDeposito when depositoId is provided", async () => {
      const mockFactura = {
        id: 1,
        tipo: "A",
        puntoVenta: 1,
        numero: 1,
        lineas: [{ productoId: 10, cantidad: 2 }],
      }

      mockPrismaClient.factura.findUnique.mockResolvedValue(mockFactura)
      mockPrismaClient.listaMateriales.findMany.mockResolvedValue([])
      mockPrismaClient.producto.findUnique.mockResolvedValue({
        id: 10, stock: 50, stockMinimo: 5, nombre: "A",
      })
      mockPrismaClient.producto.update.mockResolvedValue({})
      mockPrismaClient.stockDeposito.upsert.mockResolvedValue({})
      mockPrismaClient.movimientoStock.create.mockResolvedValue({})

      const service = new StockService()
      await service.decrementarStockPorFactura(1, 3) // depositoId=3

      expect(mockPrismaClient.stockDeposito.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productoId_depositoId: { productoId: 10, depositoId: 3 } },
          update: { cantidad: { increment: -2 } },
        }),
      )
    })
  })

  describe("recetas en factura", () => {
    it("should skip stock decrement for productos con receta", async () => {
      const mockFactura = {
        id: 1,
        tipo: "A",
        puntoVenta: 1,
        numero: 100,
        lineas: [{ productoId: 10, cantidad: 2, descripcion: "Plato" }],
      }

      mockPrismaClient.factura.findUnique.mockResolvedValue(mockFactura)
      mockPrismaClient.listaMateriales.findMany.mockResolvedValue([{ productoId: 10 }])

      const service = new StockService()
      await service.decrementarStockPorFactura(1)

      expect(mockPrismaClient.producto.update).not.toHaveBeenCalled()
    })

    it("should consume ingredientes por receta", async () => {
      const mockFactura = {
        id: 1,
        tipo: "A",
        puntoVenta: 1,
        numero: 100,
        lineas: [{ productoId: 10, cantidad: 2, descripcion: "Plato" }],
      }

      mockPrismaClient.factura.findUnique.mockResolvedValue(mockFactura)
      mockPrismaClient.listaMateriales.findMany.mockResolvedValue([
        {
          id: 99,
          productoId: 10,
          nombre: "Receta Plato",
          componentes: [{ productoId: 50, cantidad: 0.5 }],
        },
      ])

      mockPrismaClient.producto.findUnique.mockResolvedValue({
        id: 50,
        stock: 10,
        stockMinimo: 1,
        nombre: "Insumo",
      })
      mockPrismaClient.producto.update.mockResolvedValue({})
      mockPrismaClient.movimientoStock.create.mockResolvedValue({})

      const service = new StockService()
      await service.consumirIngredientesPorFactura(1)

      // 10 - (2 * 0.5) = 9
      expect(mockPrismaClient.producto.update).toHaveBeenCalledWith({
        where: { id: 50 },
        data: { stock: 9 },
      })
    })
  })
})
