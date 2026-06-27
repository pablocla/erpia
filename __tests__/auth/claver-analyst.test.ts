import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { NextRequest } from "next/server"
import { CLAVER_OWNER_EMAIL, DEMO_ADMIN_EMAIL } from "@/lib/brand"

describe("Claver analyst guard", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv, NODE_ENV: "test" }
    delete process.env.CLAVER_ANALYST_EMAILS
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("allows configured analyst emails", async () => {
    process.env.CLAVER_ANALYST_EMAILS = "analista@claver.com, soporte@claver.com"
    const { isClaverAnalyst } = await import("@/lib/auth/claver-analyst")

    expect(isClaverAnalyst("analista@claver.com")).toBe(true)
    expect(isClaverAnalyst("SOPORTE@CLAVER.COM")).toBe(true)
    expect(isClaverAnalyst("cliente@empresa.com")).toBe(false)
  })

  it("allows analista_claver role regardless of email", async () => {
    const { isClaverAnalyst } = await import("@/lib/auth/claver-analyst")
    expect(isClaverAnalyst("cualquiera@test.com", "analista_claver")).toBe(true)
  })

  it("falls back to owner email when CLAVER_ANALYST_EMAILS is empty (incl. production)", async () => {
    process.env.NODE_ENV = "production"
    const { isClaverAnalyst } = await import("@/lib/auth/claver-analyst")
    expect(isClaverAnalyst(CLAVER_OWNER_EMAIL)).toBe(true)
    expect(isClaverAnalyst(DEMO_ADMIN_EMAIL)).toBe(false)
    expect(isClaverAnalyst("otro@test.com")).toBe(false)
  })

  it("scopes analyst to assigned empresas when assignments exist", async () => {
    vi.doMock("@/lib/prisma", () => ({
      prisma: {
        analistaAsignacion: {
          findMany: vi.fn().mockResolvedValue([{ empresaId: 5 }, { empresaId: 9 }]),
        },
      },
    }))

    const { getAnalystEmpresaScope, canAnalystAccessEmpresa } = await import("@/lib/auth/claver-analyst")
    const scope = await getAnalystEmpresaScope("analista@claver.com")
    expect(scope).toEqual({ mode: "assigned", empresaIds: [5, 9] })
    expect(await canAnalystAccessEmpresa("analista@claver.com", 5)).toBe(true)
    expect(await canAnalystAccessEmpresa("analista@claver.com", 1)).toBe(false)
  })

  it("rejects non-analyst in getClaverAnalystContext", async () => {
    vi.doMock("@/lib/auth/empresa-guard", () => ({
      getAuthContext: vi.fn().mockResolvedValue({
        ok: true,
        auth: { userId: 1, email: "cliente@empresa.com", rol: "gerente", empresaId: 1 },
      }),
    }))

    process.env.CLAVER_ANALYST_EMAILS = "analista@claver.com"
    const { getClaverAnalystContext } = await import("@/lib/auth/claver-analyst")
    const request = new NextRequest("http://localhost/api/claver/reportes")
    const result = await getClaverAnalystContext(request)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(403)
    }
  })
})