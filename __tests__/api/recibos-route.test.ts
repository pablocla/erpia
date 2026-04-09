/**
 * API /recibos — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { GET } from "@/app/api/recibos/route"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { cobrosService } from "@/lib/cobros/cobros-service"

vi.mock("@/lib/auth/empresa-guard", () => ({
  getAuthContext: vi.fn(),
}))

vi.mock("@/lib/cobros/cobros-service", () => ({
  cobrosService: {
    listarRecibos: vi.fn(),
  },
}))

const mockGetAuthContext = getAuthContext as unknown as ReturnType<typeof vi.fn>
const mockListarRecibos = cobrosService.listarRecibos as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe("GET /api/recibos", () => {
  it("should return auth response when not authorized", async () => {
    mockGetAuthContext.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    })

    const res = await GET(new NextRequest("http://test.local/api/recibos"))
    expect(res.status).toBe(401)
  })

  it("should pass filters to listarRecibos", async () => {
    mockGetAuthContext.mockResolvedValue({ ok: true, auth: { empresaId: 7 } })
    mockListarRecibos.mockResolvedValue({ data: [], total: 0, skip: 5, take: 20 })

    const req = new NextRequest(
      "http://test.local/api/recibos?clienteId=3&desde=2026-01-01&hasta=2026-01-31&skip=5&take=20"
    )

    const res = await GET(req)
    expect(res.status).toBe(200)

    const call = mockListarRecibos.mock.calls[0][0]
    expect(call.empresaId).toBe(7)
    expect(call.clienteId).toBe(3)
    expect(call.skip).toBe(5)
    expect(call.take).toBe(20)
    expect(call.desde?.toISOString()).toBe("2026-01-01T00:00:00.000Z")
    expect(call.hasta?.toISOString()).toBe("2026-01-31T00:00:00.000Z")

    const payload = await res.json()
    expect(payload).toEqual({ data: [], total: 0, skip: 5, take: 20 })
  })
})
