import { describe, it, expect, beforeEach, vi } from "vitest"
import { cobrosService } from "@/lib/cobros/cobros-service"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cuentaCobrar: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
    cliente: {
      findFirst: vi.fn(),
    },
  },
}))

describe("Cobro Unificado FIFO", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(cobrosService, "registrarCobro").mockResolvedValue({
      reciboId: 1,
      reciboNumero: "REC-000001",
      montoTotal: 1000,
      totalRetenciones: 0,
      netoRecibido: 1000,
    } as any)
  })

  it("debe distribuir el monto FIFO entre varias cuentas", async () => {
    vi.mocked(prisma.cuentaCobrar.findMany).mockResolvedValue([
      { id: 1, saldo: 400, fechaVencimiento: new Date("2023-01-01") },
      { id: 2, saldo: 600, fechaVencimiento: new Date("2023-02-01") },
      { id: 3, saldo: 500, fechaVencimiento: new Date("2023-03-01") },
    ] as any)

    await cobrosService.aplicarCobroCliente({
      empresaId: 1,
      clienteId: 1,
      montoTotal: 800,
      medioPago: "efectivo",
    })

    expect(cobrosService.registrarCobro).toHaveBeenCalledWith(
      expect.objectContaining({
        empresaId: 1,
        clienteId: 1,
        items: [
          { cuentaCobrarId: 1, monto: 400 },
          { cuentaCobrarId: 2, monto: 400 },
        ],
        medioPago: "efectivo",
      })
    )
  })

  it("debe arrojar error si el cliente no tiene cuentas", async () => {
    vi.mocked(prisma.cuentaCobrar.findMany).mockResolvedValue([])

    await expect(
      cobrosService.aplicarCobroCliente({
        empresaId: 1,
        clienteId: 1,
        montoTotal: 100,
        medioPago: "efectivo",
      })
    ).rejects.toThrow("El cliente no tiene cuentas por cobrar pendientes")
  })

  it("debe arrojar error si el monto excede la deuda", async () => {
    vi.mocked(prisma.cuentaCobrar.findMany).mockResolvedValue([
      { id: 1, saldo: 100, fechaVencimiento: new Date("2023-01-01") },
    ] as any)

    await expect(
      cobrosService.aplicarCobroCliente({
        empresaId: 1,
        clienteId: 1,
        montoTotal: 200,
        medioPago: "efectivo",
      })
    ).rejects.toThrow("El monto excede la deuda total pendiente")
  })
})
