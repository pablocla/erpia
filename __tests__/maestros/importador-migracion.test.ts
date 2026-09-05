import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import {
  importadorMigracionService,
  validarCuitAfip,
} from "@/lib/maestros/importador-migracion-service"

beforeEach(() => {
  vi.clearAllMocks()
  mockPrismaClient.producto.findMany.mockResolvedValue([])
  mockPrismaClient.producto.findFirst.mockResolvedValue(null)
  mockPrismaClient.producto.create.mockResolvedValue({ id: 1 })
  mockPrismaClient.movimientoStock.create.mockResolvedValue({ id: 1 })
})

describe("ImportadorMigracionService", () => {
  describe("validarCuitAfip (Módulo 11)", () => {
    it("debe validar CUITs reales con dígito verificador correcto", () => {
      // 30-50000173-5 (Banco Galicia), 33-69345023-9 (AFIP)
      expect(validarCuitAfip("30-50000173-5")).toBe(true)
      expect(validarCuitAfip("33-69345023-9")).toBe(true)
      expect(validarCuitAfip("30-50000173-9")).toBe(false) // Dígito inválido
    })

    it("debe rechazar CUITs con longitud incorrecta", () => {
      expect(validarCuitAfip("123")).toBe(false)
      expect(validarCuitAfip("20-12345678-999")).toBe(false)
    })
  })

  describe("dryRunProductos", () => {
    it("debe validar con éxito un lote correcto de productos", async () => {
      const filas = [
        {
          codigo: "ART-001",
          nombre: "Tornillo 1/2",
          precioUnitario: 150.5,
          porcentajeIva: 21,
          stockInicial: 100,
        },
        {
          codigo: "ART-002",
          nombre: "Tuerca 1/2",
          precioUnitario: 80,
          porcentajeIva: 10.5,
          stockInicial: 50,
        },
      ]

      const res = await importadorMigracionService.dryRunProductos(filas, 1)

      expect(res.valido).toBe(true)
      expect(res.filasValidas).toBe(2)
      expect(res.filasConError).toBe(0)
      expect(res.errores).toHaveLength(0)
    })

    it("debe detectar errores de código duplicado, precio negativo y alícuota inválida", async () => {
      const filas = [
        {
          codigo: "DUPLICADO",
          nombre: "Producto 1",
          precioUnitario: 100,
          porcentajeIva: 21,
        },
        {
          codigo: "DUPLICADO", // Error duplicado
          nombre: "Producto 2",
          precioUnitario: -50, // Error precio negativo
          porcentajeIva: 35, // Error alícuota no permitida en AR
        },
      ]

      const res = await importadorMigracionService.dryRunProductos(filas, 1)

      expect(res.valido).toBe(false)
      expect(res.filasConError).toBe(1) // La fila 2 tiene errores
      expect(res.errores.some((e) => e.campo === "codigo")).toBe(true)
      expect(res.errores.some((e) => e.campo === "precioUnitario")).toBe(true)
      expect(res.errores.some((e) => e.campo === "porcentajeIva")).toBe(true)
    })
  })

  describe("dryRunClientes", () => {
    it("debe validar clientes con CUIT válido y detectar CUITs corruptos", () => {
      const filas = [
        {
          nombre: "Banco Galicia S.A.",
          cuit: "30-50000173-5", // CUIT real válido
          condicionIva: "Responsable Inscripto",
        },
        {
          nombre: "Cliente con CUIT corrupto",
          cuit: "30-11111111-9", // CUIT con verificador incorrecto
        },
      ]

      const res = importadorMigracionService.dryRunClientes(filas)

      expect(res.valido).toBe(false)
      expect(res.filasValidas).toBe(1)
      expect(res.filasConError).toBe(1)
      expect(res.errores[0].campo).toBe("cuit")
    })
  })

  describe("importarProductos", () => {
    it("debe importar y crear movimientos de stock inicial atómicamente", async () => {
      const filas = [
        {
          codigo: "NUEVO-01",
          nombre: "Producto Inicial",
          precioUnitario: 250,
          stockInicial: 25,
        },
      ]

      const res = await importadorMigracionService.importarProductos(filas, 1)

      expect(res.creados).toBe(1)
      expect(mockPrismaClient.producto.create).toHaveBeenCalled()
      expect(mockPrismaClient.movimientoStock.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tipo: "entrada",
          cantidad: 25,
          motivo: "Inventario Inicial / Migración",
        }),
      })
    })
  })
})
