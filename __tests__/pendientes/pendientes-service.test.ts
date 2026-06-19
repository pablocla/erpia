import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { listarPendientesPorRol } from "@/lib/pendientes/pendientes-service"

beforeEach(() => vi.clearAllMocks())

describe("listarPendientesPorRol", () => {
  it("cajero ve caja cerrada como bloqueante", async () => {
    mockPrismaClient.caja.findFirst.mockResolvedValue(null)
    mockPrismaClient.factura.count.mockResolvedValue(0)

    const result = await listarPendientesPorRol(1, "cajero")

    expect(result.some((p) => p.id === "caja-cerrada" && p.prioridad === "bloqueante")).toBe(true)
  })

  it("gerente ve aprobaciones pendientes", async () => {
    mockPrismaClient.solicitudAprobacion.count.mockResolvedValue(3)
    mockPrismaClient.caja.count.mockResolvedValue(0)
    mockPrismaClient.caja.findFirst.mockResolvedValue({ id: 1 })
    mockPrismaClient.factura.count.mockResolvedValue(0)
    mockPrismaClient.listaPicking.count.mockResolvedValue(0)
    mockPrismaClient.producto.findMany.mockResolvedValue([])
    mockPrismaClient.presupuesto.count.mockResolvedValue(0)

    const result = await listarPendientesPorRol(1, "gerente")

    expect(result.some((p) => p.id === "aprobaciones-pendientes")).toBe(true)
  })
})