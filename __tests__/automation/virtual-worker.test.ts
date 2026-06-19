import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/platform/entitlements", () => ({
  requireAutomationEntitlement: vi.fn().mockResolvedValue({ ok: true, sku: "automation.n8n_hub" }),
}))

describe("virtual-worker-runner", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("ejecuta playbook stock_bajo cuando cron coincide", async () => {
    const hour = new Date().getHours()
    vi.mocked(prisma.automationConfig.findUnique).mockResolvedValue({
      id: 1,
      empresaId: 1,
      virtualWorkers: [
        {
          id: 1,
          nombre: "Ana Reposición",
          rol: "deposito",
          playbooks: ["stock_bajo_tarea"],
          cron: `* ${hour} * * *`,
          activo: true,
        },
      ],
    } as never)
    vi.mocked(prisma.producto.findMany).mockResolvedValue([
      { id: 1, nombre: "Cable", stock: 2, stockMinimo: 5 },
    ] as never)
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({ id: 3, rol: "deposito" } as never)
    vi.mocked(prisma.tareaPendiente.create).mockResolvedValue({ id: 1 } as never)
    vi.mocked(prisma.automationVirtualWorker.update).mockResolvedValue({} as never)

    const { runVirtualWorkersForEmpresa } = await import(
      "@/lib/automation/virtual-worker-runner"
    )
    const result = await runVirtualWorkersForEmpresa(1)
    expect(result.ran).toBe(1)
    expect(prisma.tareaPendiente.create).toHaveBeenCalled()
  })

  it("no ejecuta si cron no coincide", async () => {
    vi.mocked(prisma.automationConfig.findUnique).mockResolvedValue({
      id: 1,
      empresaId: 1,
      virtualWorkers: [
        {
          id: 1,
          nombre: "Ana",
          rol: "deposito",
          playbooks: ["stock_bajo_tarea"],
          cron: "0 23 * * *",
          activo: true,
        },
      ],
    } as never)

    const { runVirtualWorkersForEmpresa } = await import(
      "@/lib/automation/virtual-worker-runner"
    )
    const hour = new Date().getHours()
    if (hour === 23) return
    const result = await runVirtualWorkersForEmpresa(1)
    expect(result.ran).toBe(0)
  })
})