import { describe, expect, it, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    producto: { findFirst: vi.fn(), update: vi.fn() },
    lineaCompra: { findFirst: vi.fn() },
    factura: { findUnique: vi.fn() },
    lineaFactura: { update: vi.fn(), findMany: vi.fn() },
    notaCredito: { findUnique: vi.fn() },
  },
}))

vi.mock("@/lib/config/parametro-service", () => ({
  getParametro: vi.fn().mockResolvedValue(0),
}))

import { prisma } from "@/lib/prisma"
import { actualizarPppPorCompra } from "@/lib/costos/costo-service"

describe("actualizarPppPorCompra", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("recalcula PPP con fórmula ponderada", async () => {
    vi.mocked(prisma.producto.findFirst).mockResolvedValue({
      id: 1,
      stock: 10,
      precioCompra: 100,
    } as never)

    const ppp = await actualizarPppPorCompra(1, 10, 120, 1)

    expect(ppp).toBe(110)
    expect(prisma.producto.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { precioCompra: 110 },
    })
  })

  it("con stock cero usa precio de ingreso", async () => {
    vi.mocked(prisma.producto.findFirst).mockResolvedValue({
      id: 2,
      stock: 0,
      precioCompra: 0,
    } as never)

    const ppp = await actualizarPppPorCompra(2, 5, 250, 1)
    expect(ppp).toBe(250)
  })
})