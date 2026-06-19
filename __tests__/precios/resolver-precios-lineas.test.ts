import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { resolverPreciosLineas } from "@/lib/precios/resolver-precios-lineas"

beforeEach(() => vi.clearAllMocks())

describe("resolverPreciosLineas", () => {
  it("respeta precio manual cuando viene explícito", async () => {
    const result = await resolverPreciosLineas(
      [{ productoId: 1, cantidad: 2, precioUnitario: 1500 }],
      { empresaId: 1, clienteId: 5 }
    )
    expect(result[0].precioUnitario).toBe(1500)
    expect(result[0].precioOrigen).toBe("manual")
    expect(mockPrismaClient.cliente.findUnique).not.toHaveBeenCalled()
  })

  it("resuelve desde motor cuando precio es 0", async () => {
    mockPrismaClient.listaPrecio.findFirst.mockResolvedValue({
      nombre: "Retail",
      items: [{ precio: 800, descuento: 0, escalones: [] }],
    })

    const result = await resolverPreciosLineas(
      [{ productoId: 10, cantidad: 1, precioUnitario: 0 }],
      { empresaId: 1 }
    )

    expect(result[0].precioUnitario).toBe(800)
    expect(result[0].precioOrigen).toBe("lista_default")
  })

  it("forzarLista ignora override manual", async () => {
    mockPrismaClient.cliente.findUnique.mockResolvedValue({
      listaPrecioId: 1,
      listaPrecio: {
        nombre: "VIP",
        activo: true,
        vigenciaDesde: new Date("2020-01-01"),
        vigenciaHasta: null,
        items: [{ precio: 500, descuento: 0, escalones: [] }],
      },
    })

    const result = await resolverPreciosLineas(
      [{ productoId: 3, cantidad: 1, precioUnitario: 9999 }],
      { empresaId: 1, clienteId: 2, forzarLista: true }
    )

    expect(result[0].precioUnitario).toBe(500)
    expect(result[0].listaAplicada).toBe("VIP")
  })
})