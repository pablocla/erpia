/**
 * Facturación Recurrente Service — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import {
  crearFacturaRecurrente,
  listarFacturasRecurrentes,
  procesarFacturasRecurrentes,
  toggleFacturaRecurrente,
} from "@/lib/ventas/facturacion-recurrente-service"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("Facturación Recurrente Service", () => {
  const empresaId = 1

  describe("crearFacturaRecurrente", () => {
    it("should create with defaults", async () => {
      mockPrismaClient.facturaRecurrente.create.mockResolvedValue({ id: 1 })

      await crearFacturaRecurrente({
        empresaId,
        clienteId: 5,
        concepto: "Alquiler mensual",
        montoNeto: 100000,
      })

      expect(mockPrismaClient.facturaRecurrente.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          empresaId,
          clienteId: 5,
          concepto: "Alquiler mensual",
          montoNeto: 100000,
          alicuotaIva: 21,
          frecuencia: "mensual",
          diaEmision: 1,
          tipoCbte: 6,
        }),
      })
    })
  })

  describe("listarFacturasRecurrentes", () => {
    it("should list scoped by empresa", async () => {
      mockPrismaClient.facturaRecurrente.findMany.mockResolvedValue([])

      await listarFacturasRecurrentes(empresaId)

      expect(mockPrismaClient.facturaRecurrente.findMany).toHaveBeenCalledWith({
        where: { empresaId },
        orderBy: { proximaEmision: "asc" },
      })
    })
  })

  describe("procesarFacturasRecurrentes", () => {
    it("should process active invoices due today", async () => {
      const ahora = new Date()
      mockPrismaClient.facturaRecurrente.findMany.mockResolvedValue([
        {
          id: 1,
          concepto: "Suscripción",
          montoNeto: 10000,
          alicuotaIva: 21,
          frecuencia: "mensual",
          clienteId: 5,
          proximaEmision: ahora,
          fechaFin: null,
          facturasEmitidas: 2,
        },
      ])
      mockPrismaClient.facturaRecurrente.update.mockResolvedValue({ id: 1 })

      const result = await procesarFacturasRecurrentes(empresaId)

      expect(result.procesadas).toBe(1)
      expect(result.facturas[0].monto).toBe(12100) // 10000 + 21%
      expect(mockPrismaClient.facturaRecurrente.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            facturasEmitidas: { increment: 1 },
          }),
        }),
      )
    })

    it("should deactivate past-due items", async () => {
      const pasado = new Date()
      pasado.setDate(pasado.getDate() - 10)
      mockPrismaClient.facturaRecurrente.findMany.mockResolvedValue([
        {
          id: 2,
          fechaFin: pasado,
          proximaEmision: pasado,
          activo: true,
          montoNeto: 1000,
          alicuotaIva: 21,
          frecuencia: "mensual",
          clienteId: 1,
          concepto: "Expired",
        },
      ])
      mockPrismaClient.facturaRecurrente.update.mockResolvedValue({ id: 2 })

      const result = await procesarFacturasRecurrentes(empresaId)

      expect(result.procesadas).toBe(0)
      expect(mockPrismaClient.facturaRecurrente.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { activo: false },
      })
    })
  })

  describe("toggleFacturaRecurrente", () => {
    it("should toggle active state", async () => {
      mockPrismaClient.facturaRecurrente.update.mockResolvedValue({ id: 1, activo: false })

      await toggleFacturaRecurrente(empresaId, 1, false)

      expect(mockPrismaClient.facturaRecurrente.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { activo: false },
      })
    })
  })
})
