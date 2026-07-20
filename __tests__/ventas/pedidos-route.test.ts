/**
 * API /ventas/pedidos — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "@/app/api/ventas/pedidos/route"

vi.mock("@/lib/auth/empresa-guard", () => ({
  withAuthAndTenant: (handler: any) => {
    return async (req: any, ...args: any[]) => {
      return handler(req, { empresaId: 1, userId: 42 }, ...args)
    }
  },
}))

vi.mock("@/lib/ventas/ventas-service", () => ({
  ventasService: {
    facturarPedido: vi.fn(),
  },
}))

describe("POST /api/ventas/pedidos", () => {
  it("should facturar pedido and emit FACTURA_EMITIDA event", async () => {

    const mockResult = {
      id: 55,
      clienteId: 10,
      total: 1500,
      condicionPagoId: 2,
    }

    const { ventasService } = await import("@/lib/ventas/ventas-service")

    ventasService.facturarPedido.mockResolvedValue(mockResult)

    const body = {
      action: "facturar",
      pedidoId: 123,
      tipo: "B",
      tipoCbte: 6,
      puntoVenta: 1,
      condicionPagoId: 2,
      depositoId: 5,
    }

    const res = await POST(
      new NextRequest("http://test.local/api/ventas/pedidos", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual(mockResult)
    expect(ventasService.facturarPedido).toHaveBeenCalledWith(123, {
      empresaId: 1,
      tipo: "B",
      tipoCbte: 6,
      puntoVenta: 1,
      cae: undefined,
      condicionPagoId: 2,
      depositoId: 5,
    })
  })
})
