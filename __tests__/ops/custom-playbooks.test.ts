import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/prisma", () => ({
  prisma: new Proxy(
    {},
    {
      get(_t, prop) {
        return (mockPrismaClient as Record<string, unknown>)[prop as string]
      },
    },
  ),
}))

vi.mock("@/lib/ops/implementacion-service", () => ({
  getProyectoPorEmpresa: vi.fn(),
}))

vi.mock("@/lib/ops/tenant-plan-service", () => ({
  getTenantPlan: vi.fn().mockResolvedValue({
    id: "Enterprise",
    playbooksCustom: true,
    playbooksAuto: true,
    superAdminPanel: true,
    impersonacionErp: true,
    maxSkusActivos: 999,
    precioBaseArs: 149_900,
  }),
}))

vi.mock("@/lib/ops/analyst-playbooks", () => ({
  ejecutarPlaybookAnalista: vi.fn().mockResolvedValue({
    playbook: { id: "diagnostico_readiness", nombre: "Diag" },
    steps: [{ paso: "Readiness", ok: true }],
    ok: true,
  }),
}))

vi.mock("@/lib/ops/tenant-admin-service", () => ({
  ejecutarAccionProductoTenant: vi.fn().mockResolvedValue({ ok: true }),
}))

vi.mock("@/lib/ops/sistema-log", () => ({
  persistSistemaLog: vi.fn().mockResolvedValue(undefined),
}))

describe("custom-playbooks-service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaClient.proyectoImplementacion.update.mockResolvedValue({})
  })

  it("crearCustomPlaybook persiste en metadata", async () => {
    const { getProyectoPorEmpresa } = await import("@/lib/ops/implementacion-service")
    vi.mocked(getProyectoPorEmpresa).mockResolvedValue({
      empresaId: 1,
      metadata: { customPlaybooks: [] },
    } as never)

    const { crearCustomPlaybook, listCustomPlaybooks } = await import("@/lib/ops/custom-playbooks-service")
    const pb = await crearCustomPlaybook(
      1,
      {
        nombre: "Test PB",
        acciones: [{ tipo: "playbook_builtin", playbookId: "diagnostico_readiness" }],
      },
      "a@claver.com",
    )
    expect(pb.nombre).toBe("Test PB")

    vi.mocked(getProyectoPorEmpresa).mockResolvedValue({
      metadata: { customPlaybooks: [pb] },
    } as never)
    const list = await listCustomPlaybooks(1)
    expect(list).toHaveLength(1)
  })

  it("crearCustomPlaybook falla en plan sin custom", async () => {
    const { getTenantPlan } = await import("@/lib/ops/tenant-plan-service")
    vi.mocked(getTenantPlan).mockResolvedValueOnce({
      id: "Pro",
      playbooksCustom: false,
      playbooksAuto: true,
      superAdminPanel: true,
      impersonacionErp: true,
      maxSkusActivos: 25,
      precioBaseArs: 79_900,
    })

    const { crearCustomPlaybook } = await import("@/lib/ops/custom-playbooks-service")
    await expect(
      crearCustomPlaybook(1, { nombre: "X", acciones: [{ tipo: "playbook_builtin", playbookId: "x" }] }, "a@claver.com"),
    ).rejects.toThrow(/Enterprise/)
  })
})