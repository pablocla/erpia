import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/alertas/whatsapp-regla-dispatcher", () => ({
  normalizarTelefono: vi.fn((t: string) => (t ? `+54${t.replace(/\D/g, "")}` : null)),
}))

import { encolarWhatsAppFiado } from "@/lib/fiado/fiado-whatsapp"

beforeEach(() => {
  vi.clearAllMocks()
  mockPrismaClient.suscripcionModulo = {
    findFirst: vi.fn().mockResolvedValue({ sku: "com.whatsapp", activo: true }),
  }
  mockPrismaClient.empresa = {
    findUnique: vi.fn().mockResolvedValue({ fiadoNotificarWhatsApp: true }),
  }
  mockPrismaClient.mensajePendienteWhatsApp = {
    create: vi.fn().mockResolvedValue({ id: 1 }),
  }
})

describe("encolarWhatsAppFiado", () => {
  it("no encola sin teléfono", async () => {
    const ok = await encolarWhatsAppFiado({
      empresaId: 1,
      clienteNombre: "Ana",
      telefono: null,
      totalVenta: 1000,
      deudaTotal: 5000,
      almacenNombre: "Kiosco",
    })
    expect(ok).toBe(false)
    expect(mockPrismaClient.mensajePendienteWhatsApp.create).not.toHaveBeenCalled()
  })

  it("encola mensaje con link de pago", async () => {
    const ok = await encolarWhatsAppFiado({
      empresaId: 1,
      clienteNombre: "Ana",
      telefono: "1155551234",
      totalVenta: 1000,
      deudaTotal: 5000,
      linkPago: "https://mp.test/pay",
      almacenNombre: "Kiosco Norte",
    })

    expect(ok).toBe(true)
    expect(mockPrismaClient.mensajePendienteWhatsApp.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          empresaId: 1,
          tipo: "fiado",
          prioridad: 7,
          estado: "aprobado",
          mensaje: expect.stringContaining("https://mp.test/pay"),
        }),
      }),
    )
  })

  it("no encola si WhatsApp desactivado en config", async () => {
    mockPrismaClient.empresa.findUnique.mockResolvedValue({ fiadoNotificarWhatsApp: false })

    const ok = await encolarWhatsAppFiado({
      empresaId: 1,
      clienteNombre: "Ana",
      telefono: "1155551234",
      totalVenta: 1000,
      deudaTotal: 5000,
      almacenNombre: "Kiosco",
    })

    expect(ok).toBe(false)
  })
})