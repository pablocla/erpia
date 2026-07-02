import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { cannabisService } from "@/lib/agro/cannabis-service"

beforeEach(() => vi.clearAllMocks())

describe("cannabisService", () => {
  it("crearCiclo genera número correlativo", async () => {
    mockPrismaClient.agroCannabisCiclo.findFirst.mockResolvedValue({ numero: "CIC-2026-0003" })
    mockPrismaClient.agroCannabisCiclo.create.mockResolvedValue({
      id: 1,
      numero: "CIC-2026-0004",
      etapa: "GERMINACION",
      plantasActuales: 50,
    })

    const ciclo = await cannabisService.crearCiclo(1, {
      salaId: 1,
      geneticaId: 2,
      plantasIniciales: 50,
    })

    expect(mockPrismaClient.agroCannabisCiclo.create).toHaveBeenCalled()
    expect(ciclo.numero).toBe("CIC-2026-0004")
  })

  it("registrarAplicacion descuenta stock y suma costo", async () => {
    mockPrismaClient.$transaction.mockImplementation(async (fn: (tx: typeof mockPrismaClient) => unknown) => fn(mockPrismaClient))
    mockPrismaClient.agroCannabisInsumo.findFirst.mockResolvedValue({
      id: 5,
      nombre: "Grow A",
      stockActual: 10,
      costoUnitario: 100,
      unidad: "L",
    })
    mockPrismaClient.agroCannabisAplicacion.create.mockResolvedValue({
      id: 1,
      costoTotal: 200,
    })

    await cannabisService.registrarAplicacion(1, {
      cicloId: 1,
      insumoId: 5,
      cantidad: 2,
    })

    expect(mockPrismaClient.agroCannabisInsumo.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { stockActual: { decrement: 2 } } })
    )
    expect(mockPrismaClient.agroCannabisCiclo.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { costoAcumulado: { increment: 200 } } })
    )
  })

  it("registrarAplicacion rechaza stock insuficiente", async () => {
    mockPrismaClient.$transaction.mockImplementation(async (fn: (tx: typeof mockPrismaClient) => unknown) => fn(mockPrismaClient))
    mockPrismaClient.agroCannabisInsumo.findFirst.mockResolvedValue({
      id: 5,
      nombre: "Grow A",
      stockActual: 1,
      costoUnitario: 100,
      unidad: "L",
    })

    await expect(
      cannabisService.registrarAplicacion(1, { cicloId: 1, insumoId: 5, cantidad: 5 })
    ).rejects.toThrow(/Stock insuficiente/)
  })
})