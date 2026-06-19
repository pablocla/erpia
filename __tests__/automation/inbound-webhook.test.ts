import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { buildSignedEnvelope } from "@/lib/automation/sign-payload"
import { createAutomationTask } from "@/lib/automation/inbound-actions"

describe("inbound automation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("createAutomationTask crea tarea con origen automation", async () => {
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      id: 10,
      empresaId: 1,
      rol: "deposito",
    } as never)
    vi.mocked(prisma.tareaPendiente.create).mockResolvedValue({
      id: 99,
      titulo: "Controlar stock",
      origen: "automation",
    } as never)
    vi.mocked(prisma.automationExecution.create).mockResolvedValue({ id: 1n } as never)

    const tarea = await createAutomationTask(1, {
      descripcion: "Controlar stock de cable bajo mínimos",
      rolAsignado: "deposito",
      prioridad: "alta",
    })

    expect(tarea.id).toBe(99)
    expect(prisma.tareaPendiente.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          origen: "automation",
          prioridad: "alta",
        }),
      })
    )
  })

  it("verifySignature valida payload firmado", async () => {
    const secret = "shared-webhook-secret-123456"
    const envelope = buildSignedEnvelope(
      1,
      "create_task",
      { descripcion: "Test", rolAsignado: "gerente" },
      secret
    )
    const { verifySignature } = await import("@/lib/automation/sign-payload")
    expect(verifySignature(secret, envelope)).toBe(true)
    expect(verifySignature("otro-secret", envelope)).toBe(false)
  })
})