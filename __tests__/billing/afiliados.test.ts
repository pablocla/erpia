import { describe, it, expect, vi, beforeEach } from "vitest"
import { AFILIADO_RATES, tasaNivel1, tasaNivel2, normalizeReferralCode } from "@/lib/partners/affiliate-config"

describe("affiliate-config", () => {
  it("tasas seller 30% / 5%", () => {
    expect(tasaNivel1("seller")).toBe(AFILIADO_RATES.sellerNivel1)
    expect(tasaNivel1("hybrid")).toBe(0.3)
    expect(tasaNivel2("seller")).toBe(0.05)
  })

  it("tasas implementer 20% / 5%", () => {
    expect(tasaNivel1("implementer")).toBe(0.2)
    expect(tasaNivel2("implementer")).toBe(0.05)
  })

  it("normaliza referral code", () => {
    expect(normalizeReferralCode("contador perez")).toBe("CONTADOR_PEREZ")
    expect(normalizeReferralCode("  Foo-Bar  ")).toBe("FOO-BAR")
  })
})

const mockCreate = vi.fn()
const mockFindUnique = vi.fn()

vi.mock("@/lib/prisma", () => ({
  prisma: {
    empresa: { findUnique: (...a: unknown[]) => mockFindUnique(...a) },
    comisionPartner: { create: (...a: unknown[]) => mockCreate(...a) },
    partnerProfile: { findFirst: vi.fn(), findUnique: vi.fn() },
  },
}))

describe("registrarComisionesPorPago", () => {
  beforeEach(() => {
    mockCreate.mockReset()
    mockFindUnique.mockReset()
    mockCreate.mockResolvedValue({ id: 1 })
  })

  it("crea N1 30% y N2 5% sobre el pago", async () => {
    mockFindUnique.mockResolvedValue({
      id: 10,
      referredByPartnerId: 1,
      referredByPartner: {
        id: 1,
        tipo: "seller",
        activo: true,
        parentPartnerId: 2,
        parentPartner: { id: 2, tipo: "seller", activo: true },
      },
    })

    const { registrarComisionesPorPago } = await import("@/lib/partners/affiliate-service")
    const r = await registrarComisionesPorPago({
      empresaId: 10,
      montoPagado: 100_000,
      sku: "core.claver",
      periodoKey: "2026-07",
    })

    expect(r.creadas).toBe(2)
    expect(r.montos[0]).toBe(30_000)
    expect(r.montos[1]).toBe(5_000)
    expect(mockCreate).toHaveBeenCalledTimes(2)

    const n1 = mockCreate.mock.calls[0][0].data
    expect(n1.nivel).toBe(1)
    expect(Number(n1.monto)).toBe(30_000)
    expect(n1.partnerId).toBe(1)

    const n2 = mockCreate.mock.calls[1][0].data
    expect(n2.nivel).toBe(2)
    expect(Number(n2.monto)).toBe(5_000)
    expect(n2.partnerId).toBe(2)
  })

  it("sin partner referido no crea comisiones", async () => {
    mockFindUnique.mockResolvedValue({
      id: 11,
      referredByPartnerId: null,
      referredByPartner: null,
    })
    const { registrarComisionesPorPago } = await import("@/lib/partners/affiliate-service")
    const r = await registrarComisionesPorPago({ empresaId: 11, montoPagado: 50_000 })
    expect(r.creadas).toBe(0)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("implementer usa 20% en N1", async () => {
    mockFindUnique.mockResolvedValue({
      id: 12,
      referredByPartnerId: 5,
      referredByPartner: {
        id: 5,
        tipo: "implementer",
        activo: true,
        parentPartnerId: null,
        parentPartner: null,
      },
    })
    const { registrarComisionesPorPago } = await import("@/lib/partners/affiliate-service")
    const r = await registrarComisionesPorPago({
      empresaId: 12,
      montoPagado: 100_000,
      periodoKey: "2026-07",
    })
    expect(r.creadas).toBe(1)
    expect(r.montos[0]).toBe(20_000)
  })
})
