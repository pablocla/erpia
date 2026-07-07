import { describe, it, expect, vi, beforeEach } from "vitest"
import { LiquidacionImpuestoService } from "@/lib/impuestos/liquidacion-impuesto-service"
import { prisma } from "@/lib/prisma"

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    liquidacionImpuesto: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe("LiquidacionImpuestoService", () => {
  let svc: LiquidacionImpuestoService

  beforeEach(() => {
    svc = new LiquidacionImpuestoService()
    vi.clearAllMocks()
  })

  it("debe crear una nueva liquidación exitosamente", async () => {
    // Arrange
    const totales = { aPagar: 1000, creditos: 200 }
    vi.mocked(prisma.liquidacionImpuesto.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.liquidacionImpuesto.create).mockResolvedValue({
      id: 1,
      empresaId: 1,
      tipo: "iva",
      periodo: "2026-06",
      totales,
      hash: "mock-hash",
      fechaGeneracion: new Date()
    } as any)

    // Act
    const res = await svc.guardarLiquidacion(1, "iva", "2026-06", totales)

    // Assert
    expect(prisma.liquidacionImpuesto.findFirst).toHaveBeenCalledWith({
      where: { empresaId: 1, tipo: "iva", periodo: "2026-06" }
    })
    expect(prisma.liquidacionImpuesto.create).toHaveBeenCalled()
    expect(res.id).toBe(1)
  })

  it("debe arrojar error si la liquidación ya existe", async () => {
    // Arrange
    vi.mocked(prisma.liquidacionImpuesto.findFirst).mockResolvedValue({ id: 1 } as any)

    // Act & Assert
    await expect(svc.guardarLiquidacion(1, "iva", "2026-06", {}))
      .rejects.toThrow("Ya existe una liquidación de IVA para el período 2026-06.")
  })
})
