import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { purgeEmpleadoDigitalOldData } from "@/lib/empleados-digitales/purge-old-data"

describe("purgeEmpleadoDigitalOldData INF-02", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaClient.empleadoDigitalUsage = {
      deleteMany: vi.fn().mockResolvedValue({ count: 3 }),
    }
    mockPrismaClient.empleadoDigitalRun = {
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    }
    mockPrismaClient.empleadoDigitalTarea = {
      deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
    }
  })

  it("borra usage runs y tareas viejas", async () => {
    const r = await purgeEmpleadoDigitalOldData(90)
    expect(r.deletedUsage).toBe(3)
    expect(r.deletedRuns).toBe(1)
    expect(r.deletedTareas).toBe(2)
  })
})
