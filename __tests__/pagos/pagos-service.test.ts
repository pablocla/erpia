/**
 * PagosService — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { PagosService } from "@/lib/pagos/pagos-service"

const service = new PagosService()

beforeEach(() => {
  vi.clearAllMocks()
})

describe("PagosService", () => {
  describe("listarOrdenesPago", () => {
    it("should scope by empresa and map numeric fields", async () => {
      mockPrismaClient.ordenPago.findMany.mockResolvedValue([
        {
          id: 5,
          montoTotal: "1200.75",
          totalRetenciones: "200.25",
          netoPagado: "1000.50",
          fecha: new Date(),
          medioPago: "transferencia",
          proveedor: { id: 9, nombre: "Proveedor Z", cuit: "20333444555" },
          items: [{ cuentaPagarId: 8, montoPagado: "1000.50" }],
        },
      ])
      mockPrismaClient.ordenPago.count.mockResolvedValue(1)

      const result = await service.listarOrdenesPago({ empresaId: 3, proveedorId: 9 })

      expect(mockPrismaClient.ordenPago.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { proveedor: { empresaId: 3 }, proveedorId: 9 },
        })
      )
      expect(result.total).toBe(1)
      expect(result.data[0].montoTotal).toBe(1200.75)
      expect(result.data[0].totalRetenciones).toBe(200.25)
      expect(result.data[0].items[0].montoPagado).toBe(1000.5)
    })
  })
})
