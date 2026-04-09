/**
 * CuentasService — Unit Tests
 *
 * Tests CC/CP generation from invoices/purchases,
 * payment application, and aging reports.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { CuentasService } from "@/lib/cc-cp/cuentas-service"

const service = new CuentasService()

beforeEach(() => {
  vi.clearAllMocks()
})

describe("CuentasService", () => {
  // ─── generarCCPorFactura ──────────────────────────────────────────────

  describe("generarCCPorFactura", () => {
    it("should NOT create CC for cash sales (contado)", async () => {
      mockPrismaClient.factura.findUnique.mockResolvedValue({
        id: 1,
        total: 12100,
        condicionPago: { cuotas: 1, diasVencimiento: 0, diasAdicionales: null },
        createdAt: new Date(),
      })

      await service.generarCCPorFactura(1)

      expect(mockPrismaClient.cuentaCobrar.create).not.toHaveBeenCalled()
    })

    it("should create CC for credit sales with single installment", async () => {
      mockPrismaClient.factura.findUnique.mockResolvedValue({
        id: 1,
        total: 10000,
        clienteId: 5,
        condicionPago: { cuotas: 1, diasVencimiento: 30, diasAdicionales: null },
        createdAt: new Date("2026-03-01"),
      })
      mockPrismaClient.cuentaCobrar.create.mockResolvedValue({})

      await service.generarCCPorFactura(1)

      expect(mockPrismaClient.cuentaCobrar.create).toHaveBeenCalledTimes(1)
      expect(mockPrismaClient.cuentaCobrar.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          facturaId: 1,
          clienteId: 5,
          montoOriginal: 10000,
          saldo: 10000,
          numeroCuota: 1,
        }),
      })
    })

    it("should split into multiple installments", async () => {
      mockPrismaClient.factura.findUnique.mockResolvedValue({
        id: 2,
        total: 30000,
        clienteId: 3,
        condicionPago: { cuotas: 3, diasVencimiento: 30, diasAdicionales: [60, 90] },
        createdAt: new Date("2026-03-01"),
      })
      mockPrismaClient.cuentaCobrar.create.mockResolvedValue({})

      await service.generarCCPorFactura(2)

      expect(mockPrismaClient.cuentaCobrar.create).toHaveBeenCalledTimes(3)

      // Each installment should be 10000
      const calls = mockPrismaClient.cuentaCobrar.create.mock.calls
      expect(calls[0][0].data.montoOriginal).toBe(10000)
      expect(calls[0][0].data.numeroCuota).toBe(1)
      expect(calls[1][0].data.numeroCuota).toBe(2)
      expect(calls[2][0].data.numeroCuota).toBe(3)

      // Last installment absorbs rounding
      const sum = calls.reduce((s: number, c: any) => s + c[0].data.montoOriginal, 0)
      expect(sum).toBe(30000)
    })
  })

  // ─── aplicarRecibo ─────────────────────────────────────────────────────

  describe("aplicarRecibo", () => {
    it("should apply payment and update CC saldo", async () => {
      mockPrismaClient.recibo.findFirst.mockResolvedValue({ numero: "00000005" })
      mockPrismaClient.recibo.create.mockResolvedValue({ id: 6 })
      mockPrismaClient.cuentaCobrar.findUnique.mockResolvedValue({
        id: 10,
        saldo: 10000,
        montoPagado: 0,
      })
      mockPrismaClient.cuentaCobrar.update.mockResolvedValue({})

      const result = await service.aplicarRecibo(5, [
        { cuentaCobrarId: 10, monto: 10000 },
      ])

      expect(result).toBe(6) // recibo id

      expect(mockPrismaClient.cuentaCobrar.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: {
          montoPagado: 10000,
          saldo: 0,
          estado: "pagada",
        },
      })
    })

    it("should mark as 'parcial' for partial payments", async () => {
      mockPrismaClient.recibo.findFirst.mockResolvedValue(null)
      mockPrismaClient.recibo.create.mockResolvedValue({ id: 1 })
      mockPrismaClient.cuentaCobrar.findUnique.mockResolvedValue({
        id: 10,
        saldo: 10000,
        montoPagado: 0,
      })
      mockPrismaClient.cuentaCobrar.update.mockResolvedValue({})

      await service.aplicarRecibo(5, [
        { cuentaCobrarId: 10, monto: 4000 },
      ])

      expect(mockPrismaClient.cuentaCobrar.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: expect.objectContaining({
          estado: "parcial",
          saldo: 6000,
        }),
      })
    })
  })

  // ─── agingCC ──────────────────────────────────────────────────────────

  describe("agingCC", () => {
    it("should bucket receivables by days overdue", async () => {
      const hoy = new Date()
      const dias = (d: number) => {
        const fecha = new Date(hoy)
        fecha.setDate(fecha.getDate() - d)
        return fecha
      }

      mockPrismaClient.cuentaCobrar.findMany.mockResolvedValue([
        { id: 1, saldo: 1000, fechaVencimiento: dias(-5), estado: "pendiente", cliente: { id: 1, nombre: "A", cuit: "1" } }, // not overdue
        { id: 2, saldo: 2000, fechaVencimiento: dias(15), estado: "pendiente", cliente: { id: 2, nombre: "B", cuit: "2" } }, // 15 days overdue → d30
        { id: 3, saldo: 3000, fechaVencimiento: dias(45), estado: "pendiente", cliente: { id: 3, nombre: "C", cuit: "3" } }, // 45 days → d60
        { id: 4, saldo: 5000, fechaVencimiento: dias(100), estado: "pendiente", cliente: { id: 4, nombre: "D", cuit: "4" } }, // 100 days → mas90
      ])
      mockPrismaClient.cuentaCobrar.update.mockResolvedValue({})

      const result = await service.agingCC()

      expect(result.buckets.corriente).toBe(1000)
      expect(result.buckets.d30).toBe(2000)
      expect(result.buckets.d60).toBe(3000)
      expect(result.buckets.mas90).toBe(5000)
      expect(result.total).toBe(11000)
    })
  })
})
