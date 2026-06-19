import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { arqueoCajaService } from "@/lib/caja/arqueo-service"

beforeEach(() => vi.clearAllMocks())

describe("ArqueoCajaService", () => {
  it("realizarArqueo calcula diferencia por medio de pago", async () => {
    mockPrismaClient.caja.findUnique.mockResolvedValue({
      id: 1,
      movimientos: [
        { medioPago: "efectivo", monto: 5000 },
        { medioPago: "tarjeta", monto: 3000 },
        { medioPago: "efectivo", monto: 2000 },
      ],
    })
    mockPrismaClient.arqueoCaja.create.mockResolvedValue({ id: 99, estado: "con_diferencia" })
    mockPrismaClient.caja.update.mockResolvedValue({})

    const result = await arqueoCajaService.realizarArqueo(1, 1, {
      efectivoDeclarado: 8000,
      tarjetaDeclarado: 2500,
      transferenciaDeclarado: 0,
      chequeDeclarado: 0,
      qrDeclarado: 0,
    })

    expect(result.diferencia).toBe(500)
    expect(result.detalle.efectivo.sistema).toBe(7000)
    expect(result.estado).toBe("con_diferencia")
  })

  it("aprueba arqueo sin diferencia", async () => {
    mockPrismaClient.caja.findUnique.mockResolvedValue({
      id: 2,
      movimientos: [{ medioPago: "efectivo", monto: 1000 }],
    })
    mockPrismaClient.arqueoCaja.create.mockResolvedValue({ id: 1, estado: "aprobado" })
    mockPrismaClient.caja.update.mockResolvedValue({})

    const result = await arqueoCajaService.realizarArqueo(2, 1, {
      efectivoDeclarado: 1000,
      tarjetaDeclarado: 0,
      transferenciaDeclarado: 0,
      chequeDeclarado: 0,
      qrDeclarado: 0,
    })

    expect(result.diferencia).toBe(0)
    expect(mockPrismaClient.arqueoCaja.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: "aprobado" }),
      })
    )
  })
})