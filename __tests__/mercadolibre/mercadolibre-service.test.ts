import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import {
  guardarConfigML,
  listarPublicaciones,
  sincronizarStock,
  resumenML,
} from "@/lib/mercadolibre/mercadolibre-service"

beforeEach(() => vi.clearAllMocks())

describe("MercadoLibreService (stub)", () => {
  it("guardarConfigML crea registro si no existe", async () => {
    mockPrismaClient.configuracionFuncional.findFirst.mockResolvedValue(null)
    mockPrismaClient.configuracionFuncional.create.mockResolvedValue({ id: 1 })

    await guardarConfigML(1, {
      clientId: "app-id",
      clientSecret: "secret",
      accessToken: "token",
    })

    expect(mockPrismaClient.configuracionFuncional.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          empresaId: 1,
          clave: "mercado_libre_config",
        }),
      })
    )
  })

  it("listarPublicaciones devuelve array vacío en stub", async () => {
    const pubs = await listarPublicaciones(1)
    expect(pubs).toEqual([])
  })

  it("sincronizarStock falla sin accessToken", async () => {
    mockPrismaClient.configuracionFuncional.findFirst.mockResolvedValue(null)

    const result = await sincronizarStock(1)

    expect(result.ok).toBe(false)
    expect(result.error).toBe("MERCADO_LIBRE_NO_CONFIGURADO")
  })

  it("sincronizarStock OK con token y productos", async () => {
    mockPrismaClient.configuracionFuncional.findFirst.mockResolvedValue({
      valor: JSON.stringify({ accessToken: "tok", updatedAt: "2026-06-01" }),
    })
    mockPrismaClient.producto.findMany.mockResolvedValue([
      { id: 1, nombre: "Prod A", stock: 5, precioVenta: 1000 },
      { id: 2, nombre: "Prod B", stock: 0, precioVenta: 2000 },
    ])

    const result = await sincronizarStock(1)

    expect(result.ok).toBe(true)
    expect(result.sincronizados).toBe(2)
  })

  it("resumenML indica si está configurado", async () => {
    mockPrismaClient.configuracionFuncional.findFirst.mockResolvedValue({
      valor: JSON.stringify({ accessToken: "tok", updatedAt: "2026-06-19" }),
    })

    const resumen = await resumenML(1)

    expect(resumen.configurado).toBe(true)
    expect(resumen.publicacionesActivas).toBe(0)
  })
})