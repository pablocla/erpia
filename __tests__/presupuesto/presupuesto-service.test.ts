/**
 * Presupuesto Service — Unit Tests
 * Budget creation, lines, execution tracking, reporting
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import {
  crearPresupuesto,
  agregarLineaPresupuesto,
  reportePresupuestoVsReal,
} from "@/lib/presupuesto/presupuesto-service"

beforeEach(() => vi.clearAllMocks())

describe("Presupuesto Service", () => {
  describe("crearPresupuesto", () => {
    it("should create a new budget", async () => {
      mockPrismaClient.presupuestoGasto.create.mockResolvedValue({
        id: 1, nombre: "Operativo 2025", ejercicio: 2025, estado: "borrador",
      })

      const result = await crearPresupuesto({
        empresaId: 1,
        nombre: "Operativo 2025",
        ejercicio: 2025,
      })

      expect(result.nombre).toBe("Operativo 2025")
      expect(mockPrismaClient.presupuestoGasto.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nombre: "Operativo 2025",
            ejercicio: 2025,
            estado: "borrador",
            tipo: "anual",
            empresaId: 1,
          }),
        }),
      )
    })
  })

  describe("agregarLineaPresupuesto", () => {
    it("should add a budget line item", async () => {
      mockPrismaClient.lineaPresupuestoGasto.create.mockResolvedValue({
        id: 1, mes: 3, montoPresupuestado: 500000, montoEjecutado: 0, montoComprometido: 0,
      })
      // Mock for recalcularTotal
      mockPrismaClient.lineaPresupuestoGasto.findMany.mockResolvedValue([
        { montoPresupuestado: 500000 },
      ])
      mockPrismaClient.presupuestoGasto.update.mockResolvedValue({ id: 1 })

      const result = await agregarLineaPresupuesto({
        presupuestoId: 1,
        mes: 3,
        montoPresupuestado: 500000,
      })

      expect(result.montoPresupuestado).toBe(500000)
      expect(result.montoEjecutado).toBe(0)
    })
  })

  describe("reportePresupuestoVsReal", () => {
    it("should return report with execution percentages", async () => {
      mockPrismaClient.presupuestoGasto.findFirst.mockResolvedValue({
        id: 1,
        nombre: "Operativo 2025",
        ejercicio: 2025,
        estado: "aprobado",
        lineas: [
          { id: 1, mes: 1, montoPresupuestado: 1000000, montoEjecutado: 700000, montoComprometido: 50000 },
          { id: 2, mes: 2, montoPresupuestado: 1200000, montoEjecutado: 1200000, montoComprometido: 100000 },
        ],
      })

      const result = await reportePresupuestoVsReal(1, 2025)

      expect(result).not.toBeNull()
      expect(result!.presupuesto.nombre).toBe("Operativo 2025")
      expect(result!.lineas).toHaveLength(2)

      // Verify calculated fields
      const linea1 = result!.lineas[0]
      expect(linea1.totalUsado).toBe(750000) // 700k + 50k
      expect(linea1.disponible).toBe(250000) // 1M - 750k
      expect(linea1.porcentaje).toBe(75) // 75%
      expect(linea1.nivel).toBe("verde") // 75% → verde (<80%)
    })

    it("should return null when no budget exists", async () => {
      mockPrismaClient.presupuestoGasto.findFirst.mockResolvedValue(null)
      const result = await reportePresupuestoVsReal(1, 2025)
      expect(result).toBeNull()
    })
  })
})
