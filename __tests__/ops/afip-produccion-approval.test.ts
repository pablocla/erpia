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

vi.mock("@/lib/ops/sistema-log", () => ({
  persistSistemaLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/ops/ops-notificaciones", () => ({
  notifyAnalistasTicketCritico: vi.fn().mockResolvedValue(undefined),
}))

describe("afip-produccion-approval-service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaClient.empresa.findUnique.mockResolvedValue({
      entornoAfip: "homologacion",
      certificadoCRT: "-----CERT-----",
      nombre: "Test SA",
    })
    mockPrismaClient.empresa.update.mockResolvedValue({})
    mockPrismaClient.proyectoImplementacion.update.mockResolvedValue({})
  })

  it("solicitarAfipProduccion guarda pending en metadata", async () => {
    const { getProyectoPorEmpresa } = await import("@/lib/ops/implementacion-service")
    vi.mocked(getProyectoPorEmpresa).mockResolvedValue({
      empresaId: 1,
      metadata: {},
    } as never)

    const { solicitarAfipProduccion, getAfipProdPending } = await import(
      "@/lib/ops/afip-produccion-approval-service"
    )
    const pending = await solicitarAfipProduccion(1, "a@claver.com")
    expect(pending.estado).toBe("pendiente")
    expect(pending.solicitadoPor).toBe("a@claver.com")

    vi.mocked(getProyectoPorEmpresa).mockResolvedValue({
      metadata: { afipProdPending: pending },
    } as never)
    const loaded = await getAfipProdPending(1)
    expect(loaded?.estado).toBe("pendiente")
  })

  it("aprobarAfipProduccion rechaza mismo analista que solicitó", async () => {
    const pending = {
      solicitadoPor: "a@claver.com",
      solicitadoAt: new Date().toISOString(),
      estado: "pendiente" as const,
    }
    const { getProyectoPorEmpresa } = await import("@/lib/ops/implementacion-service")
    vi.mocked(getProyectoPorEmpresa).mockResolvedValue({
      metadata: { afipProdPending: pending },
    } as never)

    const { aprobarAfipProduccion } = await import("@/lib/ops/afip-produccion-approval-service")
    await expect(aprobarAfipProduccion(1, "a@claver.com")).rejects.toThrow(/dual/)
  })

  it("aprobarAfipProduccion activa entorno produccion", async () => {
    const pending = {
      solicitadoPor: "a@claver.com",
      solicitadoAt: new Date().toISOString(),
      estado: "pendiente" as const,
    }
    const { getProyectoPorEmpresa } = await import("@/lib/ops/implementacion-service")
    vi.mocked(getProyectoPorEmpresa).mockResolvedValue({
      metadata: { afipProdPending: pending },
    } as never)

    const { aprobarAfipProduccion } = await import("@/lib/ops/afip-produccion-approval-service")
    const result = await aprobarAfipProduccion(1, "b@claver.com")
    expect(result.aplicado).toBe(true)
    expect(mockPrismaClient.empresa.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ entornoAfip: "produccion" }),
      }),
    )
  })
})