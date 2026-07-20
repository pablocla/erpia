import { describe, it, expect, vi, beforeEach } from "vitest"
import { AFILIADO_RATES } from "@/lib/partners/affiliate-config"

const mockFindMany = vi.fn()
const mockUpdate = vi.fn()
const mockCreate = vi.fn()
const mockGroupBy = vi.fn()
const mockCount = vi.fn()
const mockPartnerFind = vi.fn()
const mockUpsertSub = vi.fn()
const mockUpsertParam = vi.fn()
const mockEmpresaUpdate = vi.fn()

vi.mock("@/lib/prisma", () => ({
  prisma: {
    comisionPartner: {
      findMany: (...a: unknown[]) => mockFindMany(...a),
      update: (...a: unknown[]) => mockUpdate(...a),
      create: (...a: unknown[]) => mockCreate(...a),
      groupBy: (...a: unknown[]) => mockGroupBy(...a),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    partnerProfile: {
      findUnique: (...a: unknown[]) => mockPartnerFind(...a),
      findMany: vi.fn().mockResolvedValue([]),
    },
    empresa: {
      count: (...a: unknown[]) => mockCount(...a),
      update: (...a: unknown[]) => mockEmpresaUpdate(...a),
    },
    suscripcionModulo: {
      upsert: (...a: unknown[]) => mockUpsertSub(...a),
    },
    parametroFiscal: {
      upsert: (...a: unknown[]) => mockUpsertParam(...a),
    },
  },
}))

vi.mock("@/lib/platform/product-lifecycle", () => ({
  activarProducto: vi.fn().mockResolvedValue({ ok: true }),
}))

vi.mock("@/lib/billing/mercadopago-subscription", () => ({
  activarSuscripcionPagada: vi.fn().mockResolvedValue(undefined),
}))

describe("partner-wallet rates + config", () => {
  it("seller rates monetizan 30% N1", () => {
    expect(AFILIADO_RATES.sellerNivel1).toBe(0.3)
  })
})

describe("consumirCreditoPartner", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})
    mockUpsertParam.mockResolvedValue({})
  })

  it("consume FIFO comisiones completas", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 1,
        monto: 20_000,
        empresaOrigenId: 9,
        montoBase: 100_000,
        porcentaje: 30,
        nivel: 1,
        rolPartner: "seller",
        sku: "core.claver",
        idempotencyKey: "k1",
      },
      {
        id: 2,
        monto: 15_000,
        empresaOrigenId: 10,
        montoBase: 50_000,
        porcentaje: 30,
        nivel: 1,
        rolPartner: "seller",
        sku: "core.claver",
        idempotencyKey: "k2",
      },
    ])

    const { consumirCreditoPartner } = await import("@/lib/partners/partner-wallet-service")
    const r = await consumirCreditoPartner(1, 30_000, {
      empresaId: 1,
      sku: "core.claver",
      motivo: "test",
    })

    expect(r.consumido).toBe(30_000)
    expect(r.comisionIds).toEqual([1, 2])
    // primera full, segunda split
    expect(mockUpdate).toHaveBeenCalledTimes(2)
    expect(mockCreate).toHaveBeenCalledTimes(1) // residual 5k
  })

  it("falla si no alcanza", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 1,
        monto: 1000,
        empresaOrigenId: 1,
        montoBase: 1000,
        porcentaje: 30,
        nivel: 1,
        rolPartner: "seller",
        sku: null,
        idempotencyKey: "x",
      },
    ])
    const { consumirCreditoPartner } = await import("@/lib/partners/partner-wallet-service")
    await expect(
      consumirCreditoPartner(1, 50_000, { empresaId: 1, sku: "core.claver", motivo: "t" }),
    ).rejects.toThrow(/insuficiente/i)
  })
})

describe("canjearContadorGratis", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpsertSub.mockResolvedValue({})
    mockUpsertParam.mockResolvedValue({})
  })

  it("exige 3 referidos pagos", async () => {
    mockPartnerFind.mockResolvedValue({ id: 7, activo: true })
    mockCount.mockResolvedValue(2)
    const { canjearContadorGratis } = await import("@/lib/partners/partner-wallet-service")
    await expect(
      canjearContadorGratis({ usuarioId: 1, empresaId: 1 }),
    ).rejects.toThrow(/3 referidos/)
  })

  it("canjea con 3+", async () => {
    mockPartnerFind.mockResolvedValue({ id: 7, activo: true })
    mockCount.mockResolvedValue(3)
    const { canjearContadorGratis } = await import("@/lib/partners/partner-wallet-service")
    const r = await canjearContadorGratis({ usuarioId: 1, empresaId: 1 })
    expect(r.ok).toBe(true)
    expect(r.clientesPagos).toBe(3)
  })
})
