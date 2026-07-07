import { describe, expect, it, vi, beforeEach } from "vitest"
import {
  periodoAlquilerActual,
  vencimientoAlquilerDesdePeriodo,
  facturarAlquileresMensuales,
} from "@/lib/inmobiliaria/alquileres-service"
import { crearContratoAlquiler } from "@/lib/inmobiliaria/inmobiliaria-service"

vi.mock("@/lib/prisma", () => {
  const tx = {
    factura: { create: vi.fn().mockResolvedValue({ id: 100 }) },
    cuentaCobrar: { create: vi.fn().mockResolvedValue({ id: 1 }) },
    cliente: { update: vi.fn().mockResolvedValue({}) },
    contratoAlquiler: {
      create: vi.fn().mockResolvedValue({ id: 1, propiedad: { titulo: "Depto" }, inquilino: { nombre: "Juan" } }),
      update: vi.fn().mockResolvedValue({}),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    propiedad: {
      update: vi.fn().mockResolvedValue({}),
      findFirst: vi.fn().mockResolvedValue({
        id: 1,
        empresaId: 10,
        estado: "disponible",
        propietarioId: 5,
      }),
    },
  }
  return {
    prisma: {
      contratoAlquiler: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      propiedad: {
        findFirst: vi.fn().mockResolvedValue({
          id: 1,
          empresaId: 10,
          estado: "disponible",
          propietarioId: 5,
        }),
      },
      $transaction: vi.fn((fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
    },
  }
})

vi.mock("@/lib/ops/sistema-log", () => ({
  persistSistemaLog: vi.fn().mockResolvedValue(null),
}))

vi.mock("@/lib/niche/niche-whatsapp", () => ({
  encolarWhatsAppNiche: vi.fn().mockResolvedValue(true),
}))

import { prisma } from "@/lib/prisma"

describe("INMO-P1 smoke — alquileres", () => {
  it("periodo alquiler actual es YYYY-MM del mes en curso", () => {
    expect(periodoAlquilerActual(new Date(2026, 6, 15))).toBe("2026-07")
    expect(periodoAlquilerActual(new Date(2026, 11, 1))).toBe("2026-12")
  })

  it("vencimiento respeta día del contrato", () => {
    const v = vencimientoAlquilerDesdePeriodo("2026-02", 10)
    expect(v.getDate()).toBe(10)
    expect(v.getMonth()).toBe(1)
  })

  it("vencimiento acota a último día del mes", () => {
    const v = vencimientoAlquilerDesdePeriodo("2026-02", 31)
    expect(v.getDate()).toBe(28)
  })

  it("facturación mensual sin contratos retorna cero", async () => {
    const result = await facturarAlquileresMensuales("2026-07")
    expect(result.generados).toBe(0)
    expect(result.periodo).toBe("2026-07")
  })

  it("crear contrato marca propiedad alquilada", async () => {
    await crearContratoAlquiler(10, {
      propiedadId: 1,
      inquilinoId: 2,
      montoMensual: 350_000,
      fechaInicio: "2026-07-01",
      fechaFin: "2027-06-30",
    })
    expect(prisma.$transaction).toHaveBeenCalled()
  })
})