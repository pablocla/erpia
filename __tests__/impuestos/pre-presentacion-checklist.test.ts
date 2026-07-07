import { describe, it, expect, vi, beforeEach } from "vitest"
import { PrePresentacionService } from "@/lib/impuestos/pre-presentacion-service"
import { prisma } from "@/lib/prisma"

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    factura: { count: vi.fn() },
    compra: { count: vi.fn() },
    recibo: { count: vi.fn() },
    ordenPago: { count: vi.fn() },
    cheque: { count: vi.fn() },
    asientoContable: { findMany: vi.fn() },
    periodoFiscal: { findUnique: vi.fn() },
    liquidacionImpuesto: { findFirst: vi.fn() },
  },
}))

vi.mock("@/lib/impuestos/declaracion-jurada-service", () => ({
  obtenerDeclaracion: vi.fn().mockResolvedValue(null)
}))

vi.mock("@/lib/impuestos/iva-service", () => ({
  IVAService: class {
    calcularIVAPeriodo() { return Promise.resolve({ saldo: 1000 }) }
  }
}))

describe("PrePresentacionService - Checklist B0", () => {
  let svc: PrePresentacionService

  beforeEach(() => {
    svc = new PrePresentacionService()
    vi.clearAllMocks()
  })

  it("debe incluir los 12 items en el checklist y evaluar verde/rojo", async () => {
    // Arrange mocks to return perfectly clean data (all verde)
    vi.mocked(prisma.factura.count).mockResolvedValue(0)
    vi.mocked(prisma.compra.count).mockResolvedValue(10)
    vi.mocked(prisma.recibo.count).mockResolvedValue(5)
    vi.mocked(prisma.ordenPago.count).mockResolvedValue(5)
    vi.mocked(prisma.cheque.count).mockResolvedValue(0)
    vi.mocked(prisma.asientoContable.findMany).mockResolvedValue([])
    vi.mocked(prisma.periodoFiscal.findUnique).mockResolvedValue({ estado: "abierto" } as any)
    
    // Mock LiquidacionImpuesto
    vi.mocked(prisma.liquidacionImpuesto.findFirst).mockImplementation(async (query: any) => {
      if (query.where.tipo === "iva") {
        return { totales: { saldo: 1000 } } as any // cuadra con IVAService
      }
      if (query.where.tipo === "sicore") {
        return { totales: { aPagar: 500 } } as any
      }
      return null
    })

    // Act
    const res = await svc.evaluar(1, 6, 2026)

    // Assert
    expect(res.items.length).toBe(12) // Todos los 12 ítems del roadmap B0
    const criticos = res.items.filter(i => i.severidad === "critico" && !i.ok)
    expect(criticos.length).toBe(0) // Ningún rojo
    
    // Verificar que los ítems del roadmap están presentes
    expect(res.items.some(i => i.id === "liquidacion_iva")).toBe(true)
    expect(res.items.some(i => i.id === "retenciones_sicore")).toBe(true)
    expect(res.items.some(i => i.id === "percepciones_padron")).toBe(true)
    expect(res.items.some(i => i.id === "stock_valorizado")).toBe(true)
    expect(res.items.some(i => i.id === "depreciacion_activos")).toBe(true)
  })
})
