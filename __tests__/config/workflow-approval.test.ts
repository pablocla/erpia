import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workflowInstancia: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    workflowPasoLog: { create: vi.fn() },
  },
}))

import { prisma } from "@/lib/prisma"
import {
  construirSolicitudAprobacion,
  resolverAprobacionWorkflow,
} from "@/lib/config/workflow-approval-queue"

const mockPrisma = prisma as unknown as {
  workflowInstancia: { findFirst: Mock; update: Mock }
  workflowPasoLog: { create: Mock }
}

describe("workflow-approval-queue", () => {
  beforeEach(() => vi.clearAllMocks())

  it("construye solicitud con umbral desde contexto", () => {
    const req = construirSolicitudAprobacion("aprob_gerente", { total: 1_500_000 }, {
      titulo: "OC alta",
      rolRequerido: "gerente",
    })
    expect(req.montoUmbral).toBe(1_500_000)
    expect(req.rolRequerido).toBe("gerente")
    expect(req.expiresAt).toBeDefined()
  })

  it("rechaza instancia pausada", async () => {
    mockPrisma.workflowInstancia.findFirst.mockResolvedValue({
      id: 10,
      empresaId: 1,
      estado: "pausado",
      contexto: {
        approvalPending: { stepKey: "aprob", titulo: "Test", solicitadoAt: new Date().toISOString() },
      },
    })
    mockPrisma.workflowInstancia.update.mockResolvedValue({})
    mockPrisma.workflowPasoLog.create.mockResolvedValue({})

    const result = await resolverAprobacionWorkflow(1, 10, { aprobado: false, comentario: "Monto alto" })

    expect(result.estado).toBe("cancelado")
    expect(mockPrisma.workflowInstancia.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: "cancelado" }),
      }),
    )
  })

  it("aprueba y deja instancia en_curso para reanudar", async () => {
    mockPrisma.workflowInstancia.findFirst.mockResolvedValue({
      id: 11,
      contexto: {
        approvalPending: { stepKey: "aprob", titulo: "Test", solicitadoAt: new Date().toISOString() },
      },
    })
    mockPrisma.workflowInstancia.update.mockResolvedValue({})
    mockPrisma.workflowPasoLog.create.mockResolvedValue({})

    const result = await resolverAprobacionWorkflow(1, 11, { aprobado: true, userId: 5 })

    expect(result.estado).toBe("en_curso")
  })
})