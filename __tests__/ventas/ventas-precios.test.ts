import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/events/event-bus", () => ({
  eventBus: { emit: vi.fn(), on: vi.fn() },
}))

import { VentasService } from "@/lib/ventas/ventas-service"

let service: InstanceType<typeof VentasService>

beforeEach(() => {
  vi.clearAllMocks()
  service = new VentasService()
})

describe("VentasService — integración motor de precios", () => {
  it("resuelve precio desde lista cuando precioUnitario se omite", async () => {
    mockPrismaClient.cliente.findFirst.mockResolvedValue({ id: 1, empresaId: 1 })
    mockPrismaClient.listaPrecio.findFirst.mockResolvedValue({
      nombre: "Público",
      items: [{ precio: 1200, descuento: 0, escalones: [] }],
    })
    mockPrismaClient.pedidoVenta.findFirst.mockResolvedValue(null)
    mockPrismaClient.pedidoVenta.create.mockImplementation(({ data }: { data: { subtotal: number } }) =>
      Promise.resolve({ id: 1, numero: "PV-000001", estado: "borrador", subtotal: data.subtotal, total: data.subtotal * 1.21 })
    )

    await service.crearPedidoVenta({
      clienteId: 1,
      empresaId: 1,
      lineas: [{ productoId: 10, descripcion: "Producto A", cantidad: 2 }],
    })

    expect(mockPrismaClient.pedidoVenta.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 2400,
          lineas: {
            create: expect.arrayContaining([
              expect.objectContaining({ precioUnitario: 1200, subtotal: 2400 }),
            ]),
          },
        }),
      })
    )
  })
})