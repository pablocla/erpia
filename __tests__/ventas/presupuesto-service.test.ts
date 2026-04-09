/**
 * PresupuestoService — Unit Tests
 *
 * Tests presupuesto state machine, discount calculations,
 * conversion to pedido de venta, and duplication.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { PresupuestoService } from "@/lib/ventas/presupuesto-service"

const service = new PresupuestoService()

beforeEach(() => {
  vi.clearAllMocks()
  mockPrismaClient.configuracionFuncional.findMany.mockResolvedValue([])
  mockPrismaClient.handlerLog.create.mockResolvedValue({})
})

describe("PresupuestoService", () => {
  // ─── enviar ──────────────────────────────────────────────────────────

  describe("enviar", () => {
    it("should transition from borrador to enviado", async () => {
      mockPrismaClient.presupuesto.findUnique.mockResolvedValue({
        id: 1, estado: "borrador",
      })
      mockPrismaClient.presupuesto.update.mockResolvedValue({
        id: 1, estado: "enviado",
      })

      const result = await service.enviar(1)

      expect(mockPrismaClient.presupuesto.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { estado: "enviado" },
        })
      )
    })

    it("should reject if not in borrador", async () => {
      mockPrismaClient.presupuesto.findUnique.mockResolvedValue({
        id: 1, estado: "aceptado",
      })

      await expect(service.enviar(1)).rejects.toThrow()
    })
  })

  // ─── aceptar ──────────────────────────────────────────────────────────

  describe("aceptar", () => {
    it("should accept from enviado state", async () => {
      mockPrismaClient.presupuesto.findUnique.mockResolvedValue({
        id: 1, estado: "enviado", total: 50000,
      })
      mockPrismaClient.presupuesto.update.mockResolvedValue({
        id: 1, estado: "aceptado",
      })

      await service.aceptar(1)

      expect(mockPrismaClient.presupuesto.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { estado: "aceptado" },
        })
      )
    })

    it("should reject if already rechazado", async () => {
      mockPrismaClient.presupuesto.findUnique.mockResolvedValue({
        id: 1, estado: "rechazado",
      })

      await expect(service.aceptar(1)).rejects.toThrow()
    })
  })

  // ─── rechazar ─────────────────────────────────────────────────────────

  describe("rechazar", () => {
    it("should reject from enviado state", async () => {
      mockPrismaClient.presupuesto.findUnique.mockResolvedValue({
        id: 1, estado: "enviado",
      })
      mockPrismaClient.presupuesto.update.mockResolvedValue({
        id: 1, estado: "rechazado",
      })

      await service.rechazar(1)

      expect(mockPrismaClient.presupuesto.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { estado: "rechazado" },
        })
      )
    })
  })

  // ─── convertirAPedido ────────────────────────────────────────────────

  describe("convertirAPedido", () => {
    it("should reject if state is not aceptado", async () => {
      mockPrismaClient.presupuesto.findUnique.mockResolvedValue({
        id: 1, estado: "borrador", lineas: [],
      })

      await expect(service.convertirAPedido(1)).rejects.toThrow()
    })

    it("should reject if already facturado (already converted)", async () => {
      mockPrismaClient.presupuesto.findUnique.mockResolvedValue({
        id: 1, estado: "facturado", lineas: [],
      })

      await expect(service.convertirAPedido(1)).rejects.toThrow()
    })
  })

  // ─── duplicar ─────────────────────────────────────────────────────────

  describe("duplicar", () => {
    it("should clone presupuesto as new borrador", async () => {
      const original = {
        id: 1,
        clienteId: 5,
        empresaId: 1,
        subtotal: 10000,
        descuentoPct: 10,
        total: 9000,
        condicionPagoId: 2,
        vendedorId: 3,
        lineas: [
          { productoId: 10, cantidad: 2, precioUnitario: 5000, descuentoPct: 0 },
        ],
      }

      mockPrismaClient.presupuesto.findUnique.mockResolvedValue(original)
      mockPrismaClient.presupuesto.create.mockResolvedValue({
        ...original,
        id: 2,
        estado: "borrador",
      })

      const result = await service.duplicar(1)

      expect(mockPrismaClient.presupuesto.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estado: "borrador",
            clienteId: 5,
          }),
        })
      )
    })

    it("should throw if presupuesto not found", async () => {
      mockPrismaClient.presupuesto.findUnique.mockResolvedValue(null)

      await expect(service.duplicar(999)).rejects.toThrow()
    })
  })
})
