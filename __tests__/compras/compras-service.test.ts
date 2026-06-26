import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/events/event-bus", () => ({
  eventBus: { emit: vi.fn(), on: vi.fn() },
}))

vi.mock("@/lib/config/parametro-service", () => ({
  getParametro: vi.fn().mockResolvedValue(0.02),
}))

import { comprasService } from "@/lib/compras/compras-service"

beforeEach(() => vi.clearAllMocks())

describe("ComprasService", () => {
  it("crearOrdenCompra calcula totales y número correlativo", async () => {
    mockPrismaClient.proveedor.findFirst.mockResolvedValue({ id: 5, empresaId: 1 })
    mockPrismaClient.ordenCompra.findFirst.mockResolvedValue({ numero: "00000010" })
    mockPrismaClient.ordenCompra.create.mockResolvedValue({
      id: 1,
      numero: "00000011",
      estado: "borrador",
      subtotal: 1000,
      total: 1210,
    })

    const oc = await comprasService.crearOrdenCompra({
      proveedorId: 5,
      empresaId: 1,
      lineas: [{ descripcion: "Insumo A", cantidad: 10, precioUnitario: 100 }],
    })

    expect(oc.numero).toBe("00000011")
    expect(mockPrismaClient.ordenCompra.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: "borrador", subtotal: 1000 }),
      })
    )
  })

  it("threeWayMatch detecta discrepancia de precio", async () => {
    mockPrismaClient.ordenCompra.findFirst.mockResolvedValue({
      id: 1,
      numero: "00000001",
      lineas: [
        { id: 10, productoId: 1, descripcion: "Cable", cantidad: 100, precioUnitario: 500 },
      ],
      recepciones: [
        {
          lineas: [{ lineaOcId: 10, cantidadRecibida: 100 }],
        },
      ],
    })

    const result = await comprasService.threeWayMatch(1, 1, [
      { descripcion: "Cable", cantidad: 100, precioUnitario: 600, productoId: 1 },
    ])

    expect(result.ok).toBe(false)
    expect(result.discrepancias.some((d) => d.includes("precio"))).toBe(true)
  })

  it("threeWayMatch OK cuando cantidades y precios coinciden", async () => {
    mockPrismaClient.ordenCompra.findFirst.mockResolvedValue({
      id: 1,
      numero: "00000001",
      lineas: [
        { id: 10, productoId: 1, descripcion: "Cable", cantidad: 100, precioUnitario: 500 },
      ],
      recepciones: [
        { lineas: [{ lineaOcId: 10, cantidadRecibida: 100 }] },
      ],
    })

    const result = await comprasService.threeWayMatch(1, 1, [
      { descripcion: "Cable", cantidad: 100, precioUnitario: 500, productoId: 1 },
    ])

    expect(result.ok).toBe(true)
    expect(result.discrepancias).toHaveLength(0)
  })
})