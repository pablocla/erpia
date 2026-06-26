import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/ai/notificacion-ia-service", () => ({
  crearAlertaIAConNotificacion: vi.fn().mockResolvedValue({ alerta: { id: 1 }, notificados: 1 }),
}))

vi.mock("@/lib/marketplace/guardian-pos-service", () => ({
  analizarRiesgoPosHoy: vi.fn().mockResolvedValue({
    nivel: "alto",
    score: 75,
    alertas: ["2 venta(s) anulada(s) hoy"],
    anulacionesHoy: 2,
    devolucionesHoy: 0,
    ventasHoy: 10,
  }),
}))

vi.mock("@/lib/marketplace/liquidacion-pagos-service", () => ({
  conciliarLiquidacionPagos: vi.fn().mockResolvedValue({
    alerta: false,
    diferencia: 0,
    ventasQrTarjeta: 0,
    liquidadoMp: 0,
  }),
}))

vi.mock("@/lib/marketplace/reponedor-jit-service", () => ({
  generarPropuestasReposicion: vi.fn().mockResolvedValue([]),
}))

vi.mock("@/lib/marketplace/recuperador-fiscal-service", () => ({
  auditarPercepcionesRecuperables: vi.fn().mockResolvedValue({
    alerta: false,
    montoRecuperableEstimado: 0,
    comprasSinDetalle: 0,
  }),
}))

import { crearAlertaIAConNotificacion } from "@/lib/ai/notificacion-ia-service"
import { GET } from "@/app/api/cron/premium-intangibles/route"

beforeEach(() => {
  vi.clearAllMocks()
  process.env.CRON_SECRET = "test-secret"
  mockPrismaClient.empresa = {
    findMany: vi.fn().mockResolvedValue([{ id: 1 }]),
  }
  mockPrismaClient.suscripcionModulo = {
    findMany: vi.fn().mockResolvedValue([{ sku: "intang.guardian_pos" }]),
  }
})

describe("cron premium-intangibles", () => {
  it("rechaza sin CRON_SECRET", async () => {
    const res = await GET(new Request("http://localhost/api/cron/premium-intangibles"))
    expect(res.status).toBe(401)
  })

  it("genera alerta cuando guardián detecta riesgo alto", async () => {
    const res = await GET(
      new Request("http://localhost/api/cron/premium-intangibles", {
        headers: { authorization: "Bearer test-secret" },
      }),
    )
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(crearAlertaIAConNotificacion).toHaveBeenCalledWith(
      expect.objectContaining({
        empresaId: 1,
        agenteId: "guardian-pos",
        prioridad: "alta",
      }),
    )
  })
})