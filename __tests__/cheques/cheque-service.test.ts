import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { chequeService, TRANSICIONES_CHEQUE } from "@/lib/cheques/cheque-service"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("ChequeService", () => {
  it("validarTransicion permite cartera → depositado", () => {
    expect(chequeService.validarTransicion("cartera", "depositado")).toBe(true)
    expect(chequeService.validarTransicion("cartera", "rechazado")).toBe(false)
  })

  it("TRANSICIONES_CHEQUE define rechazado desde depositado", () => {
    expect(TRANSICIONES_CHEQUE.depositado).toContain("rechazado")
  })

  it("crearDesdeCobro vincula recibo y cliente", async () => {
    mockPrismaClient.cheque.create.mockResolvedValue({ id: 1, numero: "123", monto: 5000 })

    await chequeService.crearDesdeCobro(mockPrismaClient as any, {
      reciboId: 10,
      clienteId: 7,
      montoDefault: 5000,
      cheque: {
        numero: "12345678",
        fechaEmision: "2026-06-01",
        fechaVencimiento: "2026-07-01",
        bancoNombre: "Galicia",
      },
    })

    expect(mockPrismaClient.cheque.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reciboId: 10,
          clienteId: 7,
          tipoCheque: "tercero",
          estado: "cartera",
          numero: "12345678",
        }),
      })
    )
  })
})