/**
 * CobrosService — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { CobrosService } from "@/lib/cobros/cobros-service"

const service = new CobrosService()

beforeEach(() => {
  vi.clearAllMocks()
})

describe("CobrosService", () => {
  describe("listarRecibos", () => {
    it("should scope by empresa and map numeric fields", async () => {
      mockPrismaClient.recibo.findMany.mockResolvedValue([
        {
          id: 1,
          montoTotal: "1000.50",
          totalRetenciones: "50.25",
          netoRecibido: "950.25",
          fecha: new Date(),
          medioPago: "efectivo",
          cliente: { id: 7, nombre: "Cliente X", cuit: "20123456789" },
          items: [{ cuentaCobrarId: 3, montoPagado: "950.25" }],
        },
      ])
      mockPrismaClient.recibo.count.mockResolvedValue(1)

      const result = await service.listarRecibos({ empresaId: 10, clienteId: 7 })

      expect(mockPrismaClient.recibo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { cliente: { empresaId: 10 }, clienteId: 7 },
        })
      )
      expect(result.total).toBe(1)
      expect(result.data[0].montoTotal).toBe(1000.5)
      expect(result.data[0].totalRetenciones).toBe(50.25)
      expect(result.data[0].items[0].montoPagado).toBe(950.25)
    })
  })
})
