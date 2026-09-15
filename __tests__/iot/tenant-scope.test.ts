/**
 * T0 IoT multi-tenant scope — lecturas/alertas must filter by empresaId
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { GET as getLecturas, POST as postLecturas } from "@/app/api/iot/lecturas/route"
import { GET as getAlertas, PATCH as patchAlertas } from "@/app/api/iot/alertas/route"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/auth/empresa-guard", () => ({
  getAuthContext: vi.fn(),
}))

const mockGetAuthContext = getAuthContext as unknown as ReturnType<typeof vi.fn>

const authOk = {
  ok: true as const,
  auth: { userId: 1, email: "a@test.com", rol: "dueno", empresaId: 42 },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetAuthContext.mockResolvedValue(authOk)
})

describe("GET /api/iot/lecturas tenant scope", () => {
  it("scopes findMany with dispositivo.empresaId from auth", async () => {
    vi.mocked(prisma.lecturaIoT.findMany).mockResolvedValue([])

    const res = await getLecturas(
      new NextRequest("http://test.local/api/iot/lecturas?dispositivoId=7&limit=10"),
    )
    expect(res.status).toBe(200)

    expect(prisma.lecturaIoT.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          dispositivo: { empresaId: 42 },
          dispositivoId: 7,
        }),
      }),
    )
  })

  it("rejects unauthenticated requests", async () => {
    mockGetAuthContext.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    })
    const res = await getLecturas(new NextRequest("http://test.local/api/iot/lecturas"))
    expect(res.status).toBe(401)
    expect(prisma.lecturaIoT.findMany).not.toHaveBeenCalled()
  })
})

describe("POST /api/iot/lecturas tenant scope", () => {
  it("rejects insert when dispositivo belongs to another empresa", async () => {
    vi.mocked(prisma.dispositivoIoT.findFirst).mockResolvedValue(null)

    const res = await postLecturas(
      new NextRequest("http://test.local/api/iot/lecturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dispositivoId: 99,
          valor: 1.5,
          unidad: "C",
        }),
      }),
    )
    expect(res.status).toBe(404)
    expect(prisma.dispositivoIoT.findFirst).toHaveBeenCalledWith({
      where: { id: 99, empresaId: 42 },
    })
    expect(prisma.lecturaIoT.create).not.toHaveBeenCalled()
  })
})

describe("GET /api/iot/alertas tenant scope", () => {
  it("scopes findMany with dispositivo.empresaId from auth", async () => {
    vi.mocked(prisma.alertaIoT.findMany).mockResolvedValue([])

    const res = await getAlertas(new NextRequest("http://test.local/api/iot/alertas"))
    expect(res.status).toBe(200)

    expect(prisma.alertaIoT.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          dispositivo: { empresaId: 42 },
          resuelta: false,
        }),
      }),
    )
  })
})

describe("PATCH /api/iot/alertas tenant scope", () => {
  it("rejects cross-tenant alerta id", async () => {
    vi.mocked(prisma.alertaIoT.findFirst).mockResolvedValue(null)

    const res = await patchAlertas(
      new NextRequest("http://test.local/api/iot/alertas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: 555 }),
      }),
    )
    expect(res.status).toBe(404)
    expect(prisma.alertaIoT.findFirst).toHaveBeenCalledWith({
      where: { id: 555, dispositivo: { empresaId: 42 } },
      select: { id: true },
    })
    expect(prisma.alertaIoT.update).not.toHaveBeenCalled()
  })

  it("updates when alerta belongs to caller's empresa", async () => {
    vi.mocked(prisma.alertaIoT.findFirst).mockResolvedValue({ id: 10 } as never)
    vi.mocked(prisma.alertaIoT.update).mockResolvedValue({
      id: 10,
      resuelta: true,
    } as never)

    const res = await patchAlertas(
      new NextRequest("http://test.local/api/iot/alertas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: 10 }),
      }),
    )
    expect(res.status).toBe(200)
    expect(prisma.alertaIoT.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10 },
        data: expect.objectContaining({ resuelta: true }),
      }),
    )
  })
})