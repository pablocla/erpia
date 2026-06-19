import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/automation/emit-event", () => ({
  emitAutomationEvent: vi.fn().mockResolvedValue({ sent: true }),
}))

describe("playbook-runner extended", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("cierre_caja_alerta crea tarea si hay cajas viejas", async () => {
    const hace13h = new Date(Date.now() - 13 * 60 * 60 * 1000)
    vi.mocked(prisma.caja.findMany).mockResolvedValue([
      { id: 1, createdAt: hace13h, turno: "mañana" },
    ] as never)
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({ id: 2, rol: "gerente" } as never)
    vi.mocked(prisma.tareaPendiente.create).mockResolvedValue({ id: 1 } as never)

    const { runPlaybook } = await import("@/lib/automation/playbook-runner")
    const result = await runPlaybook(1, "cierre_caja_alerta", {})
    expect(result.ok).toBe(true)
    expect(result.actions[0]).toMatch(/alerta_caja/)
  })

  it("cae_fallido_retry reporta sin pendientes", async () => {
    vi.mocked(prisma.factura.count).mockResolvedValue(0 as never)

    const { runPlaybook } = await import("@/lib/automation/playbook-runner")
    const result = await runPlaybook(1, "cae_fallido_retry", {})
    expect(result.actions).toContain("sin_cae_pendiente")
  })
})