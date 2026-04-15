/**
 * Mantenimiento Preventivo Service — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import {
  crearPlanMantenimiento,
  listarPlanesMantenimiento,
  crearOrdenTrabajo,
  actualizarOrdenTrabajo,
  listarOrdenesTrabajo,
  generarOTsPreventivas,
  resumenMantenimiento,
} from "@/lib/mantenimiento/mantenimiento-service"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("Mantenimiento Service", () => {
  const empresaId = 1

  describe("crearPlanMantenimiento", () => {
    it("should create a maintenance plan", async () => {
      mockPrismaClient.planMantenimiento.create.mockResolvedValue({ id: 1 })

      await crearPlanMantenimiento({
        empresaId,
        nombre: "Service anual compresor",
        frecuencia: "anual",
        proximaEjecucion: new Date("2025-12-01"),
      })

      expect(mockPrismaClient.planMantenimiento.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          empresaId,
          nombre: "Service anual compresor",
          frecuencia: "anual",
        }),
      })
    })
  })

  describe("crearOrdenTrabajo", () => {
    it("should generate correlative number OT-000001", async () => {
      mockPrismaClient.ordenTrabajo.findFirst.mockResolvedValue(null) // no previous OT
      mockPrismaClient.ordenTrabajo.create.mockResolvedValue({ id: 1, numero: "OT-000001" })

      const result = await crearOrdenTrabajo(empresaId, {
        descripcion: "Cambio de filtro",
        fechaProgramada: new Date("2025-07-01"),
      })

      expect(mockPrismaClient.ordenTrabajo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          numero: "OT-000001",
          tipo: "preventivo",
          prioridad: "media",
          empresaId,
        }),
      })
    })

    it("should increment from last OT number", async () => {
      mockPrismaClient.ordenTrabajo.findFirst.mockResolvedValue({ numero: "OT-000042" })
      mockPrismaClient.ordenTrabajo.create.mockResolvedValue({ id: 2, numero: "OT-000043" })

      await crearOrdenTrabajo(empresaId, {
        descripcion: "Revision",
        fechaProgramada: new Date(),
      })

      expect(mockPrismaClient.ordenTrabajo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ numero: "OT-000043" }),
      })
    })
  })

  describe("actualizarOrdenTrabajo", () => {
    it("should update OT state", async () => {
      mockPrismaClient.ordenTrabajo.update.mockResolvedValue({ id: 1, estado: "en_proceso" })

      await actualizarOrdenTrabajo(empresaId, 1, { estado: "en_proceso", fechaInicio: new Date() })

      expect(mockPrismaClient.ordenTrabajo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ estado: "en_proceso" }),
      })
    })
  })

  describe("generarOTsPreventivas", () => {
    it("should create OTs for overdue plans and advance dates", async () => {
      const hoy = new Date()
      const ayer = new Date()
      ayer.setDate(ayer.getDate() - 1)

      mockPrismaClient.planMantenimiento.findMany.mockResolvedValue([
        {
          id: 1,
          nombre: "Plan mensual",
          descripcion: null,
          frecuencia: "mensual",
          proximaEjecucion: ayer,
          responsable: "Técnico A",
          activo: true,
        },
      ])
      mockPrismaClient.ordenTrabajo.findFirst.mockResolvedValue(null) // for crearOrdenTrabajo
      mockPrismaClient.ordenTrabajo.create.mockResolvedValue({ id: 1, numero: "OT-000001" })
      mockPrismaClient.planMantenimiento.update.mockResolvedValue({ id: 1 })

      const result = await generarOTsPreventivas(empresaId)

      expect(result.generadas).toBe(1)
      expect(result.ordenes).toContain("OT-000001")
      expect(mockPrismaClient.planMantenimiento.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ proximaEjecucion: expect.any(Date) }),
        }),
      )
    })
  })

  describe("resumenMantenimiento", () => {
    it("should return counts and próximas", async () => {
      mockPrismaClient.ordenTrabajo.count
        .mockResolvedValueOnce(5) // pendientes
        .mockResolvedValueOnce(2) // en_proceso
        .mockResolvedValueOnce(10) // completadas
      mockPrismaClient.planMantenimiento.count.mockResolvedValue(3) // planes activos
      mockPrismaClient.ordenTrabajo.findMany.mockResolvedValue([]) // proximas

      const result = await resumenMantenimiento(empresaId)

      expect(result.pendientes).toBe(5)
      expect(result.enProceso).toBe(2)
      expect(result.completadas).toBe(10)
      expect(result.planesActivos).toBe(3)
    })
  })
})
