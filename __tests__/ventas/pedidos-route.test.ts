/**
 * API /ventas/pedidos — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "@/app/api/ventas/pedidos/route"
import { getAuthContext } from "@/lib/auth/empresa-guard"

vi.mock("@/lib/auth/empresa-guard", () => ({
  getAuthContext: vi.fn(),
}))

vi.mock("@/lib/ventas/ventas-service", () => ({
  ventasService: {
    facturarPedido: vi.fn(),
  },
}))

const mockGetAuthContext = getAuthContext as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe("POST /api/ventas/pedidos", () => {
  it("should facturar pedido and emit FACTURA_EMITIDA event", async () => {
    mockGetAuthContext.mockResolvedValue({ ok: true, auth: { empresaId: 1, userId: 42 } })

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
