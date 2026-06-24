import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/prisma", () => ({
  prisma: new Proxy(
    {},
    {
      get(_target, prop) {
        return (mockPrismaClient as Record<string, unknown>)[prop as string]
      },
    },
  ),
}))

import { esperarOpsJob } from "@/lib/ops/job-wait"

describe("esperarOpsJob", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("resuelve cuando el job termina en completado", async () => {
    mockPrismaClient.opsJob.findUnique
      .mockResolvedValueOnce({ id: 1, estado: "en_progreso", errorMsg: null })
      .mockResolvedValueOnce({ id: 1, estado: "completado", errorMsg: null })

    const result = await esperarOpsJob(1, 5_000, 10)
    expect(result.estado).toBe("completado")
  })

  it("lanza timeout si el job no termina", async () => {
    mockPrismaClient.opsJob.findUnique.mockResolvedValue({ id: 1, estado: "en_progreso", errorMsg: null })
    await expect(esperarOpsJob(1, 50, 10)).rejects.toThrow(/Timeout/)
  })
})