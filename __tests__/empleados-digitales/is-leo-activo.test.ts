import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { isLeoActivo } from "@/lib/empleados-digitales/is-leo-activo"

describe("isLeoActivo ED-07", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaClient.empleadoDigital = {
      findFirst: vi.fn(),
    }
  })

  it("true si hay instancia trial/activo", async () => {
    mockPrismaClient.empleadoDigital.findFirst.mockResolvedValue({ id: 1 })
    expect(await isLeoActivo(7)).toBe(true)
  })

  it("false si no hay instancia", async () => {
    mockPrismaClient.empleadoDigital.findFirst.mockResolvedValue(null)
    expect(await isLeoActivo(7)).toBe(false)
  })

  it("false con empresaId inválido", async () => {
    expect(await isLeoActivo(0)).toBe(false)
    expect(mockPrismaClient.empleadoDigital.findFirst).not.toHaveBeenCalled()
  })
})
