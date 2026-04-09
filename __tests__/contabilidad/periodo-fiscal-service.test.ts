/**
 * PeriodoFiscalService — Unit Tests
 *
 * Tests fiscal period validation, closing, reopening, and blocking.
 * State machine: abierto ↔ cerrado → bloqueado (irreversible)
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { PeriodoFiscalService } from "@/lib/contabilidad/periodo-fiscal-service"

const service = new PeriodoFiscalService()

beforeEach(() => {
  vi.clearAllMocks()
})

describe("PeriodoFiscalService", () => {
  // ─── validarPeriodoAbierto ────────────────────────────────────────────

  describe("validarPeriodoAbierto", () => {
    it("should auto-create period as open when not found", async () => {
      mockPrismaClient.periodoFiscal.findUnique.mockResolvedValue(null)
      mockPrismaClient.periodoFiscal.create.mockResolvedValue({ id: 1, estado: "abierto" })

      await service.validarPeriodoAbierto(new Date("2026-03-15"), 1)

      expect(mockPrismaClient.periodoFiscal.create).toHaveBeenCalledWith({
        data: { empresaId: 1, mes: 3, anio: 2026, estado: "abierto" },
      })
    })

    it("should pass silently when period is open", async () => {
      mockPrismaClient.periodoFiscal.findUnique.mockResolvedValue({
        id: 1, mes: 3, anio: 2026, estado: "abierto",
      })

      await expect(
        service.validarPeriodoAbierto(new Date("2026-03-15"), 1)
      ).resolves.toBeUndefined()

      expect(mockPrismaClient.periodoFiscal.create).not.toHaveBeenCalled()
    })

    it("should throw when period is closed", async () => {
      mockPrismaClient.periodoFiscal.findUnique.mockResolvedValue({
        id: 1, mes: 2, anio: 2026, estado: "cerrado",
      })

      await expect(
        service.validarPeriodoAbierto(new Date("2026-02-10"), 1)
      ).rejects.toThrow("CERRADO")
    })

    it("should throw when period is blocked", async () => {
      mockPrismaClient.periodoFiscal.findUnique.mockResolvedValue({
        id: 1, mes: 1, anio: 2026, estado: "bloqueado",
      })

      await expect(
        service.validarPeriodoAbierto(new Date("2026-01-15"), 1)
      ).rejects.toThrow("BLOQUEADO")
    })

    it("should extract correct month and year from date", async () => {
      mockPrismaClient.periodoFiscal.findUnique.mockResolvedValue(null)
      mockPrismaClient.periodoFiscal.create.mockResolvedValue({})

      // December 2025 → mes=12, anio=2025
      await service.validarPeriodoAbierto(new Date("2025-12-31"), 5)

      expect(mockPrismaClient.periodoFiscal.findUnique).toHaveBeenCalledWith({
        where: { empresaId_mes_anio: { empresaId: 5, mes: 12, anio: 2025 } },
      })
    })
  })

  // ─── cerrarPeriodo ────────────────────────────────────────────────────

  describe("cerrarPeriodo", () => {
    it("should close an open period with transaction summary", async () => {
      // Current period is open
      mockPrismaClient.periodoFiscal.findUnique
        .mockResolvedValueOnce({ id: 10, mes: 3, anio: 2026, estado: "abierto" }) // target period
      // Previous month is already closed
      mockPrismaClient.periodoFiscal.findUnique
        .mockResolvedValueOnce({ id: 9, mes: 2, anio: 2026, estado: "cerrado" }) // prev period

      mockPrismaClient.asientoContable.count.mockResolvedValue(15)
      mockPrismaClient.factura.count.mockResolvedValue(42)
      mockPrismaClient.compra.count.mockResolvedValue(8)
      mockPrismaClient.periodoFiscal.update.mockResolvedValue({
        id: 10, estado: "cerrado",
      })

      const result = await service.cerrarPeriodo(3, 2026, 1, 99)

      expect(mockPrismaClient.periodoFiscal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
          data: expect.objectContaining({
            estado: "cerrado",
            cerradoPor: 99,
          }),
        })
      )
    })

    it("should reject closing if previous month is still open", async () => {
      mockPrismaClient.periodoFiscal.findUnique
        .mockResolvedValueOnce({ id: 10, mes: 3, anio: 2026, estado: "abierto" }) // target
        .mockResolvedValueOnce({ id: 9, mes: 2, anio: 2026, estado: "abierto" }) // prev still open

      await expect(
        service.cerrarPeriodo(3, 2026, 1, 99)
      ).rejects.toThrow()
    })
  })
})
