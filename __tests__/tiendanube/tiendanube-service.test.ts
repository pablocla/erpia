import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  listarProductosTN,
  sincronizarStockTN,
  resumenTN,
} from "@/lib/tiendanube/tiendanube-service"

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

vi.mock("@/lib/integrations/credentials", () => ({
  obtenerCredencialesIntegracion: vi.fn(),
  guardarCredencialesIntegracion: vi.fn(),
}))

import { obtenerCredencialesIntegracion } from "@/lib/integrations/credentials"
import { mockPrismaClient } from "../setup"

beforeEach(() => vi.clearAllMocks())

describe("TiendaNubeService", () => {
  it("listarProductosTN devuelve vacío sin token", async () => {
    vi.mocked(obtenerCredencialesIntegracion).mockResolvedValue({
      row: null,
      credenciales: {},
    })
    expect(await listarProductosTN(1)).toEqual([])
  })

  it("listarProductosTN mapea productos de la API", async () => {
    vi.mocked(obtenerCredencialesIntegracion).mockResolvedValue({
      row: null,
      credenciales: { accessToken: "tok", storeId: "555" },
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{
        id: 10,
        name: { es: "Remera" },
        published: true,
        variants: [{ id: 1, sku: "REM-01", stock: 5, price: "1999.00" }],
      }],
    })

    const prods = await listarProductosTN(1)
    expect(prods).toHaveLength(1)
    expect(prods[0].nombre).toBe("Remera")
    expect(prods[0].sku).toBe("REM-01")
  })

  it("sincronizarStockTN falla sin configuración", async () => {
    vi.mocked(obtenerCredencialesIntegracion).mockResolvedValue({
      row: null,
      credenciales: {},
    })
    const r = await sincronizarStockTN(1)
    expect(r.ok).toBe(false)
    expect(r.error).toBe("TIENDA_NUBE_NO_CONFIGURADO")
  })

  it("sincronizarStockTN actualiza variantes por SKU", async () => {
    vi.mocked(obtenerCredencialesIntegracion).mockResolvedValue({
      row: null,
      credenciales: { accessToken: "tok", storeId: "555" },
    })

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          id: 10,
          name: { es: "Remera" },
          published: true,
          variants: [{ id: 1, sku: "REM-01", stock: 5, price: "100" }],
        }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 10,
          variants: [{ id: 1, sku: "REM-01" }],
        }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) })

    mockPrismaClient.producto.findMany.mockResolvedValue([
      { codigo: "REM-01", stock: 12 },
    ])

    const r = await sincronizarStockTN(1)
    expect(r.ok).toBe(true)
    expect(r.sincronizados).toBe(1)
  })

  it("resumenTN reporta configuración", async () => {
    vi.mocked(obtenerCredencialesIntegracion).mockResolvedValue({
      row: { updatedAt: new Date("2026-06-20") } as never,
      credenciales: { accessToken: "tok", storeId: "555" },
    })

    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] })

    const r = await resumenTN(1)
    expect(r.configurado).toBe(true)
    expect(r.productosPublicados).toBe(0)
  })
})