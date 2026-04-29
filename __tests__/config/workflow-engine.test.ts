import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"

// ─── Mock prisma ─────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    empresa: { findUnique: vi.fn() },
    workflowRubro: { findFirst: vi.fn() },
    workflowInstancia: { create: vi.fn(), update: vi.fn() },
    workflowPasoLog: { create: vi.fn() },
    workflowStep: { findUnique: vi.fn() },
  },
}))
vi.mock("@/lib/config/rubro-config-service", () => ({
  isFeatureActiva: vi.fn().mockResolvedValue(true),
  getFeatureParam: vi.fn().mockResolvedValue(null),
}))
vi.mock("@/lib/events/event-bus", () => ({
  eventBus: { emit: vi.fn() },
}))

import { prisma } from "@/lib/prisma"
const mockPrisma = prisma as unknown as {
  empresa: { findUnique: Mock }
  workflowRubro: { findFirst: Mock }
  workflowInstancia: { create: Mock; update: Mock }
  workflowPasoLog: { create: Mock }
  workflowStep: { findUnique: Mock }
}

import { WorkflowEngine, registrarAccionWorkflow } from "@/lib/config/workflow-engine"
import { isFeatureActiva } from "@/lib/config/rubro-config-service"

describe("WorkflowEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retorna sin_workflow cuando no hay template para el rubro", async () => {
    mockPrisma.empresa.findUnique.mockResolvedValue({ rubroId: 1, rubro: "ALIM" })
    mockPrisma.workflowRubro.findFirst.mockResolvedValue(null)

    const engine = new WorkflowEngine(1)
    const result = await engine.ejecutar("venta")

    expect(result.estado).toBe("sin_workflow")
    expect(result.instanciaId).toBe(0)
  })

  it("ejecuta workflow completo con pasos secuenciales", async () => {
    // Register test actions
    registrarAccionWorkflow("testAction.paso1", async (ctx) => ({
      success: true,
      output: { paso1: "done" },
    }))
    registrarAccionWorkflow("testAction.paso2", async (ctx) => ({
      success: true,
      output: { paso2: "done" },
    }))

    mockPrisma.empresa.findUnique.mockResolvedValue({ rubroId: 1, rubro: "TEST" })
    mockPrisma.workflowRubro.findFirst.mockResolvedValue({
      id: 1,
      version: 1,
      pasos: [
        {
          id: 10,
          stepKey: "paso1",
          nombre: "Paso 1",
          tipo: "service_call",
          accion: "testAction.paso1",
          orden: 1,
          requiereFeature: null,
          condicion: null,
          parametros: null,
          timeoutSeg: 0,
          transicionesSalida: [],
        },
        {
          id: 11,
          stepKey: "paso2",
          nombre: "Paso 2",
          tipo: "service_call",
          accion: "testAction.paso2",
          orden: 2,
          requiereFeature: null,
          condicion: null,
          parametros: null,
          timeoutSeg: 0,
          transicionesSalida: [],
        },
      ],
    })
    mockPrisma.workflowInstancia.create.mockResolvedValue({ id: 100 })
    mockPrisma.workflowInstancia.update.mockResolvedValue({})
    mockPrisma.workflowPasoLog.create.mockResolvedValue({})

    const engine = new WorkflowEngine(1)
    const result = await engine.ejecutar("venta", { total: 5000 })

    expect(result.estado).toBe("completado")
    expect(result.instanciaId).toBe(100)
    expect(result.contexto).toMatchObject({ paso1: "done", paso2: "done" })
  })

  it("salta paso cuando feature no está activa", async () => {
    const mockIsFeature = vi.mocked(isFeatureActiva)
    mockIsFeature.mockResolvedValueOnce(false) // paso1 feature not active
    mockIsFeature.mockResolvedValueOnce(true)  // paso2 feature active

    registrarAccionWorkflow("testAction.onlyPaso2", async () => ({
      success: true,
      output: { solo: "paso2" },
    }))

    mockPrisma.empresa.findUnique.mockResolvedValue({ rubroId: 1, rubro: "TEST" })
    mockPrisma.workflowRubro.findFirst.mockResolvedValue({
      id: 2,
      version: 1,
      pasos: [
        {
          id: 20,
          stepKey: "paso_condicionado",
          nombre: "Paso con Feature",
          tipo: "service_call",
          accion: "testAction.paso1",
          orden: 1,
          requiereFeature: "kds",
          condicion: null,
          parametros: null,
          timeoutSeg: 0,
          transicionesSalida: [],
        },
        {
          id: 21,
          stepKey: "paso_siempre",
          nombre: "Paso Siempre",
          tipo: "service_call",
          accion: "testAction.onlyPaso2",
          orden: 2,
          requiereFeature: "pos",
          condicion: null,
          parametros: null,
          timeoutSeg: 0,
          transicionesSalida: [],
        },
      ],
    })
    mockPrisma.workflowInstancia.create.mockResolvedValue({ id: 200 })
    mockPrisma.workflowInstancia.update.mockResolvedValue({})
    mockPrisma.workflowPasoLog.create.mockResolvedValue({})

    const engine = new WorkflowEngine(1)
    const result = await engine.ejecutar("venta")

    expect(result.estado).toBe("completado")
    // Should have 2 log entries: 1 skip + 1 executed
    expect(mockPrisma.workflowPasoLog.create).toHaveBeenCalledTimes(2)
    const firstLogCall = mockPrisma.workflowPasoLog.create.mock.calls[0]![0] as { data: { resultado: string } }
    expect(firstLogCall.data.resultado).toBe("saltado")
  })

  it("para el workflow en error y registra estado", async () => {
    registrarAccionWorkflow("testAction.falla", async () => ({
      success: false,
      error: "Servicio no disponible",
    }))

    mockPrisma.empresa.findUnique.mockResolvedValue({ rubroId: 1, rubro: "TEST" })
    mockPrisma.workflowRubro.findFirst.mockResolvedValue({
      id: 3,
      version: 1,
      pasos: [
        {
          id: 30,
          stepKey: "paso_falla",
          nombre: "Paso que falla",
          tipo: "service_call",
          accion: "testAction.falla",
          orden: 1,
          requiereFeature: null,
          condicion: null,
          parametros: null,
          timeoutSeg: 0,
          transicionesSalida: [],
        },
      ],
    })
    mockPrisma.workflowInstancia.create.mockResolvedValue({ id: 300 })
    mockPrisma.workflowInstancia.update.mockResolvedValue({})
    mockPrisma.workflowPasoLog.create.mockResolvedValue({})

    const engine = new WorkflowEngine(1)
    const result = await engine.ejecutar("venta")

    expect(result.estado).toBe("error")
    // Should have updated instancia with error
    expect(mockPrisma.workflowInstancia.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: "error", error: "Servicio no disponible" }),
      }),
    )
  })
})
