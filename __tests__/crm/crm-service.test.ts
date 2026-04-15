/**
 * CRM Service — Unit Tests
 * Leads, opportunities, pipeline, metrics
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import {
  crearLead,
  actualizarEstadoLead,
  crearOportunidad,
  avanzarEtapa,
  pipelineResumen,
  metricasCRM,
} from "@/lib/crm/crm-service"

beforeEach(() => vi.clearAllMocks())

describe("CRM Service", () => {
  describe("crearLead", () => {
    it("should create a lead with default estado=nuevo", async () => {
      mockPrismaClient.lead.create.mockResolvedValue({
        id: 1, nombre: "Juan Pérez", estado: "nuevo", origen: "web",
      })

      const result = await crearLead({
        empresaId: 1,
        nombre: "Juan Pérez",
        email: "juan@test.com",
        origen: "web",
      })

      expect(result.estado).toBe("nuevo")
      expect(mockPrismaClient.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nombre: "Juan Pérez",
            estado: "nuevo",
            origen: "web",
            empresaId: 1,
          }),
        }),
      )
    })

    it("should default origen to manual when not specified", async () => {
      mockPrismaClient.lead.create.mockResolvedValue({
        id: 2, nombre: "Test", estado: "nuevo", origen: "manual",
      })

      await crearLead({ empresaId: 1, nombre: "Test" })

      expect(mockPrismaClient.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ origen: "manual" }),
        }),
      )
    })
  })

  describe("actualizarEstadoLead", () => {
    it("should update lead estado", async () => {
      mockPrismaClient.lead.update.mockResolvedValue({
        id: 1, estado: "contactado",
      })

      const result = await actualizarEstadoLead(1, 1, "contactado")
      expect(result.estado).toBe("contactado")
    })

    it("should set convertidoAt when estado is convertido", async () => {
      mockPrismaClient.lead.update.mockResolvedValue({
        id: 1, estado: "convertido", convertidoAt: new Date(),
      })

      await actualizarEstadoLead(1, 1, "convertido")

      const callData = mockPrismaClient.lead.update.mock.calls[0][0].data
      expect(callData.estado).toBe("convertido")
      expect(callData.convertidoAt).toBeInstanceOf(Date)
    })
  })

  describe("crearOportunidad", () => {
    it("should create opportunity with default etapa prospecto", async () => {
      mockPrismaClient.oportunidad.create.mockResolvedValue({
        id: 1, nombre: "Proyecto ERP", etapa: "prospecto", probabilidad: 10, montoEstimado: 500000,
      })

      const result = await crearOportunidad({
        empresaId: 1,
        nombre: "Proyecto ERP",
        montoEstimado: 500000,
      })

      expect(result.etapa).toBe("prospecto")
      expect(mockPrismaClient.oportunidad.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nombre: "Proyecto ERP",
            etapa: "prospecto",
            probabilidad: 10,
          }),
        }),
      )
    })
  })

  describe("pipelineResumen", () => {
    it("should return pipeline summary with totals", async () => {
      // pipelineResumen calls findMany once per etapa: prospecto, propuesta, negociacion, cierre
      mockPrismaClient.oportunidad.findMany
        .mockResolvedValueOnce([  // prospecto
          { montoEstimado: 500000, probabilidad: 10 },
          { montoEstimado: 500000, probabilidad: 10 },
        ])
        .mockResolvedValueOnce([  // propuesta
          { montoEstimado: 800000, probabilidad: 30 },
        ])
        .mockResolvedValueOnce([])  // negociacion
        .mockResolvedValueOnce([])  // cierre

      const result = await pipelineResumen(1)

      expect(result.etapas).toHaveLength(4)
      expect(result.totalPipeline).toBe(1800000)
      expect(result.etapas[0].cantidad).toBe(2)
    })
  })

  describe("metricasCRM", () => {
    it("should calculate CRM metrics", async () => {
      // metricasCRM calls: lead.count, oportunidad.count (abiertas), oportunidad.findMany (ganadas), oportunidad.count (perdidas)
      mockPrismaClient.lead.count.mockResolvedValue(15)
      mockPrismaClient.oportunidad.count
        .mockResolvedValueOnce(8)   // abiertas
        .mockResolvedValueOnce(2)   // perdidas
      mockPrismaClient.oportunidad.findMany.mockResolvedValue([
        { montoReal: 500000, montoEstimado: 400000 },
        { montoReal: null, montoEstimado: 300000 },
        { montoReal: 700000, montoEstimado: 600000 },
      ])

      const result = await metricasCRM(1)

      expect(result.leadsNuevos).toBe(15)
      expect(result.oportunidadesAbiertas).toBe(8)
      expect(result.ganadasMes).toBe(3)
      expect(result.perdidasMes).toBe(2)
      expect(result.montoGanado).toBe(1500000)
      expect(result.winRate).toBe(60) // 3/(3+2)*100
    })
  })
})
