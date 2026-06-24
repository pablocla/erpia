import { describe, it, expect, vi, beforeEach } from "vitest"
import { cotizarMultiCarrier } from "@/lib/logistica/shipping-orchestrator"

vi.mock("@/lib/integrations/credentials", () => ({
  obtenerCredencialesIntegracion: vi.fn().mockResolvedValue({ row: null, credenciales: {} }),
}))

describe("ShippingOrchestrator", () => {
  beforeEach(() => vi.clearAllMocks())

  it("cotizarMultiCarrier devuelve 3 opciones en sandbox", async () => {
    const cotizaciones = await cotizarMultiCarrier({
      empresaId: 1,
      cpOrigen: "1000",
      cpDestino: "5000",
      pesoKg: 2,
      bultos: 1,
    })

    expect(cotizaciones.length).toBe(3)
    expect(cotizaciones[0].precio).toBeLessThanOrEqual(cotizaciones[cotizaciones.length - 1].precio)
    const ids = cotizaciones.map((c) => c.carrierId)
    expect(ids).toContain("andreani")
    expect(ids).toContain("oca")
    expect(ids).toContain("correo_argentino")
  })
})