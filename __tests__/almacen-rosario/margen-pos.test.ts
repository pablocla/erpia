import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/almacen-rosario/config", () => ({
  getAlmacenRosarioConfig: vi.fn().mockResolvedValue({
    margen: { bloquearVenta: false, autoAjustarPrecio: true, margenDefaultPct: 30 },
    zeroWaste: {},
    panico: {},
    promociones: [],
  }),
}))

import { evaluarMargenProducto } from "@/lib/almacen-rosario/margen-pos-service"

beforeEach(() => {
  mockPrismaClient.producto = {
    findFirst: vi.fn().mockResolvedValue({
      precioVenta: 1000,
      precioCompra: 1200,
      margenGanancia: 25,
      nombre: "Yerba",
    }),
  }
})

describe("evaluarMargenProducto", () => {
  it("detecta margen negativo y sugiere precio", async () => {
    const r = await evaluarMargenProducto(1, 10)
    expect(r.margenNegativo).toBe(true)
    expect(r.precioSugerido).toBe(1500)
    expect(r.autoAjustar).toBe(true)
  })
})