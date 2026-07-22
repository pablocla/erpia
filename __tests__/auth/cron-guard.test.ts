import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { NextRequest } from "next/server"
import { authorizeCronRequest } from "@/lib/auth/cron-guard"

function req(url: string, headers?: Record<string, string>) {
  return new NextRequest(url, { headers })
}

describe("authorizeCronRequest", () => {
  const prevNode = process.env.NODE_ENV
  const prevSecret = process.env.CRON_SECRET

  afterEach(() => {
    process.env.NODE_ENV = prevNode
    if (prevSecret === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = prevSecret
    vi.unstubAllEnvs()
  })

  it("production: rechaza query secret aunque coincida", () => {
    vi.stubEnv("NODE_ENV", "production")
    process.env.CRON_SECRET = "super-secret-cron"
    const r = req("http://localhost/api/cron/trial-dunning?secret=super-secret-cron")
    expect(authorizeCronRequest(r)).toBe(false)
  })

  it("production: acepta Bearer correcto", () => {
    vi.stubEnv("NODE_ENV", "production")
    process.env.CRON_SECRET = "super-secret-cron"
    const r = req("http://localhost/api/cron/trial-dunning", {
      authorization: "Bearer super-secret-cron",
    })
    expect(authorizeCronRequest(r)).toBe(true)
  })

  it("production: sin CRON_SECRET rechaza", () => {
    vi.stubEnv("NODE_ENV", "production")
    delete process.env.CRON_SECRET
    const r = req("http://localhost/api/cron/trial-dunning", {
      authorization: "Bearer anything",
    })
    expect(authorizeCronRequest(r)).toBe(false)
  })

  it("dev: permite query secret", () => {
    vi.stubEnv("NODE_ENV", "development")
    process.env.CRON_SECRET = "dev-secret"
    const r = req("http://localhost/api/cron/x?secret=dev-secret")
    expect(authorizeCronRequest(r)).toBe(true)
  })

  it("dev sin secret: permite", () => {
    vi.stubEnv("NODE_ENV", "development")
    delete process.env.CRON_SECRET
    const r = req("http://localhost/api/cron/x")
    expect(authorizeCronRequest(r)).toBe(true)
  })
})
