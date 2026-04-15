/**
 * AprobacionesService — Unit Tests
 * Multi-level approval chain: auto-approve, create, approve, reject
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import {
  buscarCadenaAplicable,
  crearSolicitudAprobacion,
  procesarAprobacion,
  listarPendientes,
} from "@/lib/aprobaciones/aprobaciones-service"

beforeEach(() => vi.clearAllMocks())

describe("AprobacionesService", () => {
  describe("buscarCadenaAplicable", () => {
    it("should find a matching approval chain by entity and amount", async () => {
      const mockCadena = {
        id: 1,
        nombre: "Compras > $100k",
        entidad: "orden_compra",
        montoMinimo: 100000,
        montoMaximo: null,
        activa: true,
        niveles: [{ id: 1, orden: 1, rol: "gerente" }],
      }
      mockPrismaClient.cadenaAprobacion.findFirst.mockResolvedValue(mockCadena)

      const result = await buscarCadenaAplicable(1, "orden_compra", 150000)

      expect(result).toEqual(mockCadena)
      expect(mockPrismaClient.cadenaAprobacion.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ empresaId: 1, entidad: "orden_compra", activa: true }),
        }),
      )
    })

    it("should return null when no chain applies", async () => {
      mockPrismaClient.cadenaAprobacion.findFirst.mockResolvedValue(null)
      const result = await buscarCadenaAplicable(1, "gasto", 500)
      expect(result).toBeNull()
    })
  })

  describe("crearSolicitudAprobacion", () => {
    it("should auto-approve when no chain is configured", async () => {
      mockPrismaClient.cadenaAprobacion.findFirst.mockResolvedValue(null)

      const result = await crearSolicitudAprobacion({
        empresaId: 1,
        entidad: "orden_compra",
        entidadId: 10,
        monto: 5000,
        solicitanteId: 1,
      })

      expect(result.autoAprobado).toBe(true)
      expect(result.solicitud).toBeNull()
    })

    it("should create a pending solicitud when chain exists", async () => {
      mockPrismaClient.cadenaAprobacion.findFirst.mockResolvedValue({
        id: 1,
        niveles: [{ id: 1, orden: 1, rol: "admin" }],
      })
      mockPrismaClient.solicitudAprobacion.create.mockResolvedValue({
        id: 100,
        estado: "pendiente",
        nivelActual: 1,
      })

      const result = await crearSolicitudAprobacion({
        empresaId: 1,
        entidad: "orden_pago",
        entidadId: 5,
        monto: 200000,
        solicitanteId: 2,
        descripcion: "Pago proveedor urgente",
      })

      expect(result.autoAprobado).toBe(false)
      expect(result.solicitud?.estado).toBe("pendiente")
      expect(mockPrismaClient.solicitudAprobacion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entidad: "orden_pago",
            estado: "pendiente",
            nivelActual: 1,
            monto: 200000,
          }),
        }),
      )
    })
  })

  describe("procesarAprobacion", () => {
    it("should throw when solicitud not found", async () => {
      mockPrismaClient.solicitudAprobacion.findFirst.mockResolvedValue(null)

      await expect(
        procesarAprobacion({
          solicitudId: 999,
          aprobadorId: 1,
          accion: "aprobado",
          empresaId: 1,
        }),
      ).rejects.toThrow("Solicitud no encontrada")
    })

    it("should reject a solicitud and mark as rechazado", async () => {
      mockPrismaClient.solicitudAprobacion.findFirst.mockResolvedValue({
        id: 1,
        cadenaId: 1,
        nivelActual: 1,
        estado: "pendiente",
        pasos: [],
      })
      mockPrismaClient.cadenaAprobacion.findUnique.mockResolvedValue({
        id: 1,
        niveles: [{ orden: 1 }, { orden: 2 }],
      })
      mockPrismaClient.pasoAprobacion.create.mockResolvedValue({ id: 1 })
      mockPrismaClient.solicitudAprobacion.update.mockResolvedValue({ id: 1, estado: "rechazado" })

      const result = await procesarAprobacion({
        solicitudId: 1,
        aprobadorId: 3,
        accion: "rechazado",
        comentario: "Monto excesivo",
        empresaId: 1,
      })

      expect(mockPrismaClient.pasoAprobacion.create).toHaveBeenCalled()
      expect(mockPrismaClient.solicitudAprobacion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ estado: "rechazado" }),
        }),
      )
    })
  })

  describe("listarPendientes", () => {
    it("should return pending solicitudes for empresa", async () => {
      mockPrismaClient.solicitudAprobacion.findMany.mockResolvedValue([
        { id: 1, estado: "pendiente", entidad: "orden_compra", monto: 50000 },
        { id: 2, estado: "pendiente", entidad: "gasto", monto: 10000 },
      ])

      const result = await listarPendientes(1)

      expect(result).toHaveLength(2)
      expect(mockPrismaClient.solicitudAprobacion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ empresaId: 1, estado: "pendiente" }),
        }),
      )
    })
  })
})
