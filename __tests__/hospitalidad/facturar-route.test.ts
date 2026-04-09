/**
 * API /hospitalidad/facturar — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { POST } from "@/app/api/hospitalidad/facturar/route"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { mockPrismaClient } from "../setup"

const { emitirFactura } = vi.hoisted(() => ({
  emitirFactura: vi.fn(),
}))

vi.mock("@/lib/afip/factura-service", () => {
  return {
    FacturaService: class {
      emitirFactura = emitirFactura
    },
  }
})

vi.mock("@/lib/auth/empresa-guard", () => ({
  getAuthContext: vi.fn(),
  whereEmpresa: (empresaId: number, extra: Record<string, unknown> = {}) => ({
    ...extra,
    empresaId,
  }),
}))

const mockGetAuthContext = getAuthContext as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe("POST /api/hospitalidad/facturar", () => {
  it("should return auth response when not authorized", async () => {
    mockGetAuthContext.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    })

    const res = await POST(new NextRequest("http://test.local/api/hospitalidad/facturar"))
    expect(res.status).toBe(401)
  })

  it("should emit factura and close comanda", async () => {
    mockGetAuthContext.mockResolvedValue({ ok: true, auth: { empresaId: 1 } })
    mockPrismaClient.empresa.findUnique.mockResolvedValue({ id: 1, cuit: "20123456789", puntoVenta: 1 })
    mockPrismaClient.cliente.findFirst.mockResolvedValue({
      id: 2,
      nombre: "Cliente",
      cuit: "20300111222",
      dni: null,
      condicionIva: "CONSUMIDOR_FINAL",
    })
    mockPrismaClient.comanda.findFirst.mockResolvedValue({
      id: 3,
      estado: "abierta",
      facturaId: null,
      mesaId: 10,
      lineas: [
        { id: 1, nombre: "Pizza", cantidad: 2, precio: 100, productoId: 5, producto: { porcentajeIva: 21 } },
      ],
    })
    mockPrismaClient.comanda.update.mockResolvedValue({})
    mockPrismaClient.mesa.update.mockResolvedValue({})

    emitirFactura.mockResolvedValue({
      success: true,
      facturaId: 99,
      cae: "123",
      numero: 100,
    })

    const res = await POST(
      new NextRequest("http://test.local/api/hospitalidad/facturar", {
        method: "POST",
        body: JSON.stringify({ comandaId: 3, clienteId: 2 }),
      })
    )

    expect(res.status).toBe(200)
    expect(emitirFactura).toHaveBeenCalledOnce()
    expect(mockPrismaClient.comanda.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { estado: "cerrada", facturaId: 99 },
    })
  })
})
