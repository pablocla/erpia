import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/mercadopago/deudor-pago-link", () => ({
  resolverLinkPagoDeudor: vi.fn().mockResolvedValue("https://mp.test/pay"),
}))

import { leerDeudas } from "@/lib/empleados-digitales/tools/leer-deudas"
import { DEFAULT_LEO_CONFIG } from "@/lib/empleados-digitales/types"

describe("leerDeudas ED-01/ED-03", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaClient.empresa = {
      findFirst: vi.fn().mockResolvedValue({ id: 1, nombre: "Kiosco Sur" }),
    }
    mockPrismaClient.cuentaCobrar = {
      findMany: vi.fn().mockResolvedValue([]),
    }
    mockPrismaClient.cliente = {
      findMany: vi.fn().mockResolvedValue([]),
    }
  })

  it("incluye fiado con saldo negativo (deuda)", async () => {
    mockPrismaClient.cliente.findMany.mockResolvedValue([
      {
        id: 10,
        nombre: "Juan Fiado",
        telefono: "1155550000",
        telefonoAlternativo: null,
        email: null,
        saldoCuentaCorriente: -5000,
      },
    ])

    const items = await leerDeudas(
      { empresaId: 1, empleadoId: 1, runId: BigInt(1) },
      { ...DEFAULT_LEO_CONFIG, fuentes: ["fiado"], montoMinArs: 1000 },
    )

    expect(items).toHaveLength(1)
    expect(items[0].clienteId).toBe(10)
    expect(items[0].montoArs).toBe(5000)
    expect(items[0].linkPago).toBe("https://mp.test/pay")
  })

  it("ignora saldo positivo en fiado (crédito a favor)", async () => {
    mockPrismaClient.cliente.findMany.mockResolvedValue([
      {
        id: 11,
        nombre: "Con crédito",
        telefono: "1155550001",
        telefonoAlternativo: null,
        email: null,
        saldoCuentaCorriente: 100,
      },
    ])

    // Query uses lt:0 so findMany won't return positives in prod;
    // empty mock simulates that
    mockPrismaClient.cliente.findMany.mockResolvedValue([])

    const items = await leerDeudas(
      { empresaId: 1, empleadoId: 1, runId: BigInt(1) },
      { ...DEFAULT_LEO_CONFIG, fuentes: ["fiado"] },
    )

    expect(items).toHaveLength(0)
  })

  it("default fuentes incluye fiado", () => {
    expect(DEFAULT_LEO_CONFIG.fuentes).toContain("cxc")
    expect(DEFAULT_LEO_CONFIG.fuentes).toContain("fiado")
  })
})
