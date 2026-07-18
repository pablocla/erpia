import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/platform/entitlements", () => ({
  canUseSku: vi.fn().mockResolvedValue({ ok: true, sku: "pos.fiado_barrio" }),
}))

vi.mock("@/lib/ops/sistema-log", () => ({
  persistSistemaLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/fiado/fiado-pago-link", () => ({
  resolverLinkPagoFiado: vi.fn().mockResolvedValue(null),
}))

vi.mock("@/lib/fiado/fiado-whatsapp", () => ({
  encolarWhatsAppFiado: vi.fn().mockResolvedValue(false),
}))

vi.mock("@/lib/email/email-service", () => ({
  emailService: { enviar: vi.fn().mockResolvedValue({ ok: true }) },
}))

import { anotarFiadoLibreta, cobrarFiadoLibreta, deudaCliente } from "@/lib/fiado/fiado-service"

describe("fiado libreta ops", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("deudaCliente interpreta saldo negativo", () => {
    expect(deudaCliente(-1500)).toBe(1500)
    expect(deudaCliente(0)).toBe(0)
    expect(deudaCliente(100)).toBe(0)
  })

  it("anotarFiadoLibreta crea CC y sube deuda", async () => {
    mockPrismaClient.cliente.findFirst.mockResolvedValue({
      fiadoHabilitado: true,
      limiteCredito: 50000,
      saldoCuentaCorriente: 0,
      nombre: "Juan",
    })
    mockPrismaClient.empresa.findUnique.mockResolvedValue({ fiadoRequiereLimite: true })

    let saldoTx = 0
    mockPrismaClient.$transaction.mockImplementation(async (fn: (tx: typeof mockPrismaClient) => unknown) => {
      const tx = {
        cliente: {
          findUnique: vi.fn().mockImplementation(async () => ({ saldoCuentaCorriente: saldoTx })),
          update: vi.fn().mockImplementation(async ({ data }: { data: { saldoCuentaCorriente: number } }) => {
            saldoTx = data.saldoCuentaCorriente
            return { saldoCuentaCorriente: saldoTx }
          }),
        },
        cuentaCobrar: {
          create: vi.fn().mockResolvedValue({ id: 77 }),
        },
      }
      return fn(tx as never)
    })

    const result = await anotarFiadoLibreta({
      empresaId: 1,
      clienteId: 9,
      monto: 2500,
      concepto: "Gaseosas",
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.cuentaCobrarId).toBe(77)
      expect(result.monto).toBe(2500)
      expect(result.deuda).toBe(2500)
    }
  })

  it("cobrarFiadoLibreta emite recibo y baja deuda", async () => {
    mockPrismaClient.cliente.findFirst.mockResolvedValue({
      id: 9,
      nombre: "Juan",
      saldoCuentaCorriente: -2500,
      fiadoHabilitado: true,
    })

    let saldoTx = -2500
    mockPrismaClient.$transaction.mockImplementation(async (fn: (tx: typeof mockPrismaClient) => unknown) => {
      const tx = {
        cuentaCobrar: {
          findMany: vi.fn().mockResolvedValue([
            { id: 77, saldo: 2500, montoPagado: 0 },
          ]),
          findUnique: vi.fn().mockResolvedValue({ id: 77, saldo: 2500, montoPagado: 0 }),
          update: vi.fn().mockResolvedValue({}),
          create: vi.fn(),
        },
        recibo: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: 501, numero: "REC-FIADO-000001" }),
        },
        cliente: {
          findUnique: vi.fn().mockImplementation(async () => ({ saldoCuentaCorriente: saldoTx })),
          update: vi.fn().mockImplementation(async ({ data }: { data: { saldoCuentaCorriente: number } }) => {
            saldoTx = data.saldoCuentaCorriente
            return { saldoCuentaCorriente: saldoTx }
          }),
        },
      }
      return fn(tx as never)
    })

    const result = await cobrarFiadoLibreta({
      empresaId: 1,
      clienteId: 9,
      monto: 2500,
      medioPago: "efectivo",
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.reciboId).toBe(501)
      expect(result.deudaRestante).toBe(0)
      expect(result.cuentasAplicadas).toContain(77)
    }
  })

  it("rechaza anotar sin crédito disponible", async () => {
    mockPrismaClient.cliente.findFirst.mockResolvedValue({
      fiadoHabilitado: true,
      limiteCredito: 1000,
      saldoCuentaCorriente: -900,
      nombre: "Juan",
    })
    mockPrismaClient.empresa.findUnique.mockResolvedValue({ fiadoRequiereLimite: true })

    const result = await anotarFiadoLibreta({
      empresaId: 1,
      clienteId: 9,
      monto: 500,
    })

    expect(result.ok).toBe(false)
  })
})
