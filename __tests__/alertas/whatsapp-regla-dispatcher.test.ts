import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { encolarWhatsAppDesdeRegla } from "@/lib/alertas/whatsapp-regla-dispatcher"

vi.mock("@/lib/ai/ia-notificacion-config", () => ({
  getIANotificacionConfig: vi.fn().mockResolvedValue({
    whatsappReglasAutoAprobar: true,
    whatsappCobranzaAutoAprobar: false,
    whatsappCobranzaMaxPorRegla: 5,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockPrismaClient.mensajePendienteWhatsApp = {
    create: vi.fn().mockResolvedValue({ id: 1 }),
  }
})

describe("whatsapp-regla-dispatcher", () => {
  const empresaId = 1

  it("encola WA interno con teléfono en condición", async () => {
    const n = await encolarWhatsAppDesdeRegla(
      empresaId,
      {
        id: 1,
        nombre: "Stock bajo",
        tipoRegla: "stock_bajo",
        destinatarioId: null,
        condicion: JSON.stringify({ telefonoDestino: "11 1234-5678" }),
      },
      { titulo: "Stock bajo", mensaje: "5 productos críticos", prioridad: "alta" },
    )

    expect(n).toBe(1)
    expect(mockPrismaClient.mensajePendienteWhatsApp.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        empresaId,
        telefono: "+541112345678",
        estado: "aprobado",
        prioridad: 9,
      }),
    })
  })

  it("encola cobranza a clientes con teléfono", async () => {
    mockPrismaClient.empresa = { findUnique: vi.fn().mockResolvedValue({ nombre: "Metal SA" }) }
    mockPrismaClient.cuentaCobrar = {
      findMany: vi.fn().mockResolvedValue([
        {
          saldo: 50000,
          fechaVencimiento: new Date(Date.now() - 40 * 86_400_000),
          cliente: { id: 10, nombre: "Juan", telefono: "5491111111111", telefonoAlternativo: null },
        },
      ]),
    }

    const n = await encolarWhatsAppDesdeRegla(
      empresaId,
      {
        id: 2,
        nombre: "CxC vencida",
        tipoRegla: "cxc_vencida",
        destinatarioId: null,
        condicion: JSON.stringify({ valor: 30 }),
      },
      { titulo: "CxC", mensaje: "3 vencidas", prioridad: "alta", diasVencida: 30 },
    )

    expect(n).toBe(1)
    expect(mockPrismaClient.mensajePendienteWhatsApp.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tipo: "cobranza",
        estado: "pendiente",
        destinatario: "Juan",
      }),
    })
  })
})