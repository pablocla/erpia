import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import {
  periodoKey,
  hashDetalle,
  persistirDeclaracion,
} from "@/lib/impuestos/declaracion-jurada-service"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("declaracion-jurada-service", () => {
  it("periodoKey formats YYYYMM", () => {
    expect(periodoKey(6, 2026)).toBe("202606")
    expect(periodoKey(12, 2025)).toBe("202512")
  })

  it("hashDetalle is deterministic", () => {
    const a = hashDetalle({ saldo: 100 })
    const b = hashDetalle({ saldo: 100 })
    const c = hashDetalle({ saldo: 101 })
    expect(a).toBe(b)
    expect(a).not.toBe(c)
    expect(a).toHaveLength(64)
  })

  it("persistirDeclaracion creates when not exists", async () => {
    mockPrismaClient.declaracionJurada.findFirst.mockResolvedValue(null)
    mockPrismaClient.declaracionJurada.create.mockResolvedValue({
      id: 1,
      hashContenido: "abc",
      montoTotal: 1500,
      montoAPagar: 1500,
      estado: "generada",
    })

    const result = await persistirDeclaracion({
      empresaId: 5,
      tipo: "IVA",
      mes: 3,
      anio: 2026,
      detalle: { saldo: 1500 },
      montoTotal: 1500,
    })

    expect(mockPrismaClient.declaracionJurada.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          empresaId: 5,
          tipo: "IVA",
          periodo: "202603",
          estado: "generada",
        }),
      }),
    )
    expect(result.id).toBe(1)
  })

  it("persistirDeclaracion updates when exists", async () => {
    mockPrismaClient.declaracionJurada.findFirst.mockResolvedValue({ id: 9 })
    mockPrismaClient.declaracionJurada.update.mockResolvedValue({
      id: 9,
      hashContenido: "def",
      montoTotal: 2000,
      montoAPagar: 2000,
      estado: "generada",
    })

    await persistirDeclaracion({
      empresaId: 5,
      tipo: "IVA",
      mes: 3,
      anio: 2026,
      detalle: { saldo: 2000 },
      montoTotal: 2000,
    })

    expect(mockPrismaClient.declaracionJurada.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 9 } }),
    )
  })
})