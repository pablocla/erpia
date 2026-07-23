import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/inflacion/reexpresar", () => ({
  reexpresarMonto: vi.fn(() => ({
    factor: 1.1,
    montoOriginal: 100,
    montoAjustado: 110,
    perdidaPoderAdquisitivo: 10,
    periodoOrigen: "2026-01",
    periodoValuacion: "2026-02",
    ipcOrigen: 100,
    ipcValuacion: 110,
    indiceCodigo: "IPC_NACIONAL",
    estimado: false,
  })),
}))

import { reexpresarPreciosProductos } from "@/lib/inflacion/reexpresar-precios"

describe("reexpresarPreciosProductos", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaClient.producto = {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 1,
          codigo: "A1",
          nombre: "Gaseosa",
          precioVenta: 1000,
          precioCompra: 600,
        },
        {
          id: 2,
          codigo: "B2",
          nombre: "Agua",
          precioVenta: 500,
          precioCompra: 200,
        },
      ]),
      update: vi.fn().mockResolvedValue({}),
    }
    mockPrismaClient.$transaction = vi.fn(async (ops: unknown) => {
      if (Array.isArray(ops)) return Promise.all(ops)
      return ops
    })
  })

  it("preview dryRun no escribe en DB", async () => {
    const r = await reexpresarPreciosProductos({
      empresaId: 1,
      modo: "porcentaje",
      porcentaje: 10,
      dryRun: true,
      decimales: 0,
    })

    expect(r.afectados).toBe(2)
    expect(r.factor).toBeCloseTo(1.1)
    expect(r.productos[0].precioVentaNuevo).toBe(1100)
    expect(mockPrismaClient.$transaction).not.toHaveBeenCalled()
  })

  it("aplica actualizaciones cuando dryRun=false", async () => {
    const r = await reexpresarPreciosProductos({
      empresaId: 1,
      modo: "porcentaje",
      porcentaje: 10,
      dryRun: false,
      decimales: 0,
    })

    expect(r.dryRun).toBe(false)
    expect(mockPrismaClient.$transaction).toHaveBeenCalled()
  })
})
