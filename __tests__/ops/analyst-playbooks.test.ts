import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/ops/sistema-log", () => ({
  persistSistemaLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/ops/readiness-service", () => ({
  getEmpresaReadiness: vi.fn().mockResolvedValue({
    score: 72,
    listoGoLive: false,
    items: [],
    rubroChecks: [],
  }),
}))

vi.mock("@/lib/ops/ops-service", () => ({
  ensureTenantEntornos: vi.fn().mockResolvedValue([{ id: 1, codigo: "val" }]),
  crearOpsJob: vi.fn().mockResolvedValue({ id: 99 }),
}))

vi.mock("@/lib/ops/tenant-admin-service", () => ({
  ejecutarAccionProductoTenant: vi.fn().mockResolvedValue({ ok: true }),
}))

vi.mock("@/lib/ops/entorno-sync-service", () => ({
  capturarSnapshotEntorno: vi.fn().mockResolvedValue({}),
}))

vi.mock("@/lib/ops/scrum-service", () => ({
  sincronizarBacklogDesdeFuentes: vi.fn().mockResolvedValue({ items: [] }),
}))

describe("analyst-playbooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("ANALYST_PLAYBOOKS incluye servicio ops.claver_superadmin", async () => {
    const { ANALYST_PLAYBOOKS } = await import("@/lib/ops/analyst-playbooks")
    expect(ANALYST_PLAYBOOKS.length).toBeGreaterThanOrEqual(5)
    expect(ANALYST_PLAYBOOKS.every((p) => p.servicioSku === "ops.claver_superadmin")).toBe(true)
  })

  it("ejecutarPlaybookAnalista diagnostico_readiness", async () => {
    const { ejecutarPlaybookAnalista } = await import("@/lib/ops/analyst-playbooks")
    const r = await ejecutarPlaybookAnalista(1, "diagnostico_readiness", "a@claver.com")
    expect(r.ok).toBe(true)
    expect(r.steps[0].detalle).toContain("72%")
  })

  it("ejecutarPlaybookAnalista rechaza id desconocido", async () => {
    const { ejecutarPlaybookAnalista } = await import("@/lib/ops/analyst-playbooks")
    await expect(ejecutarPlaybookAnalista(1, "no_existe", "a@claver.com")).rejects.toThrow("no encontrado")
  })
})