import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/empleados-digitales/is-leo-activo", () => ({
  isLeoActivo: vi.fn().mockResolvedValue(false),
}))

vi.mock("@/lib/empleados-digitales/kpi-service", () => ({
  getLeoKpis: vi.fn().mockResolvedValue({
    deudaEnRadarArs: 0,
    deudoresEnRadar: 0,
    sinTelefono: 0,
    draftsPendientes: 0,
    enviadosMes: 0,
    draftsMes: 0,
    llmMes: 0,
    tokensMes: 0,
    arsRecuperadosMes: 0,
    recuperacionesCount: 0,
    periodMonth: "2026-07",
    limites: { maxDraftsMes: 30, maxLlmMes: 0, maxWaSendMes: 20 },
    trial: true,
    llmLocked: true,
  }),
}))

import { computeTenantHealthScore } from "@/lib/empleados-digitales/health-score"
import { isLeoActivo } from "@/lib/empleados-digitales/is-leo-activo"

describe("computeTenantHealthScore PV-02", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaClient.empleadoDigital = {
      findFirst: vi.fn().mockResolvedValue(null),
    }
    mockPrismaClient.cliente = {
      count: vi.fn().mockResolvedValue(0),
    }
    mockPrismaClient.factura = {
      count: vi.fn().mockResolvedValue(0),
    }
  })

  it("score bajo sin Leo", async () => {
    ;(isLeoActivo as ReturnType<typeof vi.fn>).mockResolvedValue(false)
    const h = await computeTenantHealthScore(1)
    expect(h.score).toBeLessThan(30)
    expect(h.grade).toBe("F")
    expect(h.recommendedActions.length).toBeGreaterThan(0)
  })

  it("sube score con Leo activo y corridas", async () => {
    ;(isLeoActivo as ReturnType<typeof vi.fn>).mockResolvedValue(true)
    mockPrismaClient.empleadoDigital.findFirst.mockResolvedValue({
      id: 1,
      estado: "activo",
      runsTotal: 3,
      tokensMes: 0,
      accionesMes: 5,
      lastRunAt: new Date(),
      lastSuccessAt: new Date(),
      config: {},
    })
    mockPrismaClient.cliente.count.mockResolvedValue(10)
    mockPrismaClient.factura.count.mockResolvedValue(5)

    const { getLeoKpis } = await import("@/lib/empleados-digitales/kpi-service")
    ;(getLeoKpis as ReturnType<typeof vi.fn>).mockResolvedValue({
      deudaEnRadarArs: 10000,
      deudoresEnRadar: 5,
      sinTelefono: 1,
      draftsPendientes: 2,
      enviadosMes: 3,
      draftsMes: 5,
      llmMes: 0,
      tokensMes: 0,
      arsRecuperadosMes: 2000,
      recuperacionesCount: 1,
      periodMonth: "2026-07",
      limites: { maxDraftsMes: 300, maxLlmMes: 50, maxWaSendMes: 200 },
      trial: false,
      llmLocked: false,
    })

    const h = await computeTenantHealthScore(1)
    expect(h.score).toBeGreaterThanOrEqual(70)
    expect(["A", "B"]).toContain(h.grade)
  })
})
