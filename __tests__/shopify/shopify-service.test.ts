import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { listarProductosShopify, sincronizarStockShopify } from "@/lib/shopify/shopify-service"

vi.stubGlobal("fetch", vi.fn())

vi.mock("@/lib/integrations/credentials", () => ({
  obtenerCredencialesIntegracion: vi.fn(),
  guardarCredencialesIntegracion: vi.fn(),
}))

import { obtenerCredencialesIntegracion } from "@/lib/integrations/credentials"

beforeEach(() => vi.clearAllMocks())

describe("ShopifyService", () => {
  it("listarProductosShopify vacío sin token", async () => {
    vi.mocked(obtenerCredencialesIntegracion).mockResolvedValue({ row: null, credenciales: {} })
    expect(await listarProductosShopify(1)).toEqual([])
  })

  it("sincronizarStockShopify actualiza inventario por SKU", async () => {
    vi.mocked(obtenerCredencialesIntegracion).mockResolvedValue({
      row: null,
      credenciales: { accessToken: "tok", shopDomain: "demo.myshopify.com" },
    })

    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ locations: [{ id: 1, name: "Main", active: true }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          products: [{
            id: 1,
            title: "Prod",
            status: "active",
            variants: [{ id: 10, sku: "SKU1", price: "100", inventory_quantity: 1, inventory_item_id: 99 }],
          }],
        }),
      } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) } as Response)

    mockPrismaClient.producto.findMany.mockResolvedValue([{ codigo: "SKU1", stock: 7 }])

    const r = await sincronizarStockShopify(1)
    expect(r.ok).toBe(true)
    expect(r.sincronizados).toBe(1)
  })
})