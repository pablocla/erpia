import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockFindFirst } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    factura: { findFirst: mockFindFirst },
    movimientoCaja: { findMany: vi.fn(), aggregate: vi.fn() },
    notaCredito: { findFirst: vi.fn(), aggregate: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/contabilidad/factura-hooks", () => ({
  onNCEmitida: vi.fn(),
}))

vi.mock("@/lib/events/event-bus", () => ({
  eventBus: { emit: vi.fn(), on: vi.fn() },
}))

vi.mock("@/lib/stock/stock-service", () => ({}))
vi.mock("@/lib/cc-cp/cuentas-service", () => ({}))

import { obtenerFacturaDevolucion } from "@/lib/pos/devolucion-venta-pos"

describe("devolucion-venta-pos", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("obtenerFacturaDevolucion calcula cantidades disponibles", async () => {
    const hoy = new Date()
    mockFindFirst.mockResolvedValue({
      id: 10,
      tipo: "B",
      puntoVenta: 1,
      numero: 5,
      total: 1000,
      estado: "emitida",
      createdAt: hoy,
      lineas: [
        {
          id: 1,
          productoId: 7,
          descripcion: "Producto A",
          cantidad: 2,
          precioUnitario: 400,
          porcentajeIva: 21,
        },
      ],
      notasCredito: [
        {
          total: 484,
          lineas: [{ lineaFacturaId: 1, cantidad: 1 }],
        },
      ],
    })

    const result = await obtenerFacturaDevolucion(1, 10)

    expect(result.devolvable).toBe(true)
    expect(result.lineas).toHaveLength(1)
    expect(result.lineas[0].cantidadDisponible).toBe(1)
    expect(result.totalDevuelto).toBe(484)
  })

  it("obtenerFacturaDevolucion rechaza factura inexistente", async () => {
    mockFindFirst.mockResolvedValue(null)
    await expect(obtenerFacturaDevolucion(1, 99)).rejects.toThrow("Factura no encontrada")
  })
})