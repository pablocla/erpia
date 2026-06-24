import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { listarProductosWoo, sincronizarStockWoo } from "@/lib/woocommerce/woocommerce-service"

vi.stubGlobal("fetch", vi.fn())

vi.mock("@/lib/integrations/credentials", () => ({
  obtenerCredencialesIntegracion: vi.fn(),
  guardarCredencialesIntegracion: vi.fn(),
}))

import { obtenerCredencialesIntegracion } from "@/lib/integrations/credentials"

beforeEach(() => vi.clearAllMocks())

describe("WooCommerceService", () => {
  it("listarProductosWoo vacío sin credenciales", async () => {
    vi.mocked(obtenerCredencialesIntegracion).mockResolvedValue({ row: null, credenciales: {} })
    expect(await listarProductosWoo(1)).toEqual([])
  })

  it("sincronizarStockWoo actualiza por SKU", async () => {
    vi.mocked(obtenerCredencialesIntegracion).mockResolvedValue({
      row: null,
      credenciales: {
        siteUrl: "https://tienda.com",
        consumerKey: "ck",
        consumerSecret: "cs",
      },
    })

    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          id: 5,
          name: "Prod",
          sku: "W1",
          stock_quantity: 2,
          price: "500",
          status: "publish",
        }],
      } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) } as Response)

    mockPrismaClient.producto.findMany.mockResolvedValue([{ codigo: "W1", stock: 9 }])

    const r = await sincronizarStockWoo(1)
    expect(r.ok).toBe(true)
    expect(r.sincronizados).toBe(1)
  })
})