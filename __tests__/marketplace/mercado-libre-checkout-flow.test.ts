/**
 * Mercado Libre — flujo marketplace post-pago + smoke API con token real.
 *
 * Unit (siempre): cliente paga integ.mercado_libre → job pending + tarea analista, SKU sin activar.
 * Live (opcional): definí ML_TEST_ACCESS_TOKEN y ML_TEST_SELLER_ID en .env.local
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/ops/sistema-log", () => ({
  persistSistemaLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/platform/product-lifecycle", () => ({
  activarProducto: vi.fn().mockResolvedValue({ ok: true }),
}))

vi.mock("@/lib/marketplace/analyst-task-service", () => ({
  crearTareaMarketplace: vi.fn().mockResolvedValue({
    id: "tarea-ml-1",
    asignadoA: "analista@claver.com",
    estado: "pendiente",
  }),
  resolverAnalistaEmpresa: vi.fn().mockResolvedValue("analista@claver.com"),
}))

import { activarProducto } from "@/lib/platform/product-lifecycle"
import { crearTareaMarketplace } from "@/lib/marketplace/analyst-task-service"
import { provisionSku, provisionOrden } from "@/lib/marketplace/provision-service"
import { resolveSku } from "@/lib/marketplace/catalog-resolver"
import { getRunbook } from "@/lib/marketplace/product-runbooks"

const ML_SKU = "integ.mercado_libre"

const hasLiveMlCreds =
  Boolean(process.env.ML_TEST_ACCESS_TOKEN?.trim()) &&
  Boolean(process.env.ML_TEST_SELLER_ID?.trim())

beforeEach(() => {
  vi.clearAllMocks()
  mockPrismaClient.marketplaceProvisionJob = {
    create: vi.fn().mockResolvedValue({
      id: "job-ml-1",
      metadata: {},
      createdAt: new Date(),
      pasosJson: [],
    }),
    update: vi.fn().mockResolvedValue({}),
    findUnique: vi.fn().mockResolvedValue({
      id: "job-ml-1",
      pasosJson: [{ orden: 1, titulo: "OAuth ML", done: false }],
      createdAt: new Date(),
    }),
  }
  mockPrismaClient.marketplaceOrden = {
    findFirst: vi.fn().mockResolvedValue({
      id: "orden-ml-1",
      estado: "paid",
      items: [{ sku: ML_SKU, cantidad: 1, precio: 14900 }],
    }),
  }
})

describe("Mercado Libre — catálogo y runbook", () => {
  it("integ.mercado_libre es SEMI_AUTO (analista tras el pago)", () => {
    const item = resolveSku(ML_SKU)
    expect(item).not.toBeNull()
    expect(item?.autoCertLevel).toBe("SEMI_AUTO")
    expect(item?.integracionId).toBe("mercado_libre")
  })

  it("tiene runbook con paso de validación analista", () => {
    const rb = getRunbook(ML_SKU)
    expect(rb).not.toBeNull()
    expect(rb?.pasos.some((p) => p.ejecutor === "analista")).toBe(true)
    expect(rb?.ccaFase).toBe("CCA-050")
  })
})

describe("Mercado Libre — flujo post-pago cliente → analista", () => {
  it("provisionSku crea tarea analista y NO activa el SKU", async () => {
    const result = await provisionSku(1, ML_SKU, { ordenId: "orden-ml-1", iniciadoPor: "checkout" })

    expect(result.auto).toBe(false)
    expect(result.sku).toBe(ML_SKU)
    expect(crearTareaMarketplace).toHaveBeenCalledWith(
      expect.objectContaining({
        empresaId: 1,
        sku: ML_SKU,
        autoCertLevel: "SEMI_AUTO",
        provisionJobId: "job-ml-1",
      }),
    )
    expect(activarProducto).not.toHaveBeenCalled()
    expect(mockPrismaClient.marketplaceProvisionJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: "pending",
          metadata: expect.objectContaining({ esperando: "analista" }),
        }),
      }),
    )
  })

  it("provisionOrden (checkout paid) deja provisión pendiente para analista", async () => {
    const results = await provisionOrden(1, "orden-ml-1")

    expect(results).toHaveLength(1)
    expect(results[0].auto).toBe(false)
    expect(results[0].sku).toBe(ML_SKU)
    expect(crearTareaMarketplace).toHaveBeenCalled()
    expect(activarProducto).not.toHaveBeenCalled()
  })
})

function liveMlCreds() {
  const token = process.env.ML_TEST_ACCESS_TOKEN?.trim()
  const sellerId = process.env.ML_TEST_SELLER_ID?.trim()
  if (!token || !sellerId) return null
  return { token, sellerId }
}

describe.skipIf(!hasLiveMlCreds)("Mercado Libre — API live (ML_TEST_*)", () => {
  it("access token válido — GET /users/:sellerId", async () => {
    const { token, sellerId } = liveMlCreds()!
    const res = await fetch(`https://api.mercadolibre.com/users/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
    expect(res.ok, await res.text()).toBe(true)
    const user = (await res.json()) as { id: number; nickname?: string }
    expect(String(user.id)).toBe(sellerId)
  })

  it("listar publicaciones activas del seller", async () => {
    const { token, sellerId } = liveMlCreds()!
    const res = await fetch(
      `https://api.mercadolibre.com/users/${sellerId}/items/search?status=active&limit=5`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
    )
    expect(res.ok, await res.text()).toBe(true)
    const data = (await res.json()) as { results: string[]; paging: { total: number } }
    expect(Array.isArray(data.results)).toBe(true)
    expect(typeof data.paging.total).toBe("number")
  })

  it("credenciales de test alimentan listarPublicaciones vía servicio", async () => {
    const { token, sellerId } = liveMlCreds()!
    vi.resetModules()
    vi.doMock("@/lib/integrations/credentials", () => ({
      obtenerCredencialesIntegracion: vi.fn().mockResolvedValue({
        row: { tokenExpiresAt: new Date(Date.now() + 3_600_000), updatedAt: new Date() },
        credenciales: { accessToken: token, sellerId },
      }),
      guardarCredencialesIntegracion: vi.fn(),
    }))

    const mockFetch = vi.fn()
    vi.stubGlobal("fetch", mockFetch)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ results: [], paging: { total: 0, offset: 0, limit: 50 } }),
      })

    const { listarPublicaciones } = await import("@/lib/mercadolibre/mercadolibre-service")
    const pubs = await listarPublicaciones(1)
    expect(pubs).toEqual([])
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/users/${sellerId}/items/search`),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${token}` }),
      }),
    )
  })
})