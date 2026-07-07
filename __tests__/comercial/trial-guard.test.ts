import { describe, it, expect, vi, beforeEach } from "vitest"
import { isTrialActive, isTrialExpired } from "@/lib/comercial/trial-guard"
import { prisma } from "@/lib/prisma"
import { getTrialStatus } from "@/lib/comercial/trial-service"
import { isEmpresaWriteBlocked } from "@/lib/comercial/comercial-access-service"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    empresa: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("@/lib/comercial/trial-service", () => ({
  getTrialStatus: vi.fn(),
}))

vi.mock("@/lib/comercial/comercial-access-service", () => ({
  isEmpresaWriteBlocked: vi.fn(),
}))

describe("trial-guard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return active if mpSubscriptionStatus is authorized", async () => {
    prisma.empresa.findUnique.mockResolvedValue({ mpSubscriptionStatus: "authorized" })

    const active = await isTrialActive(1)
    expect(active).toBe(true)
    expect(isEmpresaWriteBlocked).not.toHaveBeenCalled()
  })

  it("should return active if empresa is not write-blocked (ancla gratis)", async () => {
    prisma.empresa.findUnique.mockResolvedValue({ mpSubscriptionStatus: null })
    vi.mocked(isEmpresaWriteBlocked).mockResolvedValue(false)

    const active = await isTrialActive(1)
    expect(active).toBe(true)
    expect(getTrialStatus).not.toHaveBeenCalled()
  })

  it("should return active if trial is not expired when write-blocked", async () => {
    prisma.empresa.findUnique.mockResolvedValue({ mpSubscriptionStatus: null })
    vi.mocked(isEmpresaWriteBlocked).mockResolvedValue(true)
    vi.mocked(getTrialStatus).mockResolvedValue({ expirado: false } as never)

    const active = await isTrialActive(1)
    expect(active).toBe(true)
  })

  it("should return not active if write-blocked and trial expired", async () => {
    prisma.empresa.findUnique.mockResolvedValue({ mpSubscriptionStatus: null })
    vi.mocked(isEmpresaWriteBlocked).mockResolvedValue(true)
    vi.mocked(getTrialStatus).mockResolvedValue({ expirado: true } as never)

    const active = await isTrialActive(1)
    expect(active).toBe(false)
  })

  it("isTrialExpired should invert isTrialActive result", async () => {
    prisma.empresa.findUnique.mockResolvedValue({ mpSubscriptionStatus: null })
    vi.mocked(isEmpresaWriteBlocked).mockResolvedValue(true)
    vi.mocked(getTrialStatus).mockResolvedValue({ expirado: true } as never)

    const expired = await isTrialExpired(1)
    expect(expired).toBe(true)
  })
})