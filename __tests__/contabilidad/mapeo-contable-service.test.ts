import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { mapeoContableService } from "@/lib/contabilidad/mapeo-contable-service"

beforeEach(() => {
  vi.clearAllMocks()
  mockPrismaClient.configAsientoCuenta.findFirst.mockResolvedValue(null)
  mockPrismaClient.configAsientoCuenta.findMany.mockResolvedValue([])
})

describe("MapeoContableService", () => {
  it("debe resolver la cuenta de Caja para venta al contado por defecto", async () => {
    const cuenta = await mapeoContableService.resolverCuenta({
      empresaId: 1,
      tipoTransaccion: "venta",
      campo: "cobro",
      condicionPago: "Contado Efectivo",
      fallbackCodigo: "1.1",
      fallbackNombre: "Caja",
    })

    expect(cuenta).toBe("1.1 Caja Central")
  })

  it("debe resolver la cuenta de Deudores por Ventas para venta a crédito", async () => {
    const cuenta = await mapeoContableService.resolverCuenta({
      empresaId: 1,
      tipoTransaccion: "venta",
      campo: "cobro",
      condicionPago: "Cuenta Corriente 30 días",
      fallbackCodigo: "1.1",
      fallbackNombre: "Caja",
    })

    expect(cuenta).toBe("1.1.2 Deudores por Ventas")
  })

  it("debe resolver Percepciones Sufridas para compras con percepciones", async () => {
    const cuenta = await mapeoContableService.resolverCuenta({
      empresaId: 1,
      tipoTransaccion: "compra",
      campo: "percepciones",
      fallbackCodigo: "1.1.7",
      fallbackNombre: "Percepciones Sufridas",
    })

    expect(cuenta).toBe("1.1.7 Percepciones Sufridas IIBB/IVA")
  })

  it("debe resolver Cheques en Cartera cuando el cobro es con cheque", async () => {
    const cuenta = await mapeoContableService.resolverCuenta({
      empresaId: 1,
      tipoTransaccion: "cobro",
      campo: "medio",
      medioPago: "cheque",
      fallbackCodigo: "1.1.5",
      fallbackNombre: "Cheques en Cartera",
    })

    expect(cuenta).toBe("1.1.5 Cheques en Cartera")
  })
})
