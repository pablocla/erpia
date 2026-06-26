import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/prisma", () => ({ prisma: mockPrismaClient }))

import {
  emitirVale,
  buscarValeActivo,
  aplicarCobroVale,
  anularVale,
  generarTextoTicketVale,
} from "@/lib/almacen-rosario/vale-dinero-service"

beforeEach(() => {
  vi.clearAllMocks()
  mockPrismaClient.valeDinero = {
    count: vi.fn().mockResolvedValue(0),
    findFirst: vi.fn(),
    create: vi.fn().mockResolvedValue({
      id: 1,
      numero: "VALE-000001",
      montoOriginal: 5000,
      saldoRestante: 5000,
      estado: "activo",
      fechaEmision: new Date("2026-06-25"),
      titularNombre: "Juan",
      fechaVencimiento: null,
    }),
    update: vi.fn().mockResolvedValue({}),
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    findMany: vi.fn().mockResolvedValue([]),
  }
  mockPrismaClient.cobroVale = { create: vi.fn().mockResolvedValue({}) }
  mockPrismaClient.cliente = { findFirst: vi.fn().mockResolvedValue({ id: 10 }) }
})

describe("vale-dinero-service", () => {
  it("emite vale con número secuencial", async () => {
    const r = await emitirVale({ empresaId: 1, monto: 5000, titularNombre: "Juan" })
    expect(r.numero).toBe("VALE-000001")
    expect(r.montoOriginal).toBe(5000)
    expect(r.estado).toBe("activo")
  })

  it("rechaza vale anulado", async () => {
    mockPrismaClient.valeDinero.findFirst.mockResolvedValue({
      id: 1,
      numero: "VALE-000001",
      saldoRestante: 1000,
      montoOriginal: 1000,
      estado: "anulado",
      titularNombre: null,
      fechaVencimiento: null,
      clienteId: null,
    })
    await expect(buscarValeActivo(1, "VALE-000001")).rejects.toThrow("Vale anulado")
  })

  it("aplica cobro parcial y deja saldo activo", async () => {
    mockPrismaClient.valeDinero.findFirst.mockResolvedValue({
      id: 1,
      numero: "VALE-000001",
      saldoRestante: 5000,
      montoOriginal: 5000,
      estado: "activo",
      titularNombre: null,
      fechaVencimiento: null,
      clienteId: null,
    })
    const r = await aplicarCobroVale({ empresaId: 1, numero: "VALE-000001", monto: 2000 })
    expect(r.cobrado).toBe(2000)
    expect(r.saldoRestante).toBe(3000)
    expect(mockPrismaClient.valeDinero.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ saldoRestante: 3000, estado: "activo" }),
      }),
    )
  })

  it("anula vale activo", async () => {
    const r = await anularVale(1, "VALE-000001")
    expect(r.ok).toBe(true)
  })

  it("genera texto de ticket", () => {
    const txt = generarTextoTicketVale({
      numero: "VALE-000001",
      montoOriginal: 5000,
      titularNombre: "María",
      fechaEmision: "25/06/2026",
    })
    expect(txt).toContain("VALE-000001")
    expect(txt).toContain("5.000")
    expect(txt).toContain("María")
  })
})