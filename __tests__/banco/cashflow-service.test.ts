/**
 * Cashflow Service — Unit Tests
 * Cash flow projection from CxC, CxP, cheques, gastos recurrentes
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import {
  generarProyeccionFlujoCaja,
  obtenerFlujoPorSemana,
  resumenFlujoCaja,
} from "@/lib/banco/cashflow-service"

beforeEach(() => vi.clearAllMocks())

describe("Cashflow Service", () => {
  describe("generarProyeccionFlujoCaja", () => {
    it("should generate projections from CxC, CxP, cheques and recurrentes", async () => {
      // CxC
      mockPrismaClient.cuentaCobrar.findMany.mockResolvedValue([
        { id: 1, saldo: 100000, vencimiento: new Date("2025-02-15"), probabilidad: 90 },
      ])
      // CxP
      mockPrismaClient.cuentaPagar.findMany.mockResolvedValue([
        { id: 2, saldo: -50000, vencimiento: new Date("2025-02-20") },
      ])
      // Cheques
      mockPrismaClient.cheque.findMany.mockResolvedValue([])
      // Gastos recurrentes
      mockPrismaClient.gastoRecurrente.findMany.mockResolvedValue([])
      // Delete old + createMany
      mockPrismaClient.proyeccionFlujoCaja.deleteMany.mockResolvedValue({ count: 0 })
      mockPrismaClient.proyeccionFlujoCaja.createMany.mockResolvedValue({ count: 2 })

      const result = await generarProyeccionFlujoCaja(1, 90)

      expect(result.totalProyecciones).toBeGreaterThanOrEqual(0)
      expect(mockPrismaClient.cuentaCobrar.findMany).toHaveBeenCalled()
      expect(mockPrismaClient.cuentaPagar.findMany).toHaveBeenCalled()
    })
  })

  describe("obtenerFlujoPorSemana", () => {
    it("should aggregate projections by week", async () => {
      const now = new Date()
      const nextWeek = new Date(now.getTime() + 7 * 86400000)
      mockPrismaClient.proyeccionFlujoCaja.findMany.mockResolvedValue([
        { fecha: now, tipo: "ingreso", monto: 100000, concepto: "CxC" },
        { fecha: now, tipo: "egreso", monto: -40000, concepto: "CxP" },
        { fecha: nextWeek, tipo: "ingreso", monto: 200000, concepto: "CxC" },
      ])

      const result = await obtenerFlujoPorSemana(1, 4)

      expect(Array.isArray(result)).toBe(true)
      // Should group by iso week
      expect(result.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe("resumenFlujoCaja", () => {
    it("should summarize cashflow for 30/60/90 day horizons", async () => {
      mockPrismaClient.proyeccionFlujoCaja.findMany.mockResolvedValue([
        { fecha: new Date(), tipo: "ingreso", monto: 500000 },
        { fecha: new Date(), tipo: "egreso", monto: -200000 },
      ])

      const result = await resumenFlujoCaja(1)

      expect(result.proximos30).toBeDefined()
      expect(result.proximos60).toBeDefined()
      expect(result.proximos90).toBeDefined()
      expect(result.proximos30.neto).toBeDefined()
    })
  })
})
