import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/empleados-digitales/is-leo-activo", () => ({
  isLeoActivo: vi.fn().mockResolvedValue(true),
}))

import { handleLeoInboundWhatsApp } from "@/lib/empleados-digitales/inbound-whatsapp"
import { isLeoActivo } from "@/lib/empleados-digitales/is-leo-activo"

describe("handleLeoInboundWhatsApp ED-16", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(isLeoActivo as ReturnType<typeof vi.fn>).mockResolvedValue(true)
    mockPrismaClient.cliente = {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 5,
          nombre: "Pedro",
          telefono: "1155559999",
          saldoCuentaCorriente: -8000,
        },
      ]),
    }
    mockPrismaClient.empleadoDigital = {
      findFirst: vi.fn().mockResolvedValue({ id: 2 }),
    }
    mockPrismaClient.empleadoDigitalTarea = {
      create: vi.fn().mockResolvedValue({ id: BigInt(99) }),
    }
    mockPrismaClient.mensajePendienteWhatsApp = {
      create: vi.fn().mockResolvedValue({ id: 1 }),
    }
  })

  it("crea tarea verificar_pago en ya pagué", async () => {
    const r = await handleLeoInboundWhatsApp({
      empresaId: 1,
      fromPhone: "+5491155559999",
      body: "ya pague",
    })
    expect(r.handled).toBe(true)
    if (r.handled) expect(r.action).toBe("ya_pague")
    expect(mockPrismaClient.empleadoDigitalTarea.create).toHaveBeenCalled()
  })

  it("no maneja si no es intent leo", async () => {
    const r = await handleLeoInboundWhatsApp({
      empresaId: 1,
      fromPhone: "+5491155559999",
      body: "hola que tal",
    })
    expect(r.handled).toBe(false)
  })
})
