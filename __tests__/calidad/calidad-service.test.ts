/**
 * Calidad Service — Unit Tests
 * Quality inspections, templates, evaluations
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import {
  crearPlantilla,
  iniciarInspeccion,
  registrarResultados,
  metricasCalidad,
} from "@/lib/calidad/calidad-service"

beforeEach(() => vi.clearAllMocks())

describe("Calidad Service", () => {
  describe("crearPlantilla", () => {
    it("should create a quality template with criteria", async () => {
      mockPrismaClient.plantillaInspeccion.create.mockResolvedValue({
        id: 1,
        nombre: "Control Recepción MP",
        entidad: "recepcion_compra",
        criterios: [
          { id: 1, nombre: "Peso correcto", obligatorio: true },
          { id: 2, nombre: "Embalaje", obligatorio: false },
        ],
      })

      const result = await crearPlantilla({
        empresaId: 1,
        nombre: "Control Recepción MP",
        entidad: "recepcion_compra",
        criterios: [
          { nombre: "Peso correcto", obligatorio: true, tipo: "si_no" },
          { nombre: "Embalaje", obligatorio: false, tipo: "si_no" },
        ],
      })

      expect(result.nombre).toBe("Control Recepción MP")
      expect(result.criterios).toHaveLength(2)
    })
  })

  describe("iniciarInspeccion", () => {
    it("should create a new inspection in estado pendiente", async () => {
      mockPrismaClient.inspeccionCalidad.create.mockResolvedValue({
        id: 1, estado: "pendiente", entidad: "producto", entidadId: 42,
      })

      const result = await iniciarInspeccion({
        empresaId: 1,
        plantillaId: 1,
        entidad: "producto",
        entidadId: 42,
        inspectorId: 5,
      })

      expect(result.estado).toBe("pendiente")
      expect(result.entidadId).toBe(42)
    })
  })

  describe("metricasCalidad", () => {
    it("should calculate quality metrics with approval rate", async () => {
      // metricasCalidad uses findMany and then filters in JS
      mockPrismaClient.inspeccionCalidad.findMany.mockResolvedValue([
        { estado: "aprobada" },
        { estado: "aprobada" },
        { estado: "aprobada" },
        { estado: "aprobada" },
        { estado: "rechazada" },
        { estado: "aprobada_con_desvio" },
      ])

      const result = await metricasCalidad(1)

      expect(result.total).toBe(6)
      expect(result.aprobadas).toBe(4)
      expect(result.rechazadas).toBe(1)
      expect(result.conDesvio).toBe(1)
      expect(result.tasaAprobacion).toBe(67) // 4/6*100 rounded
    })
  })
})
