import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/comercial/comercial-access-service", () => ({
  canWriteSku: vi.fn(),
}))

vi.mock("@/lib/ai/ia-guard", () => ({
  isIAEnabled: vi.fn(),
}))

import { canWriteSku } from "@/lib/comercial/comercial-access-service"
import { isIAEnabled } from "@/lib/ai/ia-guard"
import { guardAiRequest } from "@/lib/ai/ai-route-guard"

const auth = { userId: 1, email: "a@test.com", rol: "admin", empresaId: 10 }

function req(url = "http://localhost/api/ai/chat") {
  return new NextRequest(url, {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.1" },
  })
}

describe("guardAiRequest", () => {
  beforeEach(() => {
    vi.mocked(isIAEnabled).mockReset()
    vi.mocked(canWriteSku).mockReset()
    process.env.AI_RATE_LIMIT_ENABLED = "false"
  })

  it("bloquea si el módulo IA está deshabilitado", async () => {
    vi.mocked(isIAEnabled).mockResolvedValue(false)
    const res = await guardAiRequest(req(), auth, "mutation")
    expect(res?.status).toBe(403)
  })

  it("bloquea sin SKU core.ia", async () => {
    vi.mocked(isIAEnabled).mockResolvedValue(true)
    vi.mocked(canWriteSku).mockResolvedValue(false)
    const res = await guardAiRequest(req(), auth, "mutation")
    expect(res?.status).toBe(402)
    const body = await res!.json()
    expect(body.code).toBe("SKU_ENTITLEMENT_DENIED")
  })

  it("permite cuando IA y SKU están OK", async () => {
    vi.mocked(isIAEnabled).mockResolvedValue(true)
    vi.mocked(canWriteSku).mockResolvedValue(true)
    const res = await guardAiRequest(req(), auth, "chat")
    expect(res).toBeNull()
  })

  it("onboarding público solo aplica rate limit cuando está habilitado", async () => {
    process.env.AI_RATE_LIMIT_ENABLED = "true"
    const blocked = await guardAiRequest(req("http://localhost/api/ai/onboarding"), null, "public", {
      skipEntitlement: true,
      skipModuleCheck: true,
      maxAttempts: 1,
      windowMs: 60_000,
    })
    expect(blocked).toBeNull()
    const second = await guardAiRequest(req("http://localhost/api/ai/onboarding"), null, "public", {
      skipEntitlement: true,
      skipModuleCheck: true,
      maxAttempts: 1,
      windowMs: 60_000,
    })
    expect(second?.status).toBe(429)
  })
})