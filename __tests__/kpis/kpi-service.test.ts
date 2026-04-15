/**
 * KPI Service — Unit Tests
 * Real-time KPI calculation and daily snapshots
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { calcularKPIs, guardarSnapshotDiario } from "@/lib/kpis/kpi-service"

beforeEach(() => vi.clearAllMocks())

describe("KPI Service", () => {
  describe("calcularKPIs", () => {
    it("should return an array of KPI results", async () => {
      // Mock all aggregate queries
      mockPrismaClient.factura.aggregate
        .mockResolvedValueOnce({ _sum: { total: 250000 }, _count: 12 })   // VENTA_DIA
        .mockResolvedValueOnce({ _sum: { total: 5000000 }, _count: 200 }) // VENTA_MES
        .mockResolvedValueOnce({ _sum: { total: 4000000 } })              // ventasDiarias30d
      mockPrismaClient.factura.count.mockResolvedValue(15) // FACTURAS_DIA

      mockPrismaClient.cuentaCobrar.aggregate
        .mockResolvedValueOnce({ _sum: { saldo: 1200000 } })  // CxC pendientes
        .mockResolvedValueOnce({ _sum: { saldo: 300000 } })   // CxC vencidas
      mockPrismaClient.cuentaPagar.aggregate.mockResolvedValue({ _sum: { saldo: 800000 } })
      mockPrismaClient.compra.aggregate.mockResolvedValue({ _sum: { total: 900000 } })

      // Stock bajo mínimo (count + findMany fallback)
      mockPrismaClient.producto.count.mockResolvedValue(5)
      mockPrismaClient.producto.findMany.mockResolvedValue([
        { stock: 2, stockMinimo: 10 },
        { stock: 5, stockMinimo: 20 },
        { stock: 100, stockMinimo: 10 },
      ])

      // Previous period snapshot for trend
      mockPrismaClient.kPISnapshot.findFirst.mockResolvedValue(null)
      // KPI definitions for trend calculation
      mockPrismaClient.kPIDefinicion.findMany.mockResolvedValue([])

      const kpis = await calcularKPIs(1)

      expect(Array.isArray(kpis)).toBe(true)
      expect(kpis.length).toBeGreaterThan(0)

      // Check structure of first KPI
      const ventaDia = kpis.find(k => k.codigo === "VENTA_DIA")
      expect(ventaDia).toBeDefined()
      expect(ventaDia!.nombre).toBe("Ventas del día")
      expect(ventaDia!.unidad).toBe("ARS")
      expect(ventaDia!.valor).toBe(250000)

      // Check ticket promedio
      const ticket = kpis.find(k => k.codigo === "TICKET_PROMEDIO")
      expect(ticket).toBeDefined()
      expect(ticket!.valor).toBe(25000) // 5000000 / 200

      // Check stock
      const stockBajo = kpis.find(k => k.codigo === "STOCK_BAJO_MINIMO")
      expect(stockBajo).toBeDefined()
      expect(stockBajo!.valor).toBe(2)
    })
  })

  describe("guardarSnapshotDiario", () => {
    it("should save KPI snapshots for each metric", async () => {
      // Stub calcularKPIs dependencies
      mockPrismaClient.factura.aggregate.mockResolvedValue({ _sum: { total: 100000 }, _count: 5 })
      mockPrismaClient.factura.count.mockResolvedValue(5)
      mockPrismaClient.cuentaCobrar.aggregate.mockResolvedValue({ _sum: { saldo: 500000 } })
      mockPrismaClient.cuentaPagar.aggregate.mockResolvedValue({ _sum: { saldo: 300000 } })
      mockPrismaClient.compra.aggregate.mockResolvedValue({ _sum: { total: 200000 } })
      mockPrismaClient.producto.count.mockResolvedValue(0)
      mockPrismaClient.producto.findMany.mockResolvedValue([])
      mockPrismaClient.kPISnapshot.findFirst.mockResolvedValue(null)
      mockPrismaClient.kPIDefinicion.findMany.mockResolvedValue([])
      mockPrismaClient.kPISnapshot.upsert.mockResolvedValue({ id: 1 })
      mockPrismaClient.kPIDefinicion.findUnique.mockResolvedValue(null)
      mockPrismaClient.kPIDefinicion.create.mockImplementation(async () => ({
        id: Math.floor(Math.random() * 1000),
        codigo: "TEST",
      }))
      mockPrismaClient.kPIDefinicion.upsert.mockResolvedValue({ id: 1 })
      mockPrismaClient.kPISnapshot.create.mockResolvedValue({ id: 1 })

      const result = await guardarSnapshotDiario(1)

      expect(result.guardados).toBeGreaterThan(0)
      expect(mockPrismaClient.kPIDefinicion.create).toHaveBeenCalled()
    })
  })
})
