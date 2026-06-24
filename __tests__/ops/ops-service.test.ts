import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/prisma", () => ({
  prisma: new Proxy(
    { $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]) },
    {
      get(target, prop) {
        if (prop in target) return (target as Record<string | symbol, unknown>)[prop]
        return (mockPrismaClient as Record<string, unknown>)[prop as string]
      },
    },
  ),
}))

import {
  buildTicketWhere,
  computeTicketMetricas,
} from "@/lib/soporte/tickets-service"
import { PIPELINE_VAL_PRD_PASOS } from "@/lib/ops/ops-types"

describe("ops types", () => {
  it("defines VAL→PRD pipeline with 7 steps", () => {
    expect(PIPELINE_VAL_PRD_PASOS).toHaveLength(7)
    expect(PIPELINE_VAL_PRD_PASOS[0].codigo).toBe("tests_auto")
    expect(PIPELINE_VAL_PRD_PASOS[6].codigo).toBe("cierre")
  })
})

describe("ops metrics reuse", () => {
  it("computes ticket metrics for ops dashboard", () => {
    const metricas = computeTicketMetricas([
      {
        estado: "abierto",
        prioridad: "alta",
        modulo: "afip",
        createdAt: new Date(),
        resolvedAt: null,
        empresaId: 1,
      },
    ])
    expect(metricas.resumen.total).toBe(1)
    expect(buildTicketWhere({ empresaId: 1 }).empresaId).toBe(1)
  })
})

describe("ops service mocks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaClient.tenantEntorno.findMany.mockResolvedValue([])
    mockPrismaClient.tenantEntorno.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: 1, ...data }),
    )
  })

  it("ensureTenantEntornos creates dev/val/prd", async () => {
    const { ensureTenantEntornos } = await import("@/lib/ops/ops-service")
    const entornos = await ensureTenantEntornos(42)
    expect(entornos.length).toBeGreaterThanOrEqual(1)
    expect(mockPrismaClient.tenantEntorno.create).toHaveBeenCalled()
  })

  it("getOpsOverview no expone handlerLog de otro tenant", async () => {
    mockPrismaClient.tenantEntorno.findMany.mockResolvedValue([
      { id: 1, codigo: "prd", estado: "activo" },
    ])
    mockPrismaClient.opsJob.findMany.mockResolvedValue([])
    mockPrismaClient.opsPipeline.findMany.mockResolvedValue([])
    mockPrismaClient.sistemaLog.findMany.mockResolvedValue([])
    mockPrismaClient.ticket.findMany.mockResolvedValue([])
    mockPrismaClient.handlerLog.findMany.mockResolvedValue([
      {
        handler: "otro",
        errorMsg: "fallo",
        payload: JSON.stringify({ empresaId: 99 }),
        createdAt: new Date(),
      },
      {
        handler: "propio",
        errorMsg: "fallo propio",
        payload: JSON.stringify({ empresaId: 42 }),
        createdAt: new Date(),
      },
    ])
    mockPrismaClient.agenteLog.findMany.mockResolvedValue([])

    const { getOpsOverview } = await import("@/lib/ops/ops-service")
    const overview = await getOpsOverview(42)
    const handlers = overview.erroresFuncionales.filter((e) => e.tipo === "handler")
    expect(handlers).toHaveLength(1)
    expect(handlers[0].ref).toBe("propio")
  })
})