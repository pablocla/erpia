import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/almacen-rosario/config", () => ({
  getAlmacenRosarioConfig: vi.fn().mockResolvedValue({
    margen: { margenDefaultPct: 30 },
    zeroWaste: {
      diasDescuento30: 3,
      pctDescuento30: 30,
      diasDescuento50: 1,
      pctDescuento50: 50,
      verduleriaTardeDesde: 18,
      verduleriaTardePct: 15,
    },
    panico: {},
    promociones: [],
  }),
}))

import { evaluarZeroWaste } from "@/lib/almacen-rosario/zero-waste-service"

beforeEach(() => {
  const vence = new Date()
  vence.setDate(vence.getDate() + 1)
  mockPrismaClient.lote = {
    findFirst: vi.fn().mockResolvedValue({
      numeroLote: "L-001",
      fechaVencimiento: vence,
    }),
  }
})

describe("evaluarZeroWaste", () => {
  it("aplica 50% cuando vence en 1-2 días", async () => {
    const r = await evaluarZeroWaste(1, 5, "Yogur La Serenísima")
    expect(r.aplica).toBe(true)
    expect(r.descuentoPct).toBe(50)
  })
})