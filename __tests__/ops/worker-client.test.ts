import { describe, it, expect, vi, beforeEach } from "vitest"
import { jobNeedsWorker, dispatchWorkerJob } from "@/lib/ops/orchestrator/worker-client"

describe("worker-client", () => {
  beforeEach(() => {
    vi.stubEnv("OPS_WORKER_WEBHOOK_URL", "")
    vi.stubEnv("OPS_WORKER_SECRET", "")
    vi.stubEnv("GITHUB_TOKEN", "")
    vi.stubEnv("GITHUB_REPO", "")
    vi.stubEnv("GITHUB_REF", "main")
  })

  it("detecta pasos pesados", () => {
    expect(jobNeedsWorker(["healthcheck"])).toBe(false)
    expect(jobNeedsWorker(["backup_pre", "healthcheck"])).toBe(true)
    expect(jobNeedsWorker(["readiness_modules"])).toBe(true)
  })

  it("returns dispatched: false if no env configured", async () => {
    const res = await dispatchWorkerJob({
      jobId: 1,
      empresaId: 42,
      entornoId: null,
      tipo: "backup_db",
      steps: ["healthcheck"],
    })
    expect(res.dispatched).toBe(false)
  })

  it("calls webhook if URL is configured", async () => {
    vi.stubEnv("OPS_WORKER_WEBHOOK_URL", "https://my-worker.internal/webhook")
    vi.stubEnv("OPS_WORKER_SECRET", "super-secret")

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("OK"),
    })
    vi.stubGlobal("fetch", mockFetch)

    const res = await dispatchWorkerJob({
      jobId: 123,
      empresaId: 42,
      entornoId: null,
      tipo: "backup_db",
      steps: ["healthcheck"],
    })

    expect(res.dispatched).toBe(true)
    expect(res.channel).toBe("webhook")
    expect(mockFetch).toHaveBeenCalledWith(
      "https://my-worker.internal/webhook",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer super-secret",
        }),
      }),
    )
  })
})