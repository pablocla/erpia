/**
 * ActivoFijoService — Unit Tests
 *
 * Tests asset creation, straight-line depreciation calculations,
 * monthly depreciation run, and disposal.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { ActivoFijoService } from "@/lib/contabilidad/activo-fijo-service"

const service = new ActivoFijoService()

beforeEach(() => {
  vi.clearAllMocks()
  // Default: periodo fiscal abierto
  mockPrismaClient.periodoFiscal.findUnique.mockResolvedValue(null)
  mockPrismaClient.periodoFiscal.create.mockResolvedValue({ id: 1, estado: "abierto" })
  mockPrismaClient.configAsientoCuenta.findFirst.mockResolvedValue(null)
})

describe("ActivoFijoService", () => {
  // ─── calcularDepreciacionMensual ──────────────────────────────────────

  describe("calcularDepreciacionMensual", () => {
    it("should calculate straight-line depreciation", () => {
      // (120000 - 20000) / 60 = 1666.67
      const dep = service.calcularDepreciacionMensual(120000, 20000, 60)
      expect(dep).toBeCloseTo(1666.67, 2)
    })

    it("should return 0 when vida util is 0 or negative", () => {
      // Edge: should not divide by zero
      expect(service.calcularDepreciacionMensual(100000, 0, 0)).toBe(0)
      expect(service.calcularDepreciacionMensual(100000, 0, -12)).toBe(0)
    })

    it("should handle zero residual value", () => {
      // (50000 - 0) / 12 = 4166.67
      const dep = service.calcularDepreciacionMensual(50000, 0, 12)
      expect(dep).toBeCloseTo(4166.67, 2)
    })
  })

  // ─── generarCuadroAmortizacion ────────────────────────────────────────

  describe("generarCuadroAmortizacion", () => {
    it("should generate depreciation schedule for full vida util", () => {
      const cuadro = service.generarCuadroAmortizacion(
        60000,                   // valorCompra
        0,                       // valorResidual
        12,                      // vidaUtilMeses
        new Date("2026-01-01"), // fechaCompra
      )

      expect(cuadro).toHaveLength(12)
      
      // Each month: 60000/12 = 5000
      expect(cuadro[0].depreciacion).toBeCloseTo(5000, 2)
      expect(cuadro[0].valorLibros).toBeCloseTo(55000, 2)
      
      // Last month should reach zero (or near-zero)
      const ultimo = cuadro[cuadro.length - 1]
      expect(ultimo.valorLibros).toBeCloseTo(0, 0)
    })
  })

  // ─── crear ────────────────────────────────────────────────────────────

  describe("crear", () => {
    it("should create asset with valorLibros = valorCompra", async () => {
      const input = {
        descripcion: "Computadora Dell",
        categoria: "equipamiento",
        valorCompra: 500000,
        valorResidual: 50000,
        vidaUtilMeses: 36,
        fechaCompra: "2026-01-15",
        empresaId: 1,
      }

      mockPrismaClient.activoFijo.create.mockResolvedValue({
        id: 1,
        ...input,
        valorLibros: 500000,
        estado: "activo",
      })

      const result = await service.crear(input)

      expect(mockPrismaClient.activoFijo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          valorLibros: 500000,
          estado: "activo",
        }),
      })
    })
  })

  // ─── correrDepreciacionMensual ────────────────────────────────────────

  describe("correrDepreciacionMensual", () => {
    it("should depreciate all active assets and generate entries", async () => {
      const mockAssets = [
        {
          id: 1,
          nombre: "PC",
          valorCompra: 120000,
          valorResidual: 0,
          vidaUtilMeses: 12,
          valorLibros: 120000,
          fechaCompra: new Date("2026-01-01"),
          estado: "activo",
        },
      ]

      mockPrismaClient.activoFijo.findMany.mockResolvedValue(mockAssets)
      mockPrismaClient.activoFijo.update.mockResolvedValue({})
      mockPrismaClient.asientoContable.findFirst.mockResolvedValue({ numero: 100 })
      mockPrismaClient.asientoContable.create.mockResolvedValue({ id: 101 })

      const result = await service.correrDepreciacionMensual(3, 2026, 1)

      expect(result.activosProcesados).toBe(1)
      expect(result.totalDepreciacion).toBeCloseTo(10000, 2) // 120000/12
      
      // Should update valorLibros
      expect(mockPrismaClient.activoFijo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            valorLibros: expect.any(Number),
          }),
        })
      )

      // Should generate accounting entry
      expect(mockPrismaClient.asientoContable.create).toHaveBeenCalled()
    })

    it("should skip fully depreciated assets", async () => {
      mockPrismaClient.activoFijo.findMany.mockResolvedValue([
        {
          id: 1,
          valorCompra: 10000,
          valorResidual: 10000, // ya 100% depreciado
          vidaUtilMeses: 12,
          valorLibros: 10000,
          fechaCompra: new Date("2025-01-01"),
          estado: "activo",
        },
      ])

      const result = await service.correrDepreciacionMensual(3, 2026, 1)
      
      // No depreciation for fully depreciated asset
      expect(result.totalDepreciacion).toBe(0)
    })
  })
})
