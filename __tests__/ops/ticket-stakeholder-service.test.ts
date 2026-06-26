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

vi.mock("@/lib/ops/sistema-log", () => ({
  persistSistemaLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/ops/ops-notificaciones", () => ({
  notifyAnalistasComentarioStakeholder: vi.fn().mockResolvedValue(undefined),
}))

describe("ticket-stakeholder-service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaClient.ticket.findFirst.mockResolvedValue({ id: 5, numero: "TK-005", titulo: "Consulta UAT" })
    mockPrismaClient.comentarioTicket.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: 99, ...data, createdAt: new Date() }),
    )
    mockPrismaClient.ticket.update.mockResolvedValue({})
  })

  it("agregarComentarioStakeholder prefija autor con [Cliente]", async () => {
    const { notifyAnalistasComentarioStakeholder } = await import("@/lib/ops/ops-notificaciones")
    const { agregarComentarioStakeholder } = await import("@/lib/ops/ticket-stakeholder-service")
    const c = await agregarComentarioStakeholder(1, 5, "  Necesito actualización  ", "cliente@empresa.com")
    expect(c.autor).toBe("[Cliente] cliente@empresa.com")
    expect(c.texto).toBe("Necesito actualización")
    expect(mockPrismaClient.comentarioTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ticketId: 5 }),
      }),
    )
    expect(notifyAnalistasComentarioStakeholder).toHaveBeenCalledWith(
      expect.objectContaining({
        empresaId: 1,
        ticketId: 5,
        numero: "TK-005",
        stakeholderEmail: "cliente@empresa.com",
      }),
    )
  })

  it("agregarComentarioStakeholder falla si ticket no existe", async () => {
    mockPrismaClient.ticket.findFirst.mockResolvedValue(null)
    const { agregarComentarioStakeholder } = await import("@/lib/ops/ticket-stakeholder-service")
    await expect(agregarComentarioStakeholder(1, 99, "Hola", "a@b.com")).rejects.toThrow("Ticket no encontrado")
  })
})