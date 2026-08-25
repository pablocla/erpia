import { describe, it, expect } from "vitest"
import { decideClaverCloudAccess, cloudVerifiedFingerprint } from "@/lib/auth/claver-cloud-access"

describe("decideClaverCloudAccess", () => {
  it("sin token → login", () => {
    expect(decideClaverCloudAccess({ hasToken: false })).toEqual({ action: "login" })
  })

  it("token inválido (authenticated false) → login, no denied", () => {
    expect(
      decideClaverCloudAccess({
        hasToken: true,
        httpStatus: 200,
        authenticated: false,
        isAnalyst: false,
      }),
    ).toEqual({ action: "login" })
  })

  it("401 → login", () => {
    expect(decideClaverCloudAccess({ hasToken: true, httpStatus: 401 })).toEqual({ action: "login" })
  })

  it("usuario autenticado no analista → denied", () => {
    expect(
      decideClaverCloudAccess({
        hasToken: true,
        httpStatus: 200,
        authenticated: true,
        isAnalyst: false,
        email: "cliente@empresa.com",
      }),
    ).toEqual({ action: "denied", email: "cliente@empresa.com" })
  })

  it("analista → ok", () => {
    expect(
      decideClaverCloudAccess({
        hasToken: true,
        httpStatus: 200,
        authenticated: true,
        isAnalyst: true,
        email: "ceo@claver.com",
      }),
    ).toEqual({ action: "ok" })
  })

  it("error de red o 5xx → unavailable (no borra sesión)", () => {
    expect(decideClaverCloudAccess({ hasToken: true, networkError: true })).toEqual({
      action: "unavailable",
    })
    expect(decideClaverCloudAccess({ hasToken: true, httpStatus: 503 })).toEqual({
      action: "unavailable",
    })
  })
})

describe("cloudVerifiedFingerprint", () => {
  it("ata la verificación a este JWT, no a un flag global", () => {
    const a = "header.payload.signature-aaaa"
    const b = "header.payload.signature-bbbb"
    expect(cloudVerifiedFingerprint(a)).not.toBe(cloudVerifiedFingerprint(b))
    expect(cloudVerifiedFingerprint(a)).toBe(a.slice(-24))
  })
})
