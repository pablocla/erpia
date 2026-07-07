import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cronRunLedger: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({ id: 1 }),
    },
  },
}))

vi.mock("@/lib/automation/virtual-worker-runner", () => ({
  runAllVirtualWorkers: vi.fn().mockResolvedValue({ total: 1 }),
}))

vi.mock("@/lib/afip/sync-pendientes", () => ({
  syncFacturasPendientes: vi.fn().mockResolvedValue({ sincronizadas: 0 }),
}))

vi.mock("@/lib/scheduling/jobs/whatsapp-outbound", () => ({
  runWhatsAppOutbound: vi.fn().mockResolvedValue({ procesados: 0, enviados: 0, errores: 0 }),
}))

vi.mock("@/lib/scheduling/jobs/ops-alertas", () => ({
  runOpsAlertas: vi.fn().mockResolvedValue({ alertas: 0, entornosError: 0, proyectosAtrasados: 0 }),
}))

vi.mock("@/lib/scheduling/jobs/agentes", () => ({
  runScheduledAgents: vi.fn().mockResolvedValue({ ejecutados: 0, omitidos: 0, errores: 0 }),
}))

vi.mock("@/lib/scheduling/jobs/recordatorios", () => ({
  runRecordatoriosTurnos: vi.fn().mockResolvedValue({ queued: 0 }),
}))

describe("dispatchScheduledJobs", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      SCHEDULER_TIER: "free",
      SCHEDULER_PROVIDER: "github-actions",
      SCHEDULER_WINDOW_MINUTES: "5",
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("ejecuta jobs free en cada tick", async () => {
    const { dispatchScheduledJobs } = await import("@/lib/scheduling/dispatcher")
    const { runAllVirtualWorkers } = await import("@/lib/automation/virtual-worker-runner")
    const { syncFacturasPendientes } = await import("@/lib/afip/sync-pendientes")

    const summary = await dispatchScheduledJobs(new Date("2026-07-06T12:00:00Z"))

    expect(summary.tier).toBe("free")
    expect(summary.provider).toBe("github-actions")
    expect(runAllVirtualWorkers).toHaveBeenCalled()
    expect(syncFacturasPendientes).toHaveBeenCalled()
    expect(summary.jobs.some((j) => j.id === "virtual-workers" && j.status === "ok")).toBe(true)
  })

  it("omite jobs premium en tier free", async () => {
    const { dispatchScheduledJobs } = await import("@/lib/scheduling/dispatcher")
    const summary = await dispatchScheduledJobs(new Date("2026-07-06T09:00:00Z"))

    expect(summary.jobs.find((j) => j.id === "ia-diaria")).toBeUndefined()
    expect(summary.jobs.find((j) => j.id === "cobranzas-ia")).toBeUndefined()
  })

  it("incluye jobs premium cuando SCHEDULER_TIER=premium", async () => {
    process.env.SCHEDULER_TIER = "premium"

    vi.doMock("@/lib/scheduling/jobs/ia-diaria", () => ({
      runIaDiaria: vi.fn().mockResolvedValue({ procesadas: 1 }),
    }))

    const { dispatchScheduledJobs } = await import("@/lib/scheduling/dispatcher")
    const summary = await dispatchScheduledJobs(new Date("2026-07-06T09:00:00Z"))

    expect(summary.tier).toBe("premium")
    expect(summary.jobs.some((j) => j.id === "ia-diaria")).toBe(true)
  })
})