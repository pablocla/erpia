import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/config/rubro-config-service", () => ({
  isFeatureActiva: vi.fn(),
  FEATURES: { AUTOMATION_N8N: "automation_n8n" },
}))

import { isFeatureActiva } from "@/lib/config/rubro-config-service"
import { canUseSku, requireAutomationEntitlement } from "@/lib/platform/entitlements"

describe("entitlements", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("permite acceso con suscripción activa", async () => {
    vi.mocked(prisma.suscripcionModulo.findFirst).mockResolvedValue({
      id: 1,
      empresaId: 1,
      sku: "automation.n8n_hub",
      activo: true,
      limiteEventosMes: null,
      producto: { limiteEventosMes: null },
    } as never)
    vi.mocked(prisma.usageEvent.findMany).mockResolvedValue([])

    const result = await canUseSku(1, "automation.n8n_hub")
    expect(result.ok).toBe(true)
    expect(result.source).toBe("subscription")
    expect(isFeatureActiva).not.toHaveBeenCalled()
  })

  it("deniega cuando se supera el límite mensual", async () => {
    vi.mocked(prisma.suscripcionModulo.findFirst).mockResolvedValue({
      id: 1,
      empresaId: 1,
      sku: "automation.n8n_hub",
      activo: true,
      limiteEventosMes: 100,
      producto: { limiteEventosMes: 100 },
    } as never)
    vi.mocked(prisma.usageEvent.findMany).mockResolvedValue([
      { contador: 100 },
    ] as never)

    const result = await canUseSku(1, "automation.n8n_hub")
    expect(result.ok).toBe(false)
    expect(result.reason).toBe("usage_limit_exceeded")
  })

  it("hace fallback a FeatureEmpresa sin suscripción", async () => {
    vi.mocked(prisma.suscripcionModulo.findFirst).mockResolvedValue(null)
    vi.mocked(isFeatureActiva).mockResolvedValue(true)

    const result = await requireAutomationEntitlement(2)
    expect(result.ok).toBe(true)
    expect(result.source).toBe("feature")
    expect(isFeatureActiva).toHaveBeenCalledWith(2, "automation_n8n")
  })

  it("deniega sin suscripción ni feature activa", async () => {
    vi.mocked(prisma.suscripcionModulo.findFirst).mockResolvedValue(null)
    vi.mocked(isFeatureActiva).mockResolvedValue(false)

    const result = await requireAutomationEntitlement(3)
    expect(result.ok).toBe(false)
    expect(result.reason).toBe("module_not_entitled")
  })
})