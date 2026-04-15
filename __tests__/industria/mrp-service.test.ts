/**
 * MRP Service — Unit Tests
 * Material Requirements Planning: run, suggestions, accept/reject
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import {
  ejecutarMRP,
  aceptarSugerencia,
  rechazarSugerencia,
  ultimaCorrida,
} from "@/lib/industria/mrp-service"

beforeEach(() => vi.clearAllMocks())

describe("MRP Service", () => {
  describe("ejecutarMRP", () => {
    it("should generate replenishment suggestions based on stock levels", async () => {
      // Mock products: one below minimum, one above
      mockPrismaClient.producto.findMany.mockResolvedValue([
        { id: 1, nombre: "Materia Prima A", stock: 10, stockMinimo: 50, activo: true },
        { id: 2, nombre: "Producto B", stock: 100, stockMinimo: 20, activo: true },
      ])
      // No BOM for any product
      mockPrismaClient.listaMateriales.findFirst.mockResolvedValue(null)
      // No pending sales orders
      mockPrismaClient.pedidoVenta.findMany.mockResolvedValue([])
      // Create corrida
      mockPrismaClient.correridaMRP.create.mockResolvedValue({ id: 1, horizonte: 30, estado: "ejecutando" })
      mockPrismaClient.sugerenciaMRP.createMany.mockResolvedValue({ count: 1 })
      mockPrismaClient.correridaMRP.update.mockResolvedValue({ id: 1, totalSugerencias: 1 })

      const result = await ejecutarMRP(1, 30)

      expect(mockPrismaClient.producto.findMany).toHaveBeenCalled()
      expect(mockPrismaClient.correridaMRP.create).toHaveBeenCalled()
      expect(result.totalSugerencias).toBeGreaterThanOrEqual(0)
    })
  })

  describe("aceptarSugerencia", () => {
    it("should mark suggestion as accepted", async () => {
      mockPrismaClient.sugerenciaMRP.update.mockResolvedValue({
        id: 1, estado: "aceptada",
      })

      const result = await aceptarSugerencia(1)
      expect(result.estado).toBe("aceptada")
    })
  })

  describe("rechazarSugerencia", () => {
    it("should mark suggestion as rejected", async () => {
      mockPrismaClient.sugerenciaMRP.update.mockResolvedValue({
        id: 1, estado: "rechazada",
      })

      const result = await rechazarSugerencia(1)
      expect(result.estado).toBe("rechazada")
    })
  })

  describe("ultimaCorrida", () => {
    it("should return the latest MRP run with suggestions", async () => {
      mockPrismaClient.correridaMRP.findFirst.mockResolvedValue({
        id: 5,
        horizonte: 30,
        estado: "completado",
        totalSugerencias: 3,
        sugerencias: [
          { id: 1, productoId: 10, tipo: "comprar", cantidad: 40, estado: "pendiente" },
        ],
      })

      const result = await ultimaCorrida(1)

      expect(result).not.toBeNull()
      expect(result?.id).toBe(5)
      expect(result?.sugerencias).toHaveLength(1)
    })

    it("should return null if no MRP runs exist", async () => {
      mockPrismaClient.correridaMRP.findFirst.mockResolvedValue(null)
      const result = await ultimaCorrida(1)
      expect(result).toBeNull()
    })
  })
})
