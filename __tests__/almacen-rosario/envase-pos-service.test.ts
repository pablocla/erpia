import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/prisma", () => ({ prisma: mockPrismaClient }))

import {
  registrarMovimientoEnvasePos,
  saldoEnvasesCliente,
} from "@/lib/almacen-rosario/envase-pos-service"

beforeEach(() => {
  vi.clearAllMocks()
  mockPrismaClient.tipoEnvase = {
    findFirst: vi.fn().mockResolvedValue({
      valorDeposito: 3500,
      nombre: "Cajón Coca 2.25L x8",
    }),
    findMany: vi.fn().mockResolvedValue([
      { id: 1, nombre: "Cajón Coca 2.25L x8", valorDeposito: 3500 },
    ]),
    create: vi.fn(),
  }
  mockPrismaClient.movimientoEnvase = {
    create: vi.fn().mockResolvedValue({ id: 99 }),
    groupBy: vi.fn().mockResolvedValue([
      { tipoEnvaseId: 1, tipo: "entrega", _sum: { cantidad: 3 } },
      { tipoEnvaseId: 1, tipo: "retorno", _sum: { cantidad: 1 } },
    ]),
  }
  mockPrismaClient.caja = {
    findFirst: vi.fn().mockResolvedValue({ id: 5 }),
  }
  mockPrismaClient.movimientoCaja = {
    create: vi.fn().mockResolvedValue({}),
  }
})

describe("envase-pos-service", () => {
  it("exige cliente para préstamo", async () => {
    await expect(
      registrarMovimientoEnvasePos({
        empresaId: 1,
        tipoEnvaseId: 1,
        tipo: "entrega",
        cantidad: 2,
      }),
    ).rejects.toThrow("Seleccioná un cliente")
  })

  it("registra entrega con depósito en caja", async () => {
    const r = await registrarMovimientoEnvasePos({
      empresaId: 1,
      tipoEnvaseId: 1,
      tipo: "entrega",
      cantidad: 2,
      clienteId: 10,
      cobrarDeposito: true,
    })
    expect(r.montoCaja).toBe(7000)
    expect(r.tipo).toBe("entrega")
    expect(mockPrismaClient.movimientoCaja.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tipo: "ingreso", monto: 7000 }),
      }),
    )
  })

  it("calcula saldo neto por cliente", async () => {
    const saldo = await saldoEnvasesCliente(1, 10)
    expect(saldo).toHaveLength(1)
    expect(saldo[0].saldo).toBe(2)
    expect(saldo[0].depositoPendiente).toBe(7000)
  })
})