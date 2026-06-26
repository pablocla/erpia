import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/prisma", () => ({
  prisma: new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === "usuario") return mockPrismaClient.usuario
        return (mockPrismaClient as Record<string, unknown>)[prop as string]
      },
    },
  ),
}))

vi.mock("@/lib/ops/sistema-log", () => ({
  persistSistemaLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/email/email-service", () => ({
  emailService: { enviar: vi.fn().mockResolvedValue({ ok: true }) },
}))

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed"),
}))

describe("stakeholder-service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaClient.usuario.findUnique.mockResolvedValue(null)
    mockPrismaClient.usuario.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: 9, ...data }),
    )
    mockPrismaClient.usuario.findMany.mockResolvedValue([])
  })

  it("crearStakeholderCliente crea rol stakeholder", async () => {
    const { crearStakeholderCliente } = await import("@/lib/ops/stakeholder-service")
    const r = await crearStakeholderCliente({
      empresaId: 1,
      nombre: "Decisor",
      email: "decisor@test.com",
      invitadoPor: "analista@test.com",
      enviarEmail: false,
    })
    expect(r.usuario.rol).toBe("stakeholder")
    expect(mockPrismaClient.usuario.create).toHaveBeenCalled()
  })
})