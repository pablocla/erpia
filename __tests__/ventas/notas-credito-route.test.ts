/**
 * API /notas-credito — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { POST } from "@/app/api/notas-credito/route"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/auth/empresa-guard", () => ({
  getAuthContext: vi.fn(),
}))

vi.mock("@/lib/contabilidad/factura-hooks", () => ({
  onNCEmitida: vi.fn(),
}))

vi.mock("@/lib/events/event-bus", () => ({
  eventBus: { emit: vi.fn(), on: vi.fn() },
}))

const mockGetAuthContext = getAuthContext as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe("POST /api/notas-credito", () => {
  it("should create a partial credit note with lineaFacturaId", async () => {
    mockGetAuthContext.mockResolvedValue({ ok: true, auth: { empresaId: 1 } })

    mockPrismaClient.factura.findUnique.mockResolvedValue({
      id: 1,
      tipo: "A",
      puntoVenta: 1,
      numero: 100,
      total: 1000,
      subtotal: 826.45,
      iva: 173.55,
      estado: "emitida",
      clienteId: 5,
      lineas: [
        {
          id: 2,
          descripcion: "Producto X",
          cantidad: 1,
          precioUnitario: 826.45,
          porcentajeIva: 21,
          productoId: 10,
        },
      ],
    })

    mockPrismaClient.notaCredito.aggregate.mockResolvedValue({ _sum: { total: 0 } })
    mockPrismaClient.notaCredito.findFirst.mockResolvedValue(null)
    mockPrismaClient.notaCredito.create.mockResolvedValue({
      id: 11,
      tipo: "A",
      numero: 1,
      puntoVenta: 1,
      total: 1000,
      estado: "emitida",
    })

    const body = {
      facturaId: 1,
      motivo: "Devolución parcial",
      items: [{ lineaFacturaId: 2, cantidad: 1 }],
    }

    const res = await POST(
      new NextRequest("http://test.local/api/notas-credito", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    )

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe(11)
    expect(mockPrismaClient.notaCredito.create).toHaveBeenCalledOnce()
    expect(mockPrismaClient.notaCredito.create.mock.calls[0][0].data.lineas.create[0]).toMatchObject({
      lineaFacturaId: 2,
      cantidad: 1,
      precioUnitario: 826.45,
      porcentajeIva: 21,
    })
  })

  it("should create a partial credit note with manual montoNC when no factura line is selected", async () => {
    mockGetAuthContext.mockResolvedValue({ ok: true, auth: { empresaId: 1 } })

    mockPrismaClient.factura.findUnique.mockResolvedValue({
      id: 1,
      tipo: "B",
      puntoVenta: 2,
      numero: 200,
      total: 1210,
      subtotal: 1000,
      iva: 210,
      estado: "emitida",
      clienteId: 6,
      lineas: [],
    })

    mockPrismaClient.notaCredito.aggregate.mockResolvedValue({ _sum: { total: 0 } })
    mockPrismaClient.notaCredito.findFirst.mockResolvedValue(null)
    mockPrismaClient.notaCredito.create.mockResolvedValue({
      id: 12,
      tipo: "B",
      numero: 1,
      puntoVenta: 2,
      total: 1210,
      estado: "emitida",
    })

    const body = {
      facturaId: 1,
      motivo: "Ajuste de precio",
      items: [{ descripcion: "NC parcial manual", cantidad: 1, precioUnitario: 1100, porcentajeIva: 10.0 }],
    }

    const res = await POST(
      new NextRequest("http://test.local/api/notas-credito", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    )

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe(12)
    expect(mockPrismaClient.notaCredito.create.mock.calls[0][0].data.lineas.create[0]).toMatchObject({
      descripcion: "NC parcial manual",
      cantidad: 1,
      precioUnitario: 1100,
      porcentajeIva: 10,
    })
  })
})
