import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { crearTareaMarketplace, resolverAnalistaEmpresa } from "@/lib/marketplace/analyst-task-service"

beforeEach(() => {
  vi.clearAllMocks()
  mockPrismaClient.analistaAsignacion = {
    findFirst: vi.fn().mockResolvedValue({ analistaEmail: "lead@claver.com" }),
  }
  mockPrismaClient.proyectoImplementacion = {
    findUnique: vi.fn().mockResolvedValue(null),
  }
  mockPrismaClient.marketplaceTareaAnalista = {
    create: vi.fn().mockImplementation(({ data }) =>
      Promise.resolve({ id: "tarea-99", ...data }),
    ),
  }
})

describe("resolverAnalistaEmpresa", () => {
  it("prioriza AnalistaAsignacion activa", async () => {
    const email = await resolverAnalistaEmpresa(42)
    expect(email).toBe("lead@claver.com")
    expect(mockPrismaClient.analistaAsignacion.findFirst).toHaveBeenCalled()
  })
})

describe("crearTareaMarketplace", () => {
  it("asigna analista humano para SEMI_AUTO", async () => {
    const tarea = await crearTareaMarketplace({
      empresaId: 1,
      sku: "integ.shopify",
      nombre: "Shopify Link",
      autoCertLevel: "SEMI_AUTO",
      provisionJobId: "job-1",
    })

    expect(tarea.asignadoA).toBe("lead@claver.com")
    expect(tarea.tipoEjecutor).toBe("mixto")
    expect(tarea.estado).toBe("pendiente")
    expect(tarea.runbookCodigo).toBe("integ.shopify")
    expect(Array.isArray(tarea.checklistJson)).toBe(true)
  })

  it("asigna clav-ai cuando no requiere humano obligatorio en nivel auto", async () => {
    const tarea = await crearTareaMarketplace({
      empresaId: 1,
      sku: "data.nps",
      nombre: "NPS",
      autoCertLevel: "GLOBAL_AUTO",
    })

    expect(tarea.asignadoA).toBe("clav-ai")
    expect(tarea.tipoEjecutor).toBe("ia")
  })
})