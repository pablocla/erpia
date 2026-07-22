import { describe, it, expect, afterEach, vi } from "vitest"
import { getEncodedJwtSecret, getJwtSecretRaw, hasJwtSecretConfigured } from "@/lib/auth/jwt-secret"

describe("jwt-secret", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    delete process.env.JWT_SECRET
  })

  it("production sin JWT_SECRET lanza", () => {
    vi.stubEnv("NODE_ENV", "production")
    delete process.env.JWT_SECRET
    expect(() => getEncodedJwtSecret()).toThrow(/JWT_SECRET/)
    expect(getJwtSecretRaw()).toBeNull()
  })

  it("dev sin JWT_SECRET usa fallback", () => {
    vi.stubEnv("NODE_ENV", "development")
    delete process.env.JWT_SECRET
    const raw = getJwtSecretRaw()
    expect(raw).toContain("dev-pos-system")
    expect(getEncodedJwtSecret()).toBeInstanceOf(Uint8Array)
    expect(hasJwtSecretConfigured()).toBe(true)
  })

  it("usa JWT_SECRET del env", () => {
    process.env.JWT_SECRET = "my-real-secret-32chars-minimum-ok"
    expect(getJwtSecretRaw()).toBe("my-real-secret-32chars-minimum-ok")
  })
})
