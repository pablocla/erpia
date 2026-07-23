import { describe, it, expect } from "vitest"
import {
  assertToolScope,
  EmpleadoSecurityError,
  loadTareaScoped,
} from "@/lib/empleados-digitales/security"
import { mockPrismaClient } from "../setup"
import { vi, beforeEach } from "vitest"

describe("empleados-digitales multi-tenant ED-12", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaClient.empleadoDigitalTarea = {
      findFirst: vi.fn(),
    }
  })

  it("assertToolScope lanza si empresaId no coincide", () => {
    expect(() =>
      assertToolScope({ empresaId: 1 }, 2, "test"),
    ).toThrow(EmpleadoSecurityError)
  })

  it("assertToolScope ok mismo tenant", () => {
    expect(() => assertToolScope({ empresaId: 5 }, 5, "test")).not.toThrow()
  })

  it("loadTareaScoped no devuelve tarea de otra empresa", async () => {
    mockPrismaClient.empleadoDigitalTarea.findFirst.mockResolvedValue(null)
    await expect(loadTareaScoped(1, 99)).rejects.toThrow(/no encontrada/i)
    expect(mockPrismaClient.empleadoDigitalTarea.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ empresaId: 1 }),
      }),
    )
  })
})
