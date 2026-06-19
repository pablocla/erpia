import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { membresiasService } from "@/lib/membresias/membresias-service"

beforeEach(() => vi.clearAllMocks())

describe("MembresiasService", () => {
  it("listarPlanes filtra por empresa y activo", async () => {
    mockPrismaClient.planMembresia.findMany.mockResolvedValue([
      { id: 1, nombre: "Básico", precio: 5000, _count: { membresias: 3 } },
    ])

    const planes = await membresiasService.listarPlanes(1)

    expect(planes).toHaveLength(1)
    expect(mockPrismaClient.planMembresia.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { empresaId: 1, activo: true },
      })
    )
  })

  it("crearPlan usa periodicidad mensual y 30 días por defecto", async () => {
    mockPrismaClient.planMembresia.create.mockResolvedValue({
      id: 2,
      nombre: "Premium",
      precio: 12000,
      periodicidad: "mensual",
      duracionDias: 30,
    })

    const plan = await membresiasService.crearPlan(1, {
      nombre: "Premium",
      precio: 12000,
    })

    expect(plan.periodicidad).toBe("mensual")
    expect(mockPrismaClient.planMembresia.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          empresaId: 1,
          duracionDias: 30,
        }),
      })
    )
  })

  it("listarMembresias aplica filtros de estado y cliente", async () => {
    mockPrismaClient.membresia.findMany.mockResolvedValue([])

    await membresiasService.listarMembresias(1, { estado: "activa", clienteId: 5 })

    expect(mockPrismaClient.membresia.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          estado: "activa",
          clienteId: 5,
          plan: { empresaId: 1 },
        }),
      })
    )
  })

  it("crearMembresia calcula fechaFin según duracionDias del plan", async () => {
    mockPrismaClient.planMembresia.findUnique.mockResolvedValue({
      id: 1,
      duracionDias: 30,
      nombre: "Mensual",
    })
    mockPrismaClient.membresia.create.mockResolvedValue({
      id: 10,
      estado: "activa",
      plan: { nombre: "Mensual" },
      cliente: { id: 3, nombre: "Juan" },
    })

    const membresia = await membresiasService.crearMembresia({
      planId: 1,
      clienteId: 3,
      fechaInicio: "2026-06-01",
    })

    expect(membresia.estado).toBe("activa")
    const createCall = mockPrismaClient.membresia.create.mock.calls[0][0]
    const fechaFin = createCall.data.fechaFin as Date
    const fechaInicio = createCall.data.fechaInicio as Date
    const diffDays = Math.round((fechaFin.getTime() - fechaInicio.getTime()) / 86_400_000)
    expect(diffDays).toBe(30)
  })

  it("crearMembresia lanza PLAN_NO_ENCONTRADO si el plan no existe", async () => {
    mockPrismaClient.planMembresia.findUnique.mockResolvedValue(null)

    await expect(
      membresiasService.crearMembresia({
        planId: 99,
        clienteId: 1,
        fechaInicio: "2026-06-01",
      })
    ).rejects.toThrow("PLAN_NO_ENCONTRADO")
  })

  it("renovarMembresia extiende fechaFin desde la fecha actual de fin", async () => {
    const fechaFinActual = new Date("2026-07-01")
    mockPrismaClient.membresia.findUnique.mockResolvedValue({
      id: 5,
      fechaFin: fechaFinActual,
      plan: { duracionDias: 30 },
    })
    mockPrismaClient.membresia.update.mockResolvedValue({
      id: 5,
      estado: "activa",
      fechaFin: new Date("2026-07-31"),
    })

    await membresiasService.renovarMembresia(5)

    expect(mockPrismaClient.membresia.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 5 },
        data: expect.objectContaining({ estado: "activa" }),
      })
    )
  })

  it("renovarMembresia lanza MEMBRESIA_NO_ENCONTRADA", async () => {
    mockPrismaClient.membresia.findUnique.mockResolvedValue(null)

    await expect(membresiasService.renovarMembresia(999)).rejects.toThrow(
      "MEMBRESIA_NO_ENCONTRADA"
    )
  })

  it("suspenderMembresia actualiza estado a suspendida", async () => {
    mockPrismaClient.membresia.update.mockResolvedValue({ id: 1, estado: "suspendida" })

    const result = await membresiasService.suspenderMembresia(1)

    expect(result.estado).toBe("suspendida")
    expect(mockPrismaClient.membresia.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { estado: "suspendida" },
    })
  })

  it("cancelarMembresia actualiza estado a cancelada", async () => {
    mockPrismaClient.membresia.update.mockResolvedValue({ id: 1, estado: "cancelada" })

    const result = await membresiasService.cancelarMembresia(1)

    expect(result.estado).toBe("cancelada")
  })

  it("verificarVencidas marca activas con fechaFin pasada", async () => {
    mockPrismaClient.membresia.updateMany.mockResolvedValue({ count: 4 })

    const result = await membresiasService.verificarVencidas(1)

    expect(result.count).toBe(4)
    expect(mockPrismaClient.membresia.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          plan: { empresaId: 1 },
          estado: "activa",
        }),
        data: { estado: "vencida" },
      })
    )
  })

  it("resumen agrega contadores de membresías y planes", async () => {
    mockPrismaClient.membresia.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
    mockPrismaClient.planMembresia.count.mockResolvedValue(3)

    const resumen = await membresiasService.resumen(1)

    expect(resumen).toEqual({
      activas: 10,
      vencidas: 2,
      canceladas: 1,
      totalPlanes: 3,
    })
  })
})