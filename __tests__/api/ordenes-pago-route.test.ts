/**
 * API /ordenes-pago — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { GET } from "@/app/api/ordenes-pago/route"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { pagosService } from "@/lib/pagos/pagos-service"

vi.mock("@/lib/auth/empresa-guard", () => ({
  getAuthContext: vi.fn(),
}))

vi.mock("@/lib/pagos/pagos-service", () => ({
  pagosService: {
    listarOrdenesPago: vi.fn(),
  },
}))

const mockGetAuthContext = getAuthContext as unknown as ReturnType<typeof vi.fn>
const mockListarOrdenes = pagosService.listarOrdenesPago as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe("GET /api/ordenes-pago", () => {
  it("should return auth response when not authorized", async () => {
    mockGetAuthContext.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    })

    const res = await GET(new NextRequest("http://test.local/api/ordenes-pago"))
    expect(res.status).toBe(401)
  })

  it("should pass filters to listarOrdenesPago", async () => {
    mockGetAuthContext.mockResolvedValue({ ok: true, auth: { empresaId: 9 } })
    mockListarOrdenes.mockResolvedValue({ data: [], total: 0, skip: 10, take: 40 })

    const req = new NextRequest(
      "http://test.local/api/ordenes-pago?proveedorId=5&desde=2026-02-01&hasta=2026-02-28&skip=10&take=40"
    )

    const res = await GET(req)
    expect(res.status).toBe(200)

    const call = mockListarOrdenes.mock.calls[0][0]
    expect(call.empresaId).toBe(9)
    expect(call.proveedorId).toBe(5)
    expect(call.skip).toBe(10)
    expect(call.take).toBe(40)
    expect(call.desde?.toISOString()).toBe("2026-02-01T00:00:00.000Z")
    expect(call.hasta?.toISOString()).toBe("2026-02-28T00:00:00.000Z")

    const payload = await res.json()
    expect(payload).toEqual({ data: [], total: 0, skip: 10, take: 40 })
  })
})
