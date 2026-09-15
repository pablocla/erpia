/**
 * T0 public Works leads — rate limit on POST /api/public/works/leads
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { POST } from "@/app/api/public/works/leads/route"
import { checkRateLimit } from "@/lib/auth/rate-limiter"
import { createWorksLead } from "@/lib/works/works-service"

vi.mock("@/lib/auth/rate-limiter", () => ({
  checkRateLimit: vi.fn(),
}))

vi.mock("@/lib/works/works-service", () => ({
  createWorksLead: vi.fn(),
}))

const mockCheckRateLimit = checkRateLimit as unknown as ReturnType<typeof vi.fn>
const mockCreateWorksLead = createWorksLead as unknown as ReturnType<typeof vi.fn>

function postLead(body: Record<string, unknown> = {}) {
  return POST(
    new NextRequest("http://test.local/api/public/works/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.50",
      },
      body: JSON.stringify({
        segmento: "energy",
        nombre: "Test Lead",
        email: "lead@example.com",
        telefono: "+5491112345678",
        zona: "CABA",
        ...body,
      }),
    }),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCheckRateLimit.mockReturnValue(null)
  mockCreateWorksLead.mockResolvedValue({
    lead: { id: 101 },
    project: {
      id: 202,
      status: "nuevo",
      presupuestoSoftUrl: null,
    },
  })
})

describe("POST /api/public/works/leads rate limit", () => {
  it("allows request when rate limit permits and creates lead", async () => {
    const res = await postLead()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.leadId).toBe(101)

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.any(NextRequest),
      "works-leads",
      5,
      15 * 60 * 1000,
    )
    expect(mockCreateWorksLead).toHaveBeenCalled()
  })

  it("returns 429 when rate limit exceeded and skips createWorksLead", async () => {
    mockCheckRateLimit.mockReturnValue(
      NextResponse.json(
        { error: "Demasiados intentos. Intente nuevamente más tarde." },
        { status: 429, headers: { "Retry-After": "900" } },
      ),
    )

    const res = await postLead()
    expect(res.status).toBe(429)
    const json = await res.json()
    expect(json.error).toMatch(/Demasiados intentos/i)
    expect(mockCreateWorksLead).not.toHaveBeenCalled()
  })
})