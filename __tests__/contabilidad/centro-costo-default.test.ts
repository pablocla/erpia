import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { resolverCentroCostoDefault, limpiarCacheCentroCostoDefault } from "@/lib/contabilidad/centro-costo-default"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    centroCosto: { findFirst: vi.fn() },
  },
}))

describe("resolverCentroCostoDefault", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    limpiarCacheCentroCostoDefault()
  })

  it("retorna null si no hay centros activos", async () => {
    vi.mocked(prisma.centroCosto.findFirst).mockResolvedValue(null)
    const id = await resolverCentroCostoDefault(1)
    expect(id).toBeNull()
  })

  it("retorna el primer centro por código", async () => {
    vi.mocked(prisma.centroCosto.findFirst).mockResolvedValue({ id: 42 } as never)
    const id = await resolverCentroCostoDefault(1)
    expect(id).toBe(42)
    expect(prisma.centroCosto.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { empresaId: 1, activo: true } }),
    )
  })

  it("usa cache en llamadas repetidas", async () => {
    vi.mocked(prisma.centroCosto.findFirst).mockResolvedValue({ id: 7 } as never)
    await resolverCentroCostoDefault(5)
    await resolverCentroCostoDefault(5)
    expect(prisma.centroCosto.findFirst).toHaveBeenCalledTimes(1)
  })
})