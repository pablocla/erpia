import { describe, expect, it, vi, beforeEach } from "vitest"
import {
  PACK_PROPIEDAD,
  esPackPropiedad,
  provisionarPoolPropiedad,
} from "@/lib/comercial/hybrid-provision-bridge"

vi.mock("@/lib/platform/product-lifecycle", () => ({
  activarPack: vi.fn().mockResolvedValue({ ok: true }),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    empresa: { update: vi.fn().mockResolvedValue({}) },
    parametroFiscal: { upsert: vi.fn().mockResolvedValue({}) },
  },
}))

vi.mock("@/lib/ops/sistema-log", () => ({
  persistSistemaLog: vi.fn().mockResolvedValue(null),
}))

import { activarPack } from "@/lib/platform/product-lifecycle"
import { persistSistemaLog } from "@/lib/ops/sistema-log"

describe("hybrid-provision-bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("detecta solo pool-propiedad", () => {
    expect(esPackPropiedad("pool-propiedad")).toBe(true)
    expect(esPackPropiedad("niche.consorcios")).toBe(false)
    expect(esPackPropiedad(null)).toBe(false)
  })

  it("provisionarPoolPropiedad activa pack y onboarding SLG/PLG", async () => {
    const result = await provisionarPoolPropiedad(42, "slg")
    expect(activarPack).toHaveBeenCalledWith(42, PACK_PROPIEDAD, "slg")
    expect(result.packId).toBe(PACK_PROPIEDAD)
    expect(result.skus).toContain("niche.consorcios")
    expect(result.onboardingIniciado).toBe(true)
    expect(persistSistemaLog).toHaveBeenCalledWith(
      expect.objectContaining({ contexto: "hybrid-provision", empresaId: 42 }),
    )
  })
})