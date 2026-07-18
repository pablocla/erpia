import { describe, expect, it, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/mercadopago/mercadopago-service", () => ({
  obtenerConfigMP: vi.fn(),
  crearPreferenciaPago: vi.fn(),
}))

import { obtenerConfigMP, crearPreferenciaPago } from "@/lib/mercadopago/mercadopago-service"
import {
  puedeGenerarLinkPago,
  resolverLinkPagoDeudor,
} from "@/lib/mercadopago/deudor-pago-link"

beforeEach(() => {
  vi.clearAllMocks()
  mockPrismaClient.suscripcionModulo = {
    findFirst: vi.fn().mockResolvedValue(null),
  }
})

describe("deudor-pago-link", () => {
  it("puedeGenerarLinkPago false sin MP ni ClavPay", async () => {
    vi.mocked(obtenerConfigMP).mockResolvedValue({ activo: false, checkoutHabilitado: false } as never)
    expect(await puedeGenerarLinkPago(1)).toBe(false)
  })

  it("genera link con external_ref cxc cuando hay cuentaCobrarId", async () => {
    vi.mocked(obtenerConfigMP).mockResolvedValue({ activo: true, checkoutHabilitado: true } as never)
    vi.mocked(crearPreferenciaPago).mockResolvedValue({ init_point: "https://mp.test/pay" } as never)

    const link = await resolverLinkPagoDeudor({
      empresaId: 1,
      clienteId: 9,
      clienteNombre: "Inquilino",
      monto: 450000,
      titulo: "Alquiler 2026-07",
      cuentaCobrarId: 55,
      facturaId: 10,
    })

    expect(link).toBe("https://mp.test/pay")
    expect(crearPreferenciaPago).toHaveBeenCalledWith(
      expect.objectContaining({
        externalReference: "cxc-55",
        monto: 450000,
        titulo: "Alquiler 2026-07",
      }),
    )
  })
})
