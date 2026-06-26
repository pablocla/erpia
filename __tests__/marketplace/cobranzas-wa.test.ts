import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/alertas/alertas-service", () => ({
  crearReglaAlerta: vi.fn().mockResolvedValue({ id: 99, nombre: "Secretaria Cobranzas WA (AutoPool)" }),
}))

vi.mock("@/lib/ai/ia-notificacion-config", () => ({
  saveIANotificacionConfig: vi.fn().mockResolvedValue({}),
}))

vi.mock("@/lib/ops/sistema-log", () => ({
  persistSistemaLog: vi.fn().mockResolvedValue(undefined),
}))

import { crearReglaAlerta } from "@/lib/alertas/alertas-service"
import { saveIANotificacionConfig } from "@/lib/ai/ia-notificacion-config"
import { activarSecretariaCobranzas } from "@/lib/marketplace/cobranzas-wa-service"

beforeEach(() => {
  vi.clearAllMocks()
  mockPrismaClient.reglaAlerta = {
    findFirst: vi.fn().mockResolvedValue(null),
  }
})

describe("activarSecretariaCobranzas", () => {
  it("crea regla cxc_vencida y guarda config IA", async () => {
    const result = await activarSecretariaCobranzas(1, { diasVencimiento: 10 })

    expect(crearReglaAlerta).toHaveBeenCalledWith(
      expect.objectContaining({
        empresaId: 1,
        tipoRegla: "cxc_vencida",
      }),
    )
    expect(saveIANotificacionConfig).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ whatsappCobranzaMaxPorRegla: 20 }),
    )
    expect(result.reglaId).toBe(99)
  })

  it("reutiliza regla existente sin crear otra", async () => {
    mockPrismaClient.reglaAlerta.findFirst.mockResolvedValue({ id: 42, nombre: "Secretaria Cobranzas WA (AutoPool)" })

    const result = await activarSecretariaCobranzas(5)

    expect(crearReglaAlerta).not.toHaveBeenCalled()
    expect(result.reglaId).toBe(42)
  })
})