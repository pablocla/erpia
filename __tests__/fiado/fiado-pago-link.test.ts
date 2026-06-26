import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/mercadopago/mercadopago-service", () => ({
  obtenerConfigMP: vi.fn(),
  crearPreferenciaPago: vi.fn(),
}))

import { obtenerConfigMP, crearPreferenciaPago } from "@/lib/mercadopago/mercadopago-service"
import { resolverLinkPagoFiado } from "@/lib/fiado/fiado-pago-link"

beforeEach(() => {
  vi.clearAllMocks()
  mockPrismaClient.suscripcionModulo = {
    findFirst: vi.fn().mockResolvedValue(null),
  }
})

describe("resolverLinkPagoFiado", () => {
  it("devuelve null si MP inactivo y sin ClavPay", async () => {
    vi.mocked(obtenerConfigMP).mockResolvedValue({ activo: false, checkoutHabilitado: false } as never)

    const link = await resolverLinkPagoFiado({
      empresaId: 1,
      clienteId: 2,
      clienteNombre: "Juan",
      monto: 5000,
      facturaId: 10,
    })

    expect(link).toBeNull()
    expect(crearPreferenciaPago).not.toHaveBeenCalled()
  })

  it("genera link cuando MP está activo", async () => {
    vi.mocked(obtenerConfigMP).mockResolvedValue({ activo: true, checkoutHabilitado: true } as never)
    vi.mocked(crearPreferenciaPago).mockResolvedValue({ init_point: "https://mp.test/pay" } as never)

    const link = await resolverLinkPagoFiado({
      empresaId: 1,
      clienteId: 2,
      clienteNombre: "Juan",
      monto: 5000,
      facturaId: 10,
      cuentaCobrarId: 99,
    })

    expect(link).toBe("https://mp.test/pay")
    expect(crearPreferenciaPago).toHaveBeenCalledWith(
      expect.objectContaining({
        empresaId: 1,
        monto: 5000,
        cuentaCobrarId: 99,
        externalReference: "fiado-10-2",
      }),
    )
  })
})