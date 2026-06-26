import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/email/email-service", () => ({
  emailService: { enviar: vi.fn().mockResolvedValue({ ok: true, messageId: "1" }) },
}))

vi.mock("@/lib/ops/sistema-log", () => ({
  persistSistemaLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/platform/entitlements", () => ({
  canUseSku: vi.fn().mockResolvedValue({ ok: true, sku: "pos.fiado_barrio" }),
}))

import {
  calcularCreditoDisponible,
  deudaCliente,
  validarFiadoPos,
} from "@/lib/fiado/fiado-service"

beforeEach(() => {
  vi.clearAllMocks()
  mockPrismaClient.cliente = {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  }
  mockPrismaClient.empresa = {
    findUnique: vi.fn(),
  }
})

describe("fiado-service helpers", () => {
  it("deudaCliente usa saldo negativo", () => {
    expect(deudaCliente(-15000)).toBe(15000)
    expect(deudaCliente(500)).toBe(0)
  })

  it("calcularCreditoDisponible respeta límite", () => {
    expect(calcularCreditoDisponible(30000, -12000)).toBe(18000)
    expect(calcularCreditoDisponible(0, -1000)).toBe(Infinity)
  })
})

describe("validarFiadoPos", () => {
  it("rechaza cliente sin fiado habilitado", async () => {
    mockPrismaClient.cliente.findFirst.mockResolvedValue({
      fiadoHabilitado: false,
      limiteCredito: 10000,
      saldoCuentaCorriente: 0,
      nombre: "Juan",
    })
    mockPrismaClient.empresa.findUnique.mockResolvedValue({ fiadoRequiereLimite: true })

    const r = await validarFiadoPos(1, 1, 1000)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain("fiado habilitado")
  })

  it("rechaza si supera límite", async () => {
    mockPrismaClient.cliente.findFirst.mockResolvedValue({
      fiadoHabilitado: true,
      limiteCredito: 30000,
      saldoCuentaCorriente: -28000,
      nombre: "María",
    })
    mockPrismaClient.empresa.findUnique.mockResolvedValue({ fiadoRequiereLimite: true })

    const r = await validarFiadoPos(1, 2, 5000)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.disponible).toBe(2000)
  })

  it("aprueba venta dentro del límite", async () => {
    mockPrismaClient.cliente.findFirst.mockResolvedValue({
      fiadoHabilitado: true,
      limiteCredito: 30000,
      saldoCuentaCorriente: -10000,
      nombre: "Pedro",
    })
    mockPrismaClient.empresa.findUnique.mockResolvedValue({ fiadoRequiereLimite: true })

    const r = await validarFiadoPos(1, 3, 5000)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.disponible).toBe(20000)
  })
})