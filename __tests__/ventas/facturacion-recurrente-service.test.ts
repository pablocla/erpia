/**
 * Facturación Recurrente Service — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

const solicitarCaeFactura = vi.fn()
const emitFacturaEmitida = vi.fn()
const generarCCPorFactura = vi.fn()

vi.mock("@/lib/afip/solicitar-cae-factura", () => ({
  solicitarCaeFactura: (...args: unknown[]) => solicitarCaeFactura(...args),
}))

vi.mock("@/lib/events/emit-domain-event", () => ({
  emitFacturaEmitida: (...args: unknown[]) => emitFacturaEmitida(...args),
}))

vi.mock("@/lib/cc-cp/cuentas-service", () => ({
  cuentasService: {
    generarCCPorFactura: (...args: unknown[]) => generarCCPorFactura(...args),
  },
}))

import {
  crearFacturaRecurrente,
  listarFacturasRecurrentes,
  procesarFacturasRecurrentes,
  toggleFacturaRecurrente,
} from "@/lib/ventas/facturacion-recurrente-service"

beforeEach(() => {
  vi.clearAllMocks()
  solicitarCaeFactura.mockResolvedValue({ ok: true, cae: "12345678901234" })
  emitFacturaEmitida.mockResolvedValue(undefined)
  generarCCPorFactura.mockResolvedValue([88])
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
    it("should process, emit domain event and force CuentaCobrar", async () => {
      const ahora = new Date()
      mockPrismaClient.facturaRecurrente.findMany.mockResolvedValue([
        {
          id: 1,
          concepto: "Suscripción",
          montoNeto: 10000,
          alicuotaIva: 21,
          frecuencia: "mensual",
          tipoCbte: 6,
          clienteId: 5,
          proximaEmision: ahora,
          fechaFin: null,
          ultimaEmision: null,
          facturasEmitidas: 2,
        },
      ])
      mockPrismaClient.cliente.findUnique.mockResolvedValue({ condicionIva: "Consumidor Final" })
      mockPrismaClient.empresa.findUnique.mockResolvedValue({ puntoVenta: 1 })
      mockPrismaClient.factura.findFirst.mockResolvedValue({ numero: 10 })
      mockPrismaClient.factura.create.mockResolvedValue({ id: 99, numero: 11 })
      mockPrismaClient.facturaRecurrente.update.mockResolvedValue({ id: 1 })

      const result = await procesarFacturasRecurrentes(empresaId)

      expect(result.procesadas).toBe(1)
      expect(result.facturas[0].monto).toBe(12100)
      expect(result.facturas[0].afipOk).toBe(true)
      expect(result.facturas[0].cae).toBe("12345678901234")
      expect(result.facturas[0].cuentaCobrarIds).toEqual([88])
      expect(emitFacturaEmitida).toHaveBeenCalledWith(
        expect.objectContaining({
          facturaId: 99,
          empresaId,
          clienteId: 5,
          total: 12100,
        }),
      )
      expect(generarCCPorFactura).toHaveBeenCalledWith(99, {
        forzarCuenta: true,
        diasVencimiento: 0,
      })
      expect(mockPrismaClient.facturaRecurrente.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            facturasEmitidas: { increment: 1 },
          }),
        }),
      )
    })

    it("skips same-day re-emit (idempotencia)", async () => {
      const ahora = new Date()
      mockPrismaClient.facturaRecurrente.findMany.mockResolvedValue([
        {
          id: 3,
          concepto: "Ya emitida hoy",
          montoNeto: 5000,
          alicuotaIva: 21,
          frecuencia: "mensual",
          tipoCbte: 6,
          clienteId: 5,
          proximaEmision: ahora,
          fechaFin: null,
          ultimaEmision: ahora,
          facturasEmitidas: 1,
        },
      ])

      const result = await procesarFacturasRecurrentes(empresaId)
      expect(result.procesadas).toBe(0)
      expect(mockPrismaClient.factura.create).not.toHaveBeenCalled()
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
          ultimaEmision: null,
        },
      ])
      mockPrismaClient.facturaRecurrente.update.mockResolvedValue({ id: 2 })

      const result = await procesarFacturasRecurrentes(empresaId)

      expect(result.procesadas).toBe(0)
      expect(mockPrismaClient.facturaRecurrente.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { activo: false },
      })
      expect(emitFacturaEmitida).not.toHaveBeenCalled()
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
