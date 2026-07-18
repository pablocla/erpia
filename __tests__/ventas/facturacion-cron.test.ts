import { describe, it, expect, beforeEach, vi } from "vitest"
import { procesarFacturasRecurrentes } from "@/lib/ventas/facturacion-recurrente-service"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    facturaRecurrente: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    factura: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    cliente: {
      findUnique: vi.fn(),
    },
    empresa: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("@/lib/afip/solicitar-cae-factura", () => ({
  solicitarCaeFactura: vi.fn().mockResolvedValue({ ok: true, cae: "12345678901234" }),
}))

vi.mock("@/lib/events/emit-domain-event", () => ({
  emitFacturaEmitida: vi.fn().mockResolvedValue(true),
}))

vi.mock("@/lib/cc-cp/cuentas-service", () => ({
  cuentasService: {
    generarCCPorFactura: vi.fn().mockResolvedValue([999]),
  },
}))

describe("Facturación Recurrente Cron", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.cliente.findUnique).mockResolvedValue({ id: 1, condicionIva: "Consumidor Final" } as any)
    vi.mocked(prisma.empresa.findUnique).mockResolvedValue({ id: 1, puntoVenta: 1 } as any)
    vi.mocked(prisma.factura.create).mockResolvedValue({ id: 100, numero: 1, tipo: "B" } as any)
  })

  it("debe evitar duplicación si ya existe una factura en el mes", async () => {
    vi.mocked(prisma.facturaRecurrente.findMany).mockResolvedValue([
      {
        id: 1,
        clienteId: 1,
        concepto: "Servicio Mensual",
        montoNeto: 1000,
        alicuotaIva: 21,
        frecuencia: "mensual",
        tipoCbte: 6,
        proximaEmision: new Date("2023-01-01"),
        activo: true,
      },
    ] as any)

    // Simulate existing invoice in the current month
    vi.mocked(prisma.factura.findFirst).mockResolvedValue({
      id: 50,
      numero: 99,
    } as any)

    const res = await procesarFacturasRecurrentes(1)
    
    expect(res.procesadas).toBe(0)
    expect(prisma.factura.create).not.toHaveBeenCalled()
    expect(prisma.facturaRecurrente.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
      })
    )
  })

  it("debe emitir factura si no hay duplicación", async () => {
    vi.mocked(prisma.facturaRecurrente.findMany).mockResolvedValue([
      {
        id: 1,
        clienteId: 1,
        concepto: "Servicio Mensual",
        montoNeto: 1000,
        alicuotaIva: 21,
        frecuencia: "mensual",
        tipoCbte: 6,
        proximaEmision: new Date("2023-01-01"),
        activo: true,
      },
    ] as any)

    // No existing invoice
    vi.mocked(prisma.factura.findFirst).mockResolvedValue(null)

    const res = await procesarFacturasRecurrentes(1)
    
    expect(res.procesadas).toBe(1)
    expect(prisma.factura.create).toHaveBeenCalled()
  })
})
