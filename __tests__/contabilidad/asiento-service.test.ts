/**
 * AsientoService — Unit Tests
 *
 * Tests the accounting entry generation for sales, purchases,
 * manual entries, and balance reports.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { AsientoService } from "@/lib/contabilidad/asiento-service"

const service = new AsientoService()

beforeEach(() => {
  vi.clearAllMocks()
  // Default: periodo fiscal abierto (no record → auto-create as open)
  mockPrismaClient.periodoFiscal.findUnique.mockResolvedValue(null)
  mockPrismaClient.periodoFiscal.create.mockResolvedValue({ id: 1, estado: "abierto" })
  // Default: no custom account config → fallback to hardcoded labels
  mockPrismaClient.configAsientoCuenta.findFirst.mockResolvedValue(null)
})

describe("AsientoService", () => {
  // ─── generarAsientoVenta ──────────────────────────────────────────────────

  describe("generarAsientoVenta", () => {
    it("should generate a balanced journal entry for a sale", async () => {
      const mockFactura = {
        id: 1,
        tipo: "A",
        numero: 1,
        subtotal: 10000,
        iva: 2100,
        total: 12100,
        totalPercepciones: 0,
        totalRetenciones: 0,
        createdAt: new Date("2026-03-15"),
        cliente: { nombre: "Test Cliente" },
        lineas: [
          { descripcion: "Producto A", cantidad: 1, precioUnitario: 10000, porcentajeIva: 21 },
        ],
      }

      mockPrismaClient.factura.findUnique.mockResolvedValue(mockFactura)
      mockPrismaClient.asientoContable.findFirst.mockResolvedValue({ numero: 5 })
      mockPrismaClient.asientoContable.create.mockResolvedValue({ id: 6, numero: 6 })

      await service.generarAsientoVenta(1)

      expect(mockPrismaClient.factura.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { lineas: true, cliente: true },
      })

      const createCall = mockPrismaClient.asientoContable.create.mock.calls[0][0]
      expect(createCall.data.numero).toBe(6)
      expect(createCall.data.tipo).toBe("venta")
      expect(createCall.data.facturaId).toBe(1)

      // Verify partida doble balance: Debe = Haber
      const movs = createCall.data.movimientos.create
      const totalDebe = movs.reduce((s: number, m: any) => s + m.debe, 0)
      const totalHaber = movs.reduce((s: number, m: any) => s + m.haber, 0)
      expect(totalDebe).toBeCloseTo(totalHaber, 2)

      // Debe: Caja = total
      expect(movs[0].cuenta).toBe("1.1 Caja")
      expect(movs[0].debe).toBe(12100)

      // Haber: Ventas = subtotal
      expect(movs[1].cuenta).toBe("4.1 Ventas")
      expect(movs[1].haber).toBe(10000)

      // Haber: IVA Débito Fiscal
      expect(movs[2].cuenta).toBe("2.2 IVA Débito Fiscal")
      expect(movs[2].haber).toBe(2100)
    })

    it("should include percepciones when totalPercepciones > 0", async () => {
      const mockFactura = {
        id: 2,
        tipo: "A",
        numero: 2,
        subtotal: 5000,
        iva: 1050,
        total: 6050,
        totalPercepciones: 150,
        totalRetenciones: 0,
        createdAt: new Date(),
        cliente: { nombre: "Cliente con Percepciones" },
        lineas: [],
      }

      mockPrismaClient.factura.findUnique.mockResolvedValue(mockFactura)
      mockPrismaClient.asientoContable.findFirst.mockResolvedValue(null)
      mockPrismaClient.asientoContable.create.mockResolvedValue({ id: 1, numero: 1 })

      await service.generarAsientoVenta(2)

      const createCall = mockPrismaClient.asientoContable.create.mock.calls[0][0]
      const movs = createCall.data.movimientos.create

      // Should have 4 movements (Caja, Ventas, IVA, Percepciones)
      expect(movs).toHaveLength(4)
      expect(movs[3].cuenta).toBe("2.3 Percepciones a Pagar")
      expect(movs[3].haber).toBe(150)

      // Debe should include percepciones
      expect(movs[0].debe).toBe(6200) // 6050 + 150
    })

    it("should throw if factura not found", async () => {
      mockPrismaClient.factura.findUnique.mockResolvedValue(null)

      await expect(service.generarAsientoVenta(999)).rejects.toThrow("Factura no encontrada")
    })
  })

  // ─── generarAsientoCompra ─────────────────────────────────────────────────

  describe("generarAsientoCompra", () => {
    it("should generate a balanced journal entry for a purchase", async () => {
      const mockCompra = {
        id: 1,
        tipo: "A",
        numero: "00000001",
        subtotal: 8000,
        iva: 1680,
        total: 9680,
        fecha: new Date("2026-03-20"),
        proveedor: { nombre: "Proveedor Test" },
        lineas: [],
      }

      mockPrismaClient.compra.findUnique.mockResolvedValue(mockCompra)
      mockPrismaClient.asientoContable.findFirst.mockResolvedValue({ numero: 10 })
      mockPrismaClient.asientoContable.create.mockResolvedValue({ id: 11, numero: 11 })

      await service.generarAsientoCompra(1)

      const createCall = mockPrismaClient.asientoContable.create.mock.calls[0][0]
      const movs = createCall.data.movimientos.create

      // Verify partida doble
      const totalDebe = movs.reduce((s: number, m: any) => s + m.debe, 0)
      const totalHaber = movs.reduce((s: number, m: any) => s + m.haber, 0)
      expect(totalDebe).toBeCloseTo(totalHaber, 2)

      // Debe: Mercaderías + IVA Crédito = total
      expect(movs[0].cuenta).toBe("1.4 Mercaderías")
      expect(movs[0].debe).toBe(8000)
      expect(movs[1].cuenta).toBe("1.6 IVA Crédito Fiscal")
      expect(movs[1].debe).toBe(1680)

      // Haber: Proveedores
      expect(movs[2].cuenta).toBe("2.1 Proveedores")
      expect(movs[2].haber).toBe(9680)
    })

    it("should throw if compra not found", async () => {
      mockPrismaClient.compra.findUnique.mockResolvedValue(null)

      await expect(service.generarAsientoCompra(999)).rejects.toThrow("Compra no encontrada")
    })
  })

  // ─── crearAsientoManual ───────────────────────────────────────────────────

  describe("crearAsientoManual", () => {
    it("should create a manual entry when balanced", async () => {
      mockPrismaClient.asientoContable.create.mockResolvedValue({ id: 1 })

      const data = {
        fecha: new Date(),
        numero: 1,
        descripcion: "Asiento manual de prueba",
        tipo: "manual" as const,
        movimientos: [
          { cuenta: "1.1 Caja", debe: 1000, haber: 0 },
          { cuenta: "4.1 Ventas", debe: 0, haber: 1000 },
        ],
      }

      await service.crearAsientoManual(data)

      expect(mockPrismaClient.asientoContable.create).toHaveBeenCalledTimes(1)
    })

    it("should reject unbalanced entries (Debe != Haber)", async () => {
      const data = {
        fecha: new Date(),
        numero: 1,
        descripcion: "Desbalanceado",
        tipo: "manual" as const,
        movimientos: [
          { cuenta: "1.1 Caja", debe: 1000, haber: 0 },
          { cuenta: "4.1 Ventas", debe: 0, haber: 500 }, // 500 short
        ],
      }

      await expect(service.crearAsientoManual(data)).rejects.toThrow("balanceado")
    })
  })

  // ─── obtenerBalanceSumas ──────────────────────────────────────────────────

  describe("obtenerBalanceSumas", () => {
    it("should aggregate movements by account", async () => {
      mockPrismaClient.movimientoContable.findMany.mockResolvedValue([
        { cuenta: "1.1 Caja", debe: 12100, haber: 0, asiento: {} },
        { cuenta: "4.1 Ventas", debe: 0, haber: 10000, asiento: {} },
        { cuenta: "2.2 IVA Débito Fiscal", debe: 0, haber: 2100, asiento: {} },
        { cuenta: "1.1 Caja", debe: 5000, haber: 0, asiento: {} },
        { cuenta: "4.1 Ventas", debe: 0, haber: 5000, asiento: {} },
      ])

      const result = await service.obtenerBalanceSumas()

      const caja = result.find((r) => r.cuenta === "1.1 Caja")
      expect(caja?.debe).toBe(17100)
      expect(caja?.haber).toBe(0)
      expect(caja?.saldo).toBe(17100)

      const ventas = result.find((r) => r.cuenta === "4.1 Ventas")
      expect(ventas?.debe).toBe(0)
      expect(ventas?.haber).toBe(15000)
      expect(ventas?.saldo).toBe(-15000) // Haber > Debe = negative
    })
  })
})
