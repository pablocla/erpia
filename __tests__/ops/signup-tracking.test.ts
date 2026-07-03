import { describe, expect, it, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/comercial/trial-service", () => ({
  getTrialStatus: vi.fn().mockResolvedValue({
    activo: true,
    diasRestantes: 10,
    trialDias: 14,
    expirado: false,
    expiresAt: new Date().toISOString(),
  }),
  setTrialExpiresAt: vi.fn().mockResolvedValue(undefined),
}))

import {
  setSignupOrigen,
  getSignupMeta,
  ensureWebSignupTrial,
  inferSignupOrigen,
} from "@/lib/ops/signup-tracking"
import { setTrialExpiresAt } from "@/lib/comercial/trial-service"

beforeEach(() => {
  vi.clearAllMocks()
  mockPrismaClient.parametroFiscal = {
    upsert: vi.fn().mockResolvedValue({}),
    findUnique: vi.fn().mockResolvedValue(null),
  }
})

describe("signup-tracking", () => {
  it("persiste origen web_register", async () => {
    await setSignupOrigen(1, "web_register", "email:test@claver.com")
    expect(mockPrismaClient.parametroFiscal.upsert).toHaveBeenCalled()
  })

  it("ensureWebSignupTrial setea trial si no existe", async () => {
    const { getTrialStatus } = await import("@/lib/comercial/trial-service")
    vi.mocked(getTrialStatus).mockResolvedValueOnce(null)
    await ensureWebSignupTrial(1, 14)
    expect(setTrialExpiresAt).toHaveBeenCalled()
  })

  it("getSignupMeta infiere web_register por CUIT DEMO-", async () => {
    mockPrismaClient.empresa = {
      findUnique: vi.fn().mockResolvedValue({ cuit: "DEMO-1712345678" }),
    }
    const meta = await getSignupMeta(1)
    expect(meta.origen).toBe("web_register")
  })

  it("inferSignupOrigen detecta demo compartida y rubro", () => {
    expect(inferSignupOrigen("20-00000000-0", null)).toBe("industry_demo")
    expect(inferSignupOrigen("30-12345678-9", "almacen")).toBe("industry_demo")
    expect(inferSignupOrigen("DEMO-123", null)).toBe("web_register")
    expect(inferSignupOrigen("30-12345678-9", null)).toBeNull()
  })
})