import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/alertas/alertas-service", () => ({
  crearReglaAlerta: vi.fn().mockResolvedValue({ id: 101, nombre: "Guardián POS (Premium 7)" }),
}))

vi.mock("@/lib/ai/ia-notificacion-config", () => ({
  getIANotificacionConfig: vi.fn().mockResolvedValue({
    agentesNotificacion: {},
    evaluarReglasEnCron: false,
  }),
  saveIANotificacionConfig: vi.fn().mockResolvedValue({}),
}))

vi.mock("@/lib/config/rubro-config-service", () => ({
  setFeature: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/ops/sistema-log", () => ({
  persistSistemaLog: vi.fn().mockResolvedValue(undefined),
}))

import { crearReglaAlerta } from "@/lib/alertas/alertas-service"
import { saveIANotificacionConfig } from "@/lib/ai/ia-notificacion-config"
import { setFeature } from "@/lib/config/rubro-config-service"
import {
  activarGuardianPos,
  activarLiquidacionPagos,
  activarOcrCompras,
  REGLA_GUARDIAN_POS,
} from "@/lib/marketplace/premium-activators"

beforeEach(() => {
  vi.clearAllMocks()
  mockPrismaClient.reglaAlerta = {
    findFirst: vi.fn().mockResolvedValue(null),
    update: vi.fn(),
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
  }
})

describe("premium-activators", () => {
  it("activarGuardianPos crea regla y habilita agentes IA", async () => {
    const result = await activarGuardianPos(1)

    expect(crearReglaAlerta).toHaveBeenCalledWith(
      expect.objectContaining({
        empresaId: 1,
        nombre: REGLA_GUARDIAN_POS,
        tipoRegla: "diferencia_caja",
      }),
    )
    expect(saveIANotificacionConfig).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        agentesNotificacion: expect.objectContaining({ "guardian-pos": true }),
      }),
    )
    expect(result.reglaId).toBe(101)
  })

  it("activarLiquidacionPagos crea regla de liquidación", async () => {
    await activarLiquidacionPagos(3)

    expect(crearReglaAlerta).toHaveBeenCalledWith(
      expect.objectContaining({
        empresaId: 3,
        tipoRegla: "diferencia_caja",
      }),
    )
  })

  it("activarOcrCompras configura inbox y feature", async () => {
    const result = await activarOcrCompras(7)

    expect(setFeature).toHaveBeenCalledWith(
      7,
      "intang.ocr_compras",
      expect.objectContaining({
        parametros: expect.objectContaining({ inboxAlias: "compras+emp7@claver.com" }),
      }),
    )
    expect(result.inboxAlias).toContain("compras+emp7")
  })
})