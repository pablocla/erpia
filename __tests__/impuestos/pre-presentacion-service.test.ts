import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { PrePresentacionService } from "@/lib/impuestos/pre-presentacion-service"

vi.mock("@/lib/impuestos/iva-service", () => ({
  IVAService: class {
    calcularIVAPeriodo = vi.fn().mockResolvedValue({
      periodo: "06/2026",
      ivaVentas: { total: 2100 },
      ivaCompras: { total: 800 },
      saldo: 1300,
    })
  },
}))

vi.mock("@/lib/impuestos/declaracion-jurada-service", () => ({
  obtenerDeclaracion: vi.fn().mockResolvedValue({
    montoTotal: 1300,
    hashContenido: "abc",
  }),
}))

const service = new PrePresentacionService()

beforeEach(() => {
  vi.clearAllMocks()
})

describe("PrePresentacionService", () => {
  it("returns listo=true when no critical failures", async () => {
    mockPrismaClient.factura.count
      .mockResolvedValueOnce(0) // sin CAE
      .mockResolvedValueOnce(5) // total facturas
    mockPrismaClient.compra.count.mockResolvedValue(3)
    mockPrismaClient.recibo.count.mockResolvedValue(2)
    mockPrismaClient.ordenPago.count.mockResolvedValue(1)
    mockPrismaClient.cheque.count.mockResolvedValue(0)
    mockPrismaClient.asientoContable.findMany.mockResolvedValue([
      {
        id: 1,
        movimientos: [
          { debe: 100, haber: 0 },
          { debe: 0, haber: 100 },
        ],
      },
    ])
    mockPrismaClient.periodoFiscal.findUnique.mockResolvedValue({ estado: "abierto" })

    const result = await service.evaluar(1, 6, 2026)

    expect(result.listo).toBe(true)
    expect(result.items.find((i) => i.id === "facturas_cae")?.ok).toBe(true)
    expect(result.items.find((i) => i.id === "liquidacion_iva")?.ok).toBe(true)
  })

  it("flags facturas sin CAE as critical", async () => {
    mockPrismaClient.factura.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(5)
    mockPrismaClient.compra.count.mockResolvedValue(0)
    mockPrismaClient.recibo.count.mockResolvedValue(0)
    mockPrismaClient.ordenPago.count.mockResolvedValue(0)
    mockPrismaClient.cheque.count.mockResolvedValue(0)
    mockPrismaClient.asientoContable.findMany.mockResolvedValue([])
    mockPrismaClient.periodoFiscal.findUnique.mockResolvedValue(null)

    const result = await service.evaluar(1, 6, 2026)

    expect(result.listo).toBe(false)
    expect(result.items.find((i) => i.id === "facturas_cae")?.ok).toBe(false)
    expect(result.resumen.criticos).toBeGreaterThan(0)
  })
})