/**
 * PresupuestoService — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { PresupuestoService } from "@/lib/ventas/presupuesto-service"

const service = new PresupuestoService()
const EMPRESA = 1

beforeEach(() => {
  vi.clearAllMocks()
  mockPrismaClient.configuracionFuncional.findMany.mockResolvedValue([])
  mockPrismaClient.handlerLog.create.mockResolvedValue({})
  mockPrismaClient.presupuesto.findFirst = vi.fn()
})

describe("PresupuestoService", () => {
  describe("enviar", () => {
    it("should transition from borrador to enviado", async () => {
      mockPrismaClient.presupuesto.findFirst.mockResolvedValue({
        id: 1,
        empresaId: EMPRESA,
        estado: "borrador",
      })
      mockPrismaClient.presupuesto.update.mockResolvedValue({
        id: 1,
        estado: "enviado",
      })

      await service.enviar(EMPRESA, 1)

      expect(mockPrismaClient.presupuesto.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { estado: "enviado" },
        }),
      )
    })

    it("should reject if not in borrador", async () => {
      mockPrismaClient.presupuesto.findFirst.mockResolvedValue({
        id: 1,
        empresaId: EMPRESA,
        estado: "aceptado",
      })

      await expect(service.enviar(EMPRESA, 1)).rejects.toThrow()
    })
  })

  describe("aceptar", () => {
    it("should accept from enviado state", async () => {
      mockPrismaClient.presupuesto.findFirst.mockResolvedValue({
        id: 1,
        empresaId: EMPRESA,
        estado: "enviado",
        clienteId: 2,
        total: 50000,
      })
      mockPrismaClient.presupuesto.update.mockResolvedValue({
        id: 1,
        estado: "aceptado",
      })

      await service.aceptar(EMPRESA, 1)

      expect(mockPrismaClient.presupuesto.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { estado: "aceptado" },
        }),
      )
    })
  })

  describe("convertirAPedido", () => {
    it("should reject if state is not aceptado", async () => {
      mockPrismaClient.presupuesto.findFirst.mockResolvedValue({
        id: 1,
        empresaId: EMPRESA,
        estado: "borrador",
        lineas: [],
      })

      await expect(service.convertirAPedido(EMPRESA, 1)).rejects.toThrow()
    })
  })

  describe("duplicar", () => {
    it("should throw if presupuesto not found", async () => {
      mockPrismaClient.presupuesto.findFirst.mockResolvedValue(null)

      await expect(service.duplicar(EMPRESA, 999)).rejects.toThrow()
    })
  })
})