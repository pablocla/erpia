import { describe, expect, it, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    empresa: { findUnique: vi.fn(), update: vi.fn() },
    parametroFiscal: { findUnique: vi.fn(), upsert: vi.fn() },
    productoComercial: { upsert: vi.fn() },
    producto: { findFirst: vi.fn(), create: vi.fn() },
    cliente: { findFirst: vi.fn(), create: vi.fn() },
    suscripcionModulo: { upsert: vi.fn() },
  },
}))

vi.mock("@/lib/comercial/trial-service", () => ({
  getTrialStatus: vi.fn().mockResolvedValue(null),
  setTrialExpiresAt: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/comercial/retail-onboarding-service", () => ({
  applyRetailOnboarding: vi.fn().mockResolvedValue({
    rubro: "otro",
    modoLite: "fiado",
    engancheId: "pos.fiado_barrio",
    productosCreados: 0,
    skusActivados: ["pos.fiado_barrio"],
    landingPath: "/dashboard/fiado",
    trialExpiresAt: new Date().toISOString(),
  }),
}))

import { prisma } from "@/lib/prisma"
import { applyRetailOnboarding } from "@/lib/comercial/retail-onboarding-service"
import { applyActivarIntent } from "@/lib/comercial/activar-producto-service"

describe("applyActivarIntent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.empresa.findUnique).mockResolvedValue({
      rubro: "almacen",
      modoLite: "completo",
    } as never)
    vi.mocked(prisma.parametroFiscal.findUnique).mockResolvedValue({ valor: 1 } as never)
  })

  it("resuelve slug fiado y aplica onboarding con skipSeed si ya onboarded", async () => {
    await applyActivarIntent({ empresaId: 1, activar: "fiado" })

    expect(applyRetailOnboarding).toHaveBeenCalledWith(
      expect.objectContaining({
        empresaId: 1,
        engancheId: "pos.fiado_barrio",
        modoLite: "fiado",
        skipSeed: true,
        origen: "activar_intent",
      }),
    )
  })

  it("rechaza activar desconocido", async () => {
    await expect(applyActivarIntent({ empresaId: 1, activar: "xyz-invalido" })).rejects.toThrow(
      /no reconocido/i,
    )
  })
})