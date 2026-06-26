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

describe("tenant-plan-service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaClient.suscripcionModulo.count.mockResolvedValue(3)
  })

  it("getTenantPlan devuelve Pro por defecto sin metadata", async () => {
    const { getProyectoPorEmpresa } = await import("@/lib/ops/implementacion-service")
    vi.mocked(getProyectoPorEmpresa).mockResolvedValue({
      id: 1,
      codigo: "CCA-1",
      faseActual: "CCA-040",
      metadata: {},
    } as never)

    const { getTenantPlan } = await import("@/lib/ops/tenant-plan-service")
    const plan = await getTenantPlan(1)
    expect(plan.id).toBe("Pro")
    expect(plan.superAdminPanel).toBe(true)
  })

  it("setTenantPlan persiste en metadata del proyecto", async () => {
    const { getProyectoPorEmpresa } = await import("@/lib/ops/implementacion-service")
    vi.mocked(getProyectoPorEmpresa).mockResolvedValue({
      id: 1,
      empresaId: 1,
      metadata: { planComercial: "Pro" },
    } as never)
    mockPrismaClient.proyectoImplementacion.update.mockResolvedValue({})

    const { setTenantPlan } = await import("@/lib/ops/tenant-plan-service")
    const plan = await setTenantPlan(1, "Enterprise")
    expect(plan.id).toBe("Enterprise")
    expect(plan.playbooksCustom).toBe(true)
    expect(mockPrismaClient.proyectoImplementacion.update).toHaveBeenCalled()
  })

  it("validarLimiteActivacion bloquea Starter sin playbooks", async () => {
    const { getProyectoPorEmpresa } = await import("@/lib/ops/implementacion-service")
    vi.mocked(getProyectoPorEmpresa).mockResolvedValue({
      metadata: { planComercial: "Starter" },
    } as never)

    const { validarLimiteActivacion } = await import("@/lib/ops/tenant-plan-service")
    await expect(validarLimiteActivacion(1, { requierePlaybooks: true })).rejects.toThrow(/Starter/)
  })
})