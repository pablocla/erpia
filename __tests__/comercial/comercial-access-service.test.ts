import { describe, expect, it, vi, beforeEach } from "vitest"
import { getComercialAccessState } from "@/lib/comercial/comercial-access-service"
import { prisma } from "@/lib/prisma"
import { getTrialStatus } from "@/lib/comercial/trial-service"
import { getOfertaEmpresa } from "@/lib/comercial/ofertas-comerciales"
import { OFERTA_FIADO_ANCLA } from "@/lib/comercial/ofertas-comerciales"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    empresa: { findUnique: vi.fn() },
    suscripcionModulo: { findMany: vi.fn() },
    parametroFiscal: { findUnique: vi.fn() },
  },
}))

vi.mock("@/lib/comercial/trial-service", () => ({
  getTrialStatus: vi.fn(),
}))

vi.mock("@/lib/comercial/ofertas-comerciales", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/comercial/ofertas-comerciales")>()
  return {
    ...actual,
    getOfertaEmpresa: vi.fn(),
  }
})

describe("comercial-access-service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.empresa.findUnique).mockResolvedValue({
      mpSubscriptionStatus: null,
      modoLite: "fiado",
    } as never)
    vi.mocked(getOfertaEmpresa).mockResolvedValue(OFERTA_FIADO_ANCLA)
    vi.mocked(getTrialStatus).mockResolvedValue({
      activo: false,
      expirado: true,
      diasRestantes: 0,
      expiresAt: new Date().toISOString(),
      trialDias: 14,
    })
  })

  it("no bloquea total si ancla gratis sigue activa con trial vencido", async () => {
    const subs = [
      { sku: "pos.fiado_barrio", vigenciaHasta: null },
      { sku: "core.claver", vigenciaHasta: new Date("2020-01-01") },
    ]
    vi.mocked(prisma.suscripcionModulo.findMany).mockImplementation(async (args) => {
      const where = (args as { where?: { OR?: unknown } }).where
      if (where && "OR" in (where as object)) {
        return [subs[0]] as never
      }
      return subs as never
    })

    const state = await getComercialAccessState(1)
    expect(state.tieneAnclaGratis).toBe(true)
    expect(state.bloqueoTotal).toBe(false)
    expect(state.monetizados.find((m) => m.sku === "core.claver")?.expirado).toBe(true)
    expect(state.monetizados.find((m) => m.sku === "pos.fiado_barrio")?.gratisPermanente).toBe(true)
  })
})