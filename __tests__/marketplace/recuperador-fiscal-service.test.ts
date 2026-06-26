import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { auditarPercepcionesRecuperables } from "@/lib/marketplace/recuperador-fiscal-service"

beforeEach(() => {
  vi.clearAllMocks()
  mockPrismaClient.compra = {
    findMany: vi.fn().mockResolvedValue([
      {
        id: 1,
        numero: "0001-00000001",
        fecha: new Date("2026-01-15"),
        totalPercepciones: 1500,
        proveedor: { nombre: "Proveedor SA", cuit: "30-12345678-9", activo: true },
        tributos: [],
      },
      {
        id: 2,
        numero: "0001-00000002",
        fecha: new Date("2026-02-10"),
        totalPercepciones: 500,
        proveedor: { nombre: "Otro", cuit: "30-99999999-9", activo: true },
        tributos: [{ importe: 500 }],
      },
    ]),
  }
  mockPrismaClient.proveedor = {
    count: vi.fn().mockResolvedValue(1),
  }
})

describe("auditarPercepcionesRecuperables", () => {
  it("detecta compras con percepciones sin detalle tributario", async () => {
    const res = await auditarPercepcionesRecuperables(1)

    expect(res.comprasSinDetalle).toBe(1)
    expect(res.montoRecuperableEstimado).toBe(1500)
    expect(res.alerta).toBe(true)
    expect(res.detalle[0]?.numero).toBe("0001-00000001")
  })
})