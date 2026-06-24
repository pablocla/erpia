import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import {
  guardarConfigML,
  listarPublicaciones,
  sincronizarStock,
  resumenML,
} from "@/lib/mercadolibre/mercadolibre-service"

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

vi.mock("@/lib/integrations/credentials", () => ({
  obtenerCredencialesIntegracion: vi.fn(),
  guardarCredencialesIntegracion: vi.fn(),
}))

import {
  obtenerCredencialesIntegracion,
  guardarCredencialesIntegracion,
} from "@/lib/integrations/credentials"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("MercadoLibreService", () => {
  it("guardarConfigML delega a guardarCredencialesIntegracion", async () => {
    vi.mocked(guardarCredencialesIntegracion).mockResolvedValue({ id: 1 } as never)

    await guardarConfigML(1, {
      accessToken: "token",
      refreshToken: "refresh",
      sellerId: "123",
    })

    expect(guardarCredencialesIntegracion).toHaveBeenCalledWith(
      1,
      "mercado_libre",
      expect.objectContaining({ accessToken: "token", sellerId: "123" }),
    )
  })

  it("listarPublicaciones devuelve array vacío sin token", async () => {
    vi.mocked(obtenerCredencialesIntegracion).mockResolvedValue({
      row: null,
      credenciales: {},
    })

    const pubs = await listarPublicaciones(1)
    expect(pubs).toEqual([])
  })

  it("listarPublicaciones consulta API ML con token", async () => {
    vi.mocked(obtenerCredencialesIntegracion).mockResolvedValue({
      row: { tokenExpiresAt: new Date(Date.now() + 3600000) } as never,
      credenciales: { accessToken: "tok", sellerId: "99" },
    })

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ results: ["MLA1"], paging: { total: 1, offset: 0, limit: 50 } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: "MLA1",
          title: "Producto Test",
          price: 1500,
          available_quantity: 3,
          status: "active",
          seller_custom_field: "SKU-1",
        }),
      })

    const pubs = await listarPublicaciones(1)
    expect(pubs).toHaveLength(1)
    expect(pubs[0].titulo).toBe("Producto Test")
    expect(pubs[0].sku).toBe("SKU-1")
  })

  it("sincronizarStock falla sin accessToken", async () => {
    vi.mocked(obtenerCredencialesIntegracion).mockResolvedValue({
      row: null,
      credenciales: {},
    })

    const result = await sincronizarStock(1)
    expect(result.ok).toBe(false)
    expect(result.error).toBe("MERCADO_LIBRE_NO_CONFIGURADO")
  })

  it("sincronizarStock actualiza items con SKU coincidente", async () => {
    vi.mocked(obtenerCredencialesIntegracion).mockResolvedValue({
      row: { tokenExpiresAt: new Date(Date.now() + 3600000) } as never,
      credenciales: { accessToken: "tok", sellerId: "99" },
    })

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: ["MLA1"], paging: { total: 1, offset: 0, limit: 50 } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "MLA1",
          title: "Prod",
          price: 100,
          available_quantity: 1,
          status: "active",
          seller_custom_field: "A1",
        }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) })

    mockPrismaClient.producto.findMany.mockResolvedValue([
      { id: 1, codigo: "A1", stock: 10 },
    ])

    const result = await sincronizarStock(1)
    expect(result.ok).toBe(true)
    expect(result.sincronizados).toBe(1)
  })

  it("resumenML indica si está configurado", async () => {
    vi.mocked(obtenerCredencialesIntegracion).mockResolvedValue({
      row: { updatedAt: new Date("2026-06-19") } as never,
      credenciales: { accessToken: "tok", sellerId: "99" },
    })

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], paging: { total: 0, offset: 0, limit: 50 } }),
      })

    const resumen = await resumenML(1)
    expect(resumen.configurado).toBe(true)
    expect(resumen.publicacionesActivas).toBe(0)
  })
})