import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import {
  crearMovimientoNiche,
  resumenNiche,
  actualizarEstadoMovimiento,
} from "@/lib/niche/movimientos-service"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("movimientos-service", () => {
  it("crearMovimientoNiche persiste con appSku", async () => {
    mockPrismaClient.nicheMovimiento = {
      create: vi.fn().mockResolvedValue({
        id: 1,
        appSku: "niche.feria_puesto",
        titulo: "Cierre",
        estado: "pendiente",
        cliente: null,
      }),
    }

    const row = await crearMovimientoNiche(1, {
      appSku: "niche.feria_puesto",
      categoria: "cierre",
      titulo: "Cierre",
      monto: 15000,
    })

    expect(row.appSku).toBe("niche.feria_puesto")
    expect(mockPrismaClient.nicheMovimiento.create).toHaveBeenCalled()
  })

  it("resumenNiche calcula pendientes y montos", async () => {
    mockPrismaClient.nicheMovimiento = {
      findMany: vi.fn().mockResolvedValue([
        { estado: "pendiente", monto: 1000 },
        { estado: "pagado", monto: 500 },
        { estado: "listo", monto: 200 },
      ]),
    }

    const res = await resumenNiche(1, "niche.tintoreria")
    expect(res.total).toBe(3)
    expect(res.pendientes).toBe(2)
    expect(res.pagados).toBe(1)
    expect(res.montoPendiente).toBe(1200)
    expect(res.montoTotal).toBe(1700)
  })

  it("actualizarEstadoMovimiento falla si no existe", async () => {
    mockPrismaClient.nicheMovimiento = {
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    }

    await expect(actualizarEstadoMovimiento(1, 999, "pagado")).rejects.toThrow("Movimiento no encontrado")
  })
})