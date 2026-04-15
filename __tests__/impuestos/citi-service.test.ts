/**
 * CITI Service — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import {
  generarCITIVentas,
  generarCITICompras,
  listarGeneracionesCITI,
} from "@/lib/impuestos/citi-service"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("CITI Service", () => {
  const empresaId = 1

  describe("generarCITIVentas", () => {
    it("should generate pipe-delimited CITI ventas file", async () => {
      mockPrismaClient.factura.findMany.mockResolvedValue([
        {
          id: 1,
          createdAt: new Date("2026-01-15"),
          puntoVenta: 1,
          numero: 100,
          tipoCbte: 6,
          subtotal: 10000,
          netoNoGravado: 0,
          netoExento: 0,
          iva: 2100,
          total: 12100,
          totalPercepciones: 0,
          cliente: {
            cuit: "20-12345678-9",
            nombre: "Empresa Test SA",
            condicionIva: "RI",
            dni: null,
          },
          lineas: [],
        },
      ])
      mockPrismaClient.generacionCITI.upsert.mockResolvedValue({ id: 1 })

      const result = await generarCITIVentas(empresaId, "2026-01")

      expect(result.cantidadRegistros).toBe(1)
      expect(result.nombreArchivo).toBe("CITI_VENTAS_202601.txt")
      expect(result.contenido).toContain("006") // tipoCbte padded
      expect(result.contenido).toContain("00001") // puntoVenta padded
      // Date may vary by timezone, check it's a valid 8-digit YYYYMMDD
      expect(result.contenido).toMatch(/2026011[45]/) // fecha (timezone-safe)
      expect(result.contenido).toContain("80") // CUIT doc type
      expect(result.contenido).toContain("20123456789") // CUIT cleaned
    })

    it("should use DNI tipo 96 when no CUIT", async () => {
      mockPrismaClient.factura.findMany.mockResolvedValue([
        {
          id: 2,
          createdAt: new Date("2026-01-20"),
          puntoVenta: 1,
          numero: 200,
          tipoCbte: 11,
          subtotal: 5000,
          netoNoGravado: 0,
          netoExento: 0,
          iva: 1050,
          total: 6050,
          totalPercepciones: 0,
          cliente: {
            cuit: null,
            nombre: "Consumidor Final",
            condicionIva: "CF",
            dni: "12345678",
          },
          lineas: [],
        },
      ])
      mockPrismaClient.generacionCITI.upsert.mockResolvedValue({ id: 2 })

      const result = await generarCITIVentas(empresaId, "2026-01")

      expect(result.contenido).toContain("96") // DNI doc type
    })
  })

  describe("generarCITICompras", () => {
    it("should generate CITI compras file", async () => {
      mockPrismaClient.compra.findMany.mockResolvedValue([
        {
          id: 1,
          fecha: new Date("2026-01-10"),
          puntoVenta: 1,
          numero: 50,
          tipoComprobante: 1,
          subtotal: 20000,
          iva: 4200,
          total: 24200,
          proveedor: {
            cuit: "30-98765432-1",
            nombre: "Proveedor ABC SRL",
          },
          lineas: [],
        },
      ])
      mockPrismaClient.generacionCITI.upsert.mockResolvedValue({ id: 1 })

      const result = await generarCITICompras(empresaId, "2026-01")

      expect(result.cantidadRegistros).toBe(1)
      expect(result.nombreArchivo).toBe("CITI_COMPRAS_202601.txt")
      expect(result.contenido).toContain("30987654321") // CUIT cleaned
    })
  })

  describe("listarGeneracionesCITI", () => {
    it("should list scoped by empresa", async () => {
      mockPrismaClient.generacionCITI.findMany.mockResolvedValue([])

      await listarGeneracionesCITI(empresaId)

      expect(mockPrismaClient.generacionCITI.findMany).toHaveBeenCalledWith({
        where: { empresaId },
        orderBy: { periodo: "desc" },
      })
    })
  })
})
