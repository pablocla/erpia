import { beforeEach, describe, expect, it, vi } from "vitest"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/config/rubro-config-service", () => ({
  isFeatureActiva: vi.fn(),
  FEATURES: { CLAV_SHEETS: "clav_sheets" },
}))

import { isFeatureActiva } from "@/lib/config/rubro-config-service"
import {
  getSheetsEntitlement,
  requireSheetsExecute,
  requireSheetsExport,
  SHEETS_LIMITS,
} from "@/lib/reporting/sheets-entitlements"

describe("sheets-entitlements", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.suscripcionModulo.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.usageEvent.findUnique).mockResolvedValue(null)
    vi.mocked(isFeatureActiva).mockResolvedValue(false)
  })

  it("deniega sin suscripción ni feature", async () => {
    const result = await getSheetsEntitlement(1)
    expect(result.ok).toBe(false)
    expect(result.reason).toBe("module_not_entitled")
  })

  function mockSubscriptionForSku(sku: string) {
    vi.mocked(prisma.suscripcionModulo.findFirst).mockImplementation(async (args) => {
      const queried = (args as { where?: { sku?: string } }).where?.sku
      if (queried === sku) {
        return { sku, activo: true, limiteEventosMes: null, producto: {} } as never
      }
      return null
    })
  }

  it("permite acceso con suscripción pro", async () => {
    mockSubscriptionForSku("sheets.pro")

    const result = await getSheetsEntitlement(2)
    expect(result.ok).toBe(true)
    expect(result.tier).toBe("pro")
    expect(result.sku).toBe("sheets.pro")
  })

  it("aplica límite de consultas en lite", async () => {
    mockSubscriptionForSku("sheets.lite")
    vi.mocked(prisma.usageEvent.findUnique).mockImplementation(async (args) => {
      const key = (args as { where?: { empresaId_sku_eventKey_mes?: { eventKey?: string } } })
        .where?.empresaId_sku_eventKey_mes?.eventKey
      if (key === "execute") return { contador: SHEETS_LIMITS.lite.execute! } as never
      return { contador: 0 } as never
    })

    const result = await requireSheetsExecute(3)
    expect(result.ok).toBe(false)
    expect(result.reason).toBe("usage_execute_exceeded")
  })

  it("aplica límite de export en lite", async () => {
    vi.mocked(isFeatureActiva).mockResolvedValue(true)
    vi.mocked(prisma.usageEvent.findUnique).mockImplementation(async (args) => {
      const key = (args as { where?: { empresaId_sku_eventKey_mes?: { eventKey?: string } } })
        .where?.empresaId_sku_eventKey_mes?.eventKey
      if (key === "export") return { contador: SHEETS_LIMITS.lite.export! } as never
      return { contador: 0 } as never
    })

    const result = await requireSheetsExport(4)
    expect(result.ok).toBe(false)
    expect(result.reason).toBe("usage_export_exceeded")
  })
})