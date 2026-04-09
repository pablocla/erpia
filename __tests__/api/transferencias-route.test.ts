/**
 * API /banco/transferencias — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { POST } from "@/app/api/banco/transferencias/route"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { transferenciasService } from "@/lib/banco/transferencias-service"

vi.mock("@/lib/auth/empresa-guard", () => ({
  getAuthContext: vi.fn(),
}))

vi.mock("@/lib/banco/transferencias-service", () => ({
  transferenciasService: {
    transferir: vi.fn(),
  },
}))

const mockGetAuthContext = getAuthContext as unknown as ReturnType<typeof vi.fn>
const mockTransferir = transferenciasService.transferir as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe("POST /api/banco/transferencias", () => {
  it("should return auth response when not authorized", async () => {
    mockGetAuthContext.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    })

    const req = new NextRequest("http://test.local/api/banco/transferencias", { method: "POST" })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("should reject invalid payload", async () => {
    mockGetAuthContext.mockResolvedValue({ ok: true, auth: { empresaId: 2 } })

    const req = new NextRequest("http://test.local/api/banco/transferencias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cuentaOrigenId: 1 }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(mockTransferir).not.toHaveBeenCalled()
  })

  it("should call transferenciasService with parsed payload", async () => {
    mockGetAuthContext.mockResolvedValue({ ok: true, auth: { empresaId: 2 } })
    mockTransferir.mockResolvedValue({ referencia: "TRF-1" })

    const req = new NextRequest("http://test.local/api/banco/transferencias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cuentaOrigenId: 10,
        cuentaDestinoId: 20,
        importe: 1500,
        fecha: "2026-03-10",
        descripcion: "Transferencia",
        referencia: "REF-01",
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)

    const call = mockTransferir.mock.calls[0][0]
    expect(call).toMatchObject({
      empresaId: 2,
      cuentaOrigenId: 10,
      cuentaDestinoId: 20,
      importe: 1500,
      descripcion: "Transferencia",
      referencia: "REF-01",
    })
    expect(call.fecha?.toISOString()).toBe("2026-03-10T00:00:00.000Z")
  })
})
