/**
 * TransferenciasService — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { TransferenciasService } from "@/lib/banco/transferencias-service"

const service = new TransferenciasService()

beforeEach(() => {
  vi.clearAllMocks()
})

describe("TransferenciasService", () => {
  it("should create paired bank movements", async () => {
    mockPrismaClient.cuentaBancaria.findMany.mockResolvedValue([
      { id: 1, alias: "Caja", cbu: null, empresaId: 10 },
      { id: 2, alias: "Banco", cbu: null, empresaId: 10 },
    ])
    mockPrismaClient.movimientoBancario.create
      .mockResolvedValueOnce({ id: 100 })
      .mockResolvedValueOnce({ id: 101 })

    const result = await service.transferir({
      empresaId: 10,
      cuentaOrigenId: 1,
      cuentaDestinoId: 2,
      importe: 500,
    })

    expect(mockPrismaClient.movimientoBancario.create).toHaveBeenCalledTimes(2)
    expect(result).toMatchObject({ debitoId: 100, creditoId: 101, importe: 500 })
  })

  it("should reject same origin and destination", async () => {
    await expect(
      service.transferir({
        empresaId: 10,
        cuentaOrigenId: 1,
        cuentaDestinoId: 1,
        importe: 100,
      })
    ).rejects.toThrow("origen y destino no pueden ser iguales")
  })

  it("should reject accounts outside empresa", async () => {
    mockPrismaClient.cuentaBancaria.findMany.mockResolvedValue([
      { id: 1, alias: "Caja", cbu: null, empresaId: 10 },
      { id: 2, alias: "Banco", cbu: null, empresaId: 99 },
    ])

    await expect(
      service.transferir({
        empresaId: 10,
        cuentaOrigenId: 1,
        cuentaDestinoId: 2,
        importe: 100,
      })
    ).rejects.toThrow("fuera de la empresa")
  })
})
