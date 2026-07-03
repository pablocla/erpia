import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "@/app/api/niche/[appId]/route"
import * as authGuard from "@/lib/auth/empresa-guard"
import * as entitlements from "@/lib/platform/entitlements"
import * as cuotasService from "@/lib/niche/cuotas-service"

vi.mock("@/lib/auth/empresa-guard", () => ({
  getAuthContext: vi.fn()
}))

vi.mock("@/lib/platform/entitlements", () => ({
  canUseSku: vi.fn()
}))

vi.mock("@/lib/niche/cuotas-service", () => ({
  registrarCuotaNiche: vi.fn()
}))

describe("Niche API - POST", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authGuard.getAuthContext).mockResolvedValue({
      ok: true,
      auth: { empresaId: 1, rol: "admin", usuarioId: 1 }
    } as any)
    vi.mocked(entitlements.canUseSku).mockResolvedValue({ ok: true } as any)
  })

  it("POST /api/niche/club con clienteId asocia correctamente al cliente", async () => {
    vi.mocked(cuotasService.registrarCuotaNiche).mockResolvedValue({
      id: 100,
      monto: 3990,
    } as any)

    const req = new NextRequest("http://localhost/api/niche/club", {
      method: "POST",
      body: JSON.stringify({
        action: "cuota",
        clienteId: 42,
        monto: 3990,
        titulo: "Cuota de prueba",
      })
    })

    const res = await POST(req, { params: Promise.resolve({ appId: "club" }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.id).toBe(100)
    
    expect(cuotasService.registrarCuotaNiche).toHaveBeenCalledWith(
      1,
      "niche.club_barrio",
      expect.objectContaining({
        clienteId: 42,
        monto: 3990,
        titulo: "Cuota de prueba",
      })
    )
  })
})
